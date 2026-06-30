# Abysalto Webshop - High-Level Design Document

This high-level design document outlines the system architecture and implementation strategy for the **Abysalto Webshop**—a modern, enterprise-grade, omni-channel retail platform engineered to support millions of daily active users, secure global transactions, and real-time processing.

---

## 1. Architectural Overview

### 1.1 Tech Stack Selection
*   **Frontend (Sales Channels):** Next.js (Web Shop), Native/Hybrid iOS & Android (Mobile App).
*   **Backend (API & Logic):** Spring Boot 3.x (Java 21) organized in a multi-module monorepo and run on Google Kubernetes Engine (GKE).
*   **Databases:** GCP Cloud SQL for PostgreSQL (Primary Relational DB with Read Replicas & Connection Pooling), GCP Firestore (NoSQL Document Store for flexible catalog metadata/user settings).
*   **Caching & Queueing:** GCP Memorystore for Redis, GCP Pub/Sub (Event-driven message broker).
*   **Security & Edge:** GCP Cloud DNS, GCP Cloud CDN, GCP Cloud Armor, GCP Apigee API Gateway.

### 1.2 System Sketch & Communication

![High-Level Architecture Diagram](architecture.svg)

---

## 2. Scaling Strategy

To handle high traffic spikes seamlessly (e.g., millions of daily active users, flash sales) using standard open-source tools:
*   **Highly Available Relational Database (GCP Cloud SQL for PostgreSQL):** 
    *   Deployed in a High-Availability (HA) multi-zone configuration.
    *   Utilizes **Read Replicas** distributed across major geographic regions to offload read-heavy SQL operations.
    *   Integrates **PgBouncer** connection poolers to handle tens of thousands of concurrent database connections from GKE.
*   **In-Memory Caching (Memorystore for Redis):** Offloads Catalog read requests. Read operations are served directly from cache (sub-millisecond latency), while writes update PostgreSQL and invalidate corresponding Redis entries.
*   **Auto-Scaling Containers (GKE HPA):** Horizontal Pod Autoscaler (HPA) scales microservice instances dynamically based on CPU/Memory utilization and Custom Metrics (e.g., incoming Pub/Sub queue depth).
*   **Edge Caching (GCP Cloud CDN):** Next.js uses Incremental Static Regeneration (ISR) to compile static catalog pages that are cached globally, reducing backend server loads to virtually zero for read-heavy operations.

---

## 3. Security & Authentication

*   **API Security & OAuth2:** GCP Apigee manages rate-limiting, request validation, and acts as the OAuth2/OpenID Connect (OIDC) authorization server, verifying JWT tokens before requests hit downstream GKE services.
*   **DDoS & WAF Protection:** GCP Cloud Armor guards edge endpoints with pre-configured WAF rules against OWASP Top 10 risks, rate-limiting malicious bots, and geo-blocking unauthorized traffic.
*   **Data Security & Compliance:**
    *   **In Transit:** Strict TLS 1.3 encryption across all channel endpoints and internal gRPC/mTLS communication.
    *   **At Rest:** Data is encrypted natively by Google Cloud KMS keys. High-sensitivity transaction fields are envelope-encrypted at the application layer.
    *   **Compliance:** Payment processing is delegated to PCI-DSS-compliant gateways, keeping sensitive cardholder data out of our primary storage.

---

## 4. Key Components & Responsibilities

The Spring Boot monorepo backend is decomposed into independent, domain-driven microservices:
1.  **Catalog Service:** Handles product searches, categories, stock levels, and utilizes Redis caches.
2.  **Order & Checkout Service:** Processes shopping carts, calculates totals, applies promotional rules, and initiates transaction records in PostgreSQL.
3.  **User & Profile Service:** Manages customer records, delivery addresses, and organization hierarchies for corporate accounts.
4.  **Payment Gateway Service:** Interfaces securely with third-party payment providers (Stripe, Adyen) to finalize payments.
5.  **Notification Service:** An asynchronous consumer triggered by Pub/Sub events to send real-time confirmation emails, SMS, and push notifications.

---

## 5. External Integrations

*   **Marketplace Integrations:** Dedicated adapter services consume `OrderCreated` and `InventoryChanged` events from GCP Pub/Sub to synchronize inventory levels and import orders from external marketplaces (e.g., Amazon, eBay) using rate-limited API workers.
*   **B2B Integrations:** Partner ERP systems connect via a dedicated B2B REST/EDI Gateway. This gateway supports bulk order submissions, personalized contractual price sheets, and complex corporate hierarchies.
*   **Tax Administration (Fiscalization):** The payment and checkout flow integrates a real-time Tax Adapter. This adapter signs invoice transactions and reports sales figures to the governmental Tax Administration API synchronously during checkout, ensuring strict local tax compliance and legal invoice validation.

---

## 6. Monitoring & Alerting

*   **Telemetry Framework:** Build on standard **OpenTelemetry** and integrated with **Google Cloud Operations Suite** (Logging, Monitoring, Trace).
*   **Distributed Tracing:** Micrometer Tracing injects a standard W3C context header (`traceparent`) into every edge request, tracing requests as they cross GKE microservices, Pub/Sub, and PostgreSQL.
*   **Metrics & Health Checks:** GKE scrapes Prometheus metrics via Spring Boot `/actuator/prometheus` endpoints. Actuator health probes (`/actuator/health/liveness` and `/actuator/health/readiness`) allow GKE to automatically restart unhealthy pods or remove them from load-balancing.
*   **System Alerting:** Automated Google Cloud Monitoring policies trigger PagerDuty and Slack alerts on critical anomalies (e.g., latency spikes > 500ms, HTTP 5xx rates > 1%, disk/memory saturation > 85%).

---

## 7. Delivery Plan

*   **Environments:** The system uses two main GCP projects:
    1.  **Staging:** Runs on the `staging` branch. Used for full end-to-end integration and automated QA testing.
    2.  **Production:** Runs on the `main` branch. Served to live global traffic and protected by restricted access.
*   **CI/CD Pipeline (GitHub Actions):**
    *   **Continuous Integration (CI):** Every Pull Request triggers automated linting, Checkstyle/SonarQube analysis, unit tests, and integration testing using Testcontainers (local Redis/PostgreSQL mocks).
    *   **Continuous Deployment (CD):** Pushes to the `staging` branch compile distroless Docker containers, publish them to Google Artifact Registry, and trigger a rolling update to GKE Staging.
    *   **Production Deployment:** Deploying to GKE Production is gated. Pushing to `main` builds the release candidates, but requires a manual release sign-off (approval gate) before updating GKE Production pods and flushing the CDN cache.
