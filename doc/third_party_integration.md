# Abysalto Webshop - Third-Party Integration Strategy

This document details the architectural patterns, integration pipelines, and resiliency systems used to connect the Abysalto Webshop with external third-party systems. Key areas of focus include **Tax Administration and Compliance** (real-time tax calculations, electronic invoicing, and regional fiscalization), ERP integration, and shipping carriers.

---

## 1. Architectural Strategy: Isolated Adapter Pattern

To insulate the high-performance core e-commerce backend from external latency spikes, network failures, and vendor-specific data structures, the platform utilizes the **Adapter (or Gateway) Pattern**. 

All communication with external third-party services is managed by standalone, lightweight microservices deployed to **Google Kubernetes Engine (GKE)**. Core business domains (such as `order-service` or `payment-service`) only interact with standardized internal JSON schemas and never connect directly to third-party endpoints.

```mermaid
graph TD
    %% Checkout / Order Engine
    subgraph CoreServices ["Core Services (GKE)"]
        direction TB
        OrderSvc["Order & Checkout Service"]
    end

    %% Caching & Queue Layer
    subgraph StorageLayer ["Resiliency Caching & Events"]
        RedisCache["GCP Memorystore (Tax Tables)"]
        PubSub["GCP Pub/Sub Event Broker"]
    end

    OrderSvc -->|1. Read Local Fallback| RedisCache
    OrderSvc -->|3. Publish completed order| PubSub

    %% Isolated Adapters Layer
    subgraph Adapters ["Integration Adapters (GKE)"]
        TaxAdapter["Tax Compliance Adapter (Avalara/Vertex)"]
        FiscalAdapter["Regional Fiscalization Adapter (Gov Portal)"]
        CarrierAdapter["Carrier Integration Adapter (UPS/DHL)"]
    end

    OrderSvc -->|2. Get Real-time Tax - REST and Circuit Breaker| TaxAdapter
    PubSub -->|4. Subscribe: order-completed| FiscalAdapter

    %% External Ecosystem
    subgraph External ["External Third-Party Ecosystem"]
        TaxEngine["External Tax API (Vertex / Avalara)"]
        GovPortal["National Tax Administration Portal (e.g., SDI, KSeF)"]
        CarrierAPI["Carrier APIs (EasyPost / Shippo)"]
    end

    TaxAdapter -->|Secure HTTPS| TaxEngine
    FiscalAdapter -->|Secure HTTPS + mTLS| GovPortal
    CarrierAdapter -->|Secure HTTPS| CarrierAPI
```

---

## 2. Real-Time Checkout Integrations (Synchronous Path)

Certain integrations, such as tax/VAT calculation or real-time shipping rate computation, reside directly on the synchronous checkout path. Any latency or downtime in these external services directly threatens conversion rates.

### 2.1. Circuit Breaker & Timeout Configuration
To ensure a high-performing checkout experience, the platform enforces strict service levels using **Resilience4j** in our Spring Boot adapters:

*   **Strict Timeouts:** Direct calls to external tax/shipping APIs are capped at a **500ms timeout budget**. If the adapter does not respond within this window, the connection is aborted.
*   **Circuit Breakers:** If the error rate for external calls exceeds **20%** over a sliding window of 100 requests, the circuit breaker trips (opens), instantly failing fast and routing requests to the offline fallback layer.
*   **Rate Limiting & Throttling:** Adapters actively monitor and enforce vendor-specific rate limits using sliding-window rate limiters.

### 2.2. Offline Fallback & Estimator Engine (Tax Resilience)
If the circuit breaker opens or a timeout is triggered, the `Order Service` falls back gracefully to a localized **Tax Estimator Engine**:

1.  **Cached Tax Tables:** A lightweight cron job runs every 24 hours to download generalized regional sales tax / VAT rates from our tax provider and writes them into **GCP Memorystore for Redis** (with backup persistence in PostgreSQL).
2.  **Estimation Logic:** If the external API is unreachable, the system queries the local cache using the customer's `ShippingCountryCode` and `ShippingPostalCode` / `ShippingState` to apply a safe, highly accurate estimated tax.
3.  **Audit Flagging:** The order is flagged in `order_db` with `TaxCalculationMethod = "ESTIMATED"`.
4.  **Asynchronous Reconciliation:** Once the order is placed, an asynchronous background job re-submits the invoice to the tax portal for exact, final tax calculation, adjusting the final accounting ledger records in the background without affecting the user's checkout experience.

---

## 3. Asynchronous Compliance & Reporting (Electronic Invoicing & Fiscalization)

Many countries (e.g., Italy's SDI, Poland's KSeF, or Mexico's SAT) mandate that e-commerce merchants submit digital invoices or fiscal records in near-real-time directly to government servers. This reporting must happen after order finalization and must guarantee reliable, once-and-only-once delivery.

### 3.1. The Transactional Outbox Pattern
To prevent distributed transaction failures, we do not call the government compliance APIs directly inside the database transaction. Instead, we implement the **Transactional Outbox Pattern**:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Browser
    participant Order as Order Service
    participant DB as PostgreSQL (order_db)
    participant Outbox as Postgres Outbox Table
    participant Worker as Outbox Event Worker
    participant TaxApp as Fiscalization Adapter
    participant Gov as Govt Tax Administration

    Client->>Order: Complete Checkout
    activate Order
    Order->>DB: Write Order & Tax Snapshot (Single Transaction)
    Note over DB: Atomically records order details<br/>and appends outbound compliance events.
    DB-->>Order: Transaction Committed
    Order-->>Client: Return Order Confirmation
    deactivate Order

    activate Outbox
    DB->>Outbox: Append Outbox Record
    Outbox->>Worker: Read and Publish Event
    deactivate Outbox
    activate Worker

    Worker->>TaxApp: Invoke Normalized Compliance Job
    activate TaxApp
    TaxApp->>Gov: Submit Electronic Invoice (HTTPS + TLS Client Cert)
    Gov-->>TaxApp: Return Registration ID (UUID) & Digital Signature
    TaxApp-->>Worker: Invoice Registered Successfully
    deactivate TaxApp

    Worker->>DB: Mark Outbox Record "PROCESSED" (Set Register ID)
    deactivate Worker
```

### 3.2. Deduplication & Idempotency
Because government networks frequently experience transient network dropouts and timeouts, the `Fiscalization Adapter` must enforce absolute idempotency:
*   **Deterministic Transaction IDs:** Every submission payload includes an `Idempotency-Key` formed by hashing the internal Order ID and the state version (`UUID-v4` or `order-id_hash`).
*   **Two-Phase Registration:** If an API call to a state portal times out, the adapter queries the government endpoint using the `Idempotency-Key` to verify if the document was already processed before attempting a re-submission.
*   **Dead Letter Queues (DLQs):** Events that fail after 5 retries are moved to a dedicated GCP Pub/Sub Dead Letter Topic (`fiscal-reporting-dlq`). Compliance officers are immediately alerted via **Cloud Monitoring / PagerDuty** to resolve tax issues manually before monthly filing deadlines.

---

## 4. Normalized Data Schemas

To maintain standard interfaces across all integration adapters, the core services utilize generic, highly descriptive request and response structures.

### 4.1. Tax Calculation Request Payload
This schema is passed from the `Order Service` to the `Tax Compliance Adapter`:

```json
{
  "transactionId": "ord_9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "transactionDateTime": "2026-06-29T18:40:00Z",
  "currency": "USD",
  "originAddress": {
    "streetAddress": "100 Google Way",
    "city": "Mountain View",
    "state": "CA",
    "postalCode": "94043",
    "country": "US"
  },
  "destinationAddress": {
    "streetAddress": "555 Broadway",
    "city": "New York",
    "state": "NY",
    "postalCode": "10012",
    "country": "US"
  },
  "items": [
    {
      "itemId": "sku_run_100_blue",
      "taxCode": "PC040100",
      "quantity": 2,
      "unitPrice": 120.00,
      "discountAmount": 10.00
    }
  ]
}
```

### 4.2. Tax Calculation Response Payload
The normalized output returned by the `Tax Compliance Adapter`:

```json
{
  "transactionId": "ord_9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "subtotalAmount": 230.00,
  "taxAmount": 20.41,
  "totalAmount": 250.41,
  "calculationMethod": "EXTERNAL_API",
  "taxDetails": [
    {
      "itemId": "sku_run_100_blue",
      "rate": 0.08875,
      "amount": 20.41,
      "taxAuthority": "NEW YORK STATE / CITY"
    }
  ]
}
```

---

## 5. Security & Key Management

When interfacing with regional tax administrations and billing networks, maximum compliance and security are non-negotiable.

1.  **Workload Identity-Based Vaulting:** Third-party credentials, client SSL keys, and government-issued API certificates are stored inside **GCP Secret Manager**. Microservices running on GKE use GCP Workload Identity to fetch secrets dynamically without persisting keys on disks.
2.  **mTLS and Client Certificates:** Government portals typically mandate mutual TLS (mTLS) with custom client certificates. The GKE Ingress or Apigee Proxy manages these certificates securely, automatically rotating them via Cloud KMS/Keyring integration.
3.  **GDPR & Data Privacy:** Personal Identifiable Information (PII) like customer names or precise home addresses are tokenized or generalized before transmission to external auditing APIs where legally permissible.
