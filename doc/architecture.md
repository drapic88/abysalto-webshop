# Abysalto Webshop - High-Level Architecture Draft

This document outlines the first draft of the high-level system architecture for the Abysalto Webshop retail platform. The platform is designed to serve a global market with millions of active users daily, supporting multiple sales channels, real-time data processing, secure transactions, and extreme scalability.

> [!TIP]
> For detailed implementation strategies on handling extreme scale, secure transactions, and real-time processing pipelines, see the **[Technical Architecture Deep-Dive](deep_dive.md)**.
> For specifications on metrics, health checks, and alerting, see the **[Monitoring & Observability Plan](observability.md)**.
> For branching strategy, environment mappings, and CI/CD pipelines, see the **[Delivery Plan](delivery.md)**.


---

## 1. System Goals & Architecture Principles

*   **Scalability & High Availability:** Support millions of daily active users with low latency, using auto-scaling, caching, and a distributed cloud infrastructure on Google Cloud Platform (GCP).
*   **Omnichannel Support:** Provide consistent business logic across web, mobile, marketplace, and B2B channels.
*   **Secure Transactions:** Ensure PCI-DSS compliance, robust encryption in transit and at rest, and protection against malicious traffic.
*   **Real-Time Capabilities:** Process inventory changes, order updates, and search analytics in real time.
*   **Extensibility:** Decouple components using an event-driven design to allow cross-functional teams to work independently.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    %% Sales Channels
    subgraph Channels ["Sales Channels"]
        Web["🌍 Web Shop (Next.js)"]
        Mobile["📱 Mobile App (iOS / Android)"]
        Marketplace["🛒 Marketplace Integrations (Amazon, eBay, etc.)"]
        B2B["🔗 B2B Integrations (APIs / EDI)"]
    end

    %% Edge & Security
    subgraph Edge ["Security & Delivery Layer"]
        DNS["GCP Cloud DNS"] --> CDN["GCP Cloud CDN / Media"]
        CDN --> Armor["GCP Cloud Armor (WAF/DDoS Protection)"]
        Armor --> APIGateway["GCP Apigee / Cloud API Gateway"]
    end

    Channels --> DNS

    %% API Layer (Spring Boot)
    subgraph APILayer ["API & Business Logic Layer (Spring Boot)"]
        direction TB
        CatalogSvc["Catalog Service"]
        OrderSvc["Order & Checkout Service"]
        UserSvc["User & Profile Service"]
        PaymentSvc["Payment Gateway Service"]
        NotificationSvc["Notification Service"]
    end

    APIGateway --> CatalogSvc
    APIGateway --> OrderSvc
    APIGateway --> UserSvc
    APIGateway --> PaymentSvc

    %% Message Broker & Real-Time Processing
    subgraph EventStream ["Event & Real-Time Processing"]
        PubSub["GCP Pub/Sub (Event Broker)"]
    end

    CatalogSvc --> PubSub
    OrderSvc --> PubSub
    PubSub --> NotificationSvc

    %% Database & Cache Layer
    subgraph StorageLayer ["Database & Caching"]
        Cache["In-Memory Cache (GCP Memorystore for Redis)"]
        PrimaryDB[(Relational DB - GCP Cloud SQL PostgreSQL)]
        NoSQLDB[(NoSQL DB - GCP Firestore)]
    end

    CatalogSvc --> Cache
    OrderSvc --> PrimaryDB
    UserSvc --> PrimaryDB
    PaymentSvc --> PrimaryDB
```

---

## 3. Architecture Breakdown

### 3.1. Sales Channels (Frontend & Integrations)
To target a diverse customer base, the system supports four main entry points:
*   **Web Shop:** A modern, fast, and responsive Next.js application, leveraging Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR) to deliver optimal global SEO and sub-second load times via GCP Cloud CDN.
*   **Mobile Applications:** Native or hybrid mobile applications communicating with the same backend APIs.
*   **Marketplace Integrations:** Background integration workers and adapter microservices that synchronize inventory, pricing, and orders with external marketplaces. For our decoupled microservice adapter patterns, see the detailed **[Marketplace Integration Architecture](marketplace_integration.md)**.
*   **B2B Integrations:** Secure partner-facing REST APIs or EDI gateways enabling high-volume bulk ordering and contract pricing. For our enterprise customer hierarchies, contract pricing, and schema specifications, see the detailed **[B2B Integration Architecture](b2b_integration.md)**.

### 3.2. API & Business Logic Layer (Spring Boot 3.x)

The backend business logic is built on **Spring Boot 3.x** and **Java 21**, structured as a **Multi-Module Monorepo** and deployed as independent microservices to Google Kubernetes Engine (GKE).

#### 3.2.1. Codebase Structure: Multi-Module Monorepo
A single Git repository is split into distinct Maven/Gradle modules. This keeps development fast, simplifies common dependencies, and supports clean separation of concerns.

```text
abysalto-webshop/
├── .github/workflows/         # CI/CD pipelines (targeted module builds)
├── build.gradle               # Root build file managing global library versions
├── settings.gradle            # Registers all sub-modules
│
├── core-common/               # Shared non-business module
│   ├── src/main/java/com/abysalto/core/
│   │   ├── security/          # JWT validation filters, CORS configuration
│   │   ├── exception/         # Global API error handlers, RFC-7807 formats
│   │   └── dto/               # Shared general payloads (e.g., Address, Money)
│   └── build.gradle
│
├── catalog-service/           # Catalog & inventory queries (Team A)
│   ├── src/main/java/com/abysalto/catalog/
│   ├── Dockerfile
│   └── build.gradle
│
├── order-service/             # Checkout & checkout state (Team B)
│   ├── src/main/java/com/abysalto/order/
│   ├── Dockerfile
│   └── build.gradle
│
└── payment-service/           # High-security gateway wrapper (Team B)
    ├── src/main/java/com/abysalto/payment/
    ├── Dockerfile
    └── build.gradle
```

##### Module Responsibilities & Build Pipeline
*   **Root Dependency Management:** The root `build.gradle` defines standard dependency versions (e.g., Spring Boot 3.x, Spring Cloud, MapStruct, Lombok) to guarantee version consistency across all teams.
*   **The `core-common` Module:** Houses boilerplate logic (logging, tracing, security, errors). It is imported as a library by local microservices (e.g., `implementation project(':core-common')`). It **never** contains business domain objects to prevent coupling.
*   **Targeted CI/CD Builds:** To avoid building the entire monorepo on every commit, the GitHub Actions or Google Cloud Build pipeline utilizes path filters (e.g., `paths: ['catalog-service/**']`). If a change only occurs inside the catalog service, only its Docker image is built and deployed to GKE.

#### 3.2.2. API Gateway & Routing Strategy
To securely expose backend domains to different sales channels, the API layer is split into a **B2C Edge** and a **B2B/Partner Edge**.

```mermaid
graph TD
    %% Sales Channels
    Web["🌍 Web Shop (Next.js)"] --> BFF["B2C BFF (Spring Cloud Gateway)"]
    Mobile["📱 Mobile App"] --> BFF
    
    Market["🛒 Marketplaces"] --> Apigee["Partner Edge (GCP Apigee)"]
    B2B["🔗 B2B Partners"] --> Apigee

    %% Gateways to Services
    BFF -->|gRPC / REST| Catalog["Catalog Service"]
    BFF -->|REST| Order["Order Service"]
    
    Apigee -->|Secure REST| Order
    Apigee -->|Secure REST| Inventory["Inventory Service"]
```

##### 1. B2C Edge: Backend-for-Frontend (BFF) Gateway
*   **Technology:** Spring Cloud Gateway (built on Spring WebFlux for reactive, non-blocking performance) or a GraphQL Gateway.
*   **Aggregation:** Minimizes mobile network payloads by aggregating calls. A single request to `GET /home` on the mobile app is translated by the BFF into parallel backend calls to `Catalog Service` and `User Service`, stitching the result into one response.
*   **Client Session Validation:** Inspects and validates JWTs emitted by the identity provider, inserting authenticated headers (e.g., `X-User-Id`, `X-User-Roles`) before routing requests downstream.

##### 2. Partner Edge: GCP Apigee Gateway
*   **mTLS and API Keys:** Secures server-to-server B2B integrations requiring mutual TLS (mTLS) or custom API Keys.
*   **Transformation & Translation:** Translates legacy partner protocols (e.g., XML or SOAP) into clean JSON payloads consumed by our modern Spring Boot RestControllers.
*   **Monetization & Quota Management:** Controls partner usage tiers, automatically throttling clients that exceed contracted requests/minute. See **[B2B Integration Architecture](b2b_integration.md)** for detailed secure connection and ingestion designs.

##### 3. Inter-Service Communication (Internal Network)
*   **gRPC with Protobuf:** For high-speed, low-overhead internal communication (e.g., when the `Order Service` checks product price and stock availability in the `Catalog Service`). This results in network response times under 2ms.
*   **REST with HTTP/2:** Used as a fallback for simple, standard synchronous messaging between GKE pods.
*   **mTLS Mesh:** Internal GKE communication is secured using an Istio service mesh, encrypting internal pod-to-pod traffic automatically.

### 3.3. Database & Caching Strategy
*The system implements a strict **Logical Database-per-Service on a shared Cloud SQL for PostgreSQL instance** design to prevent database bottlenecks and team coupling while maintaining cost-effective cloud resource usage. For full topology schemas, connection pooling configurations, and DDL examples, see the detailed **[PostgreSQL Database Strategy](database_strategy.md)**.*

1.  **Split-Read Catalog Tier (Redis + Elasticsearch):**
    *   **Elasticsearch (Elastic Cloud on GCP):** Powers the search bar, type-ahead/auto-complete, dynamic filtering (facets), and search relevance ranking.
    *   **GCP Memorystore for Redis:** Acts as a high-speed cache for individual Product Detail Page (PDP) requests (direct ID lookups), yielding sub-millisecond retrieval times.
2.  **Transactional Database Tier (Cloud SQL for PostgreSQL):**
    *   **Logical DB-per-Service on Shared PostgreSQL HA:** Each team's service (Catalog, Order, Payment, and Customer/Profile) is provisioned with its own logical database (e.g., `catalog_db`, `order_db`, `payment_db`, `customer_db`) on a shared **GCP Cloud SQL for PostgreSQL** cluster instance with active read-replicas.
    *   **Zero Direct Cross-Service Queries:** Services are strictly forbidden from querying another service's tables directly. Any inter-service data dependencies (e.g., checkout price validation) are performed via high-speed internal gRPC APIs.
    *   **PgBouncer Connection Pooling:** Lightweight pooling layers manage high concurrency database connections from dynamic GKE pod scaling.
3.  **NoSQL Listing Metadata Tier (GCP Firestore):**
    *   **Firestore for Channel Listing Mappings:** Stores translated product schemas and category-to-marketplace listings without impacting the transactional PostgreSQL databases.

### 3.4. Real-Time Processing & Event Streaming
*   **Event Broker (GCP Pub/Sub):** Asynchronous event-driven communication to decouple checkout processing from notifications, inventory updates, and analytical pipelines.
*   When an order is completed, the checkout service publishes an `OrderPlaced` event. Subscribed services (e.g., Inventory, Email/Notification, Shipping) process this event independently.
*   **Data Snapping:** During checkout, the Order Service captures and writes a permanent JSON **snapshot** of product prices and shipping details at that specific moment, removing any requirement to join against the Catalog database for historical order reporting.

### 3.5. Third-Party & External Service Integrations
To manage connections with external ecosystems (e.g., tax calculation, legal/fiscal reporting, ERP, and shipping carriers) without impacting core e-commerce throughput, the platform utilizes the **Adapter Pattern** combined with the **Transactional Outbox Pattern**:
*   **Decoupled Adapters:** Individual microservices isolate external API details and data formats, presenting a unified internal interface to core services.
*   **Checkout Resilience:** Critical path APIs (like real-time tax calculation) are guarded by **Circuit Breakers** and local fallback calculations (cached regional tax tables) to guarantee zero checkout downtime.
*   **Reliable Compliance Reporting:** Post-checkout government reporting (such as electronic invoicing and fiscalization) is processed asynchronously and idempotently via GKE event workers triggered by database change streams.

For the comprehensive design specs, resiliency configurations, and schema structures, see the **[Third-Party Integration Strategy](third_party_integration.md)**.

---

## 4. Google Cloud Platform (GCP) Mapping

Below is the updated mapping of architectural components to native GCP services:

| Component | Proposed GCP Service | Rationale |
| :--- | :--- | :--- |
| **Hosting & Container Orchestration** | Google Kubernetes Engine (GKE) | Industry standard for scaling microservices, self-healing, and rolling updates. |
| **API Management & Edge** | Apigee + Cloud Armor | Secure, rate-limited public APIs; translates B2B requests; blocks DDoS and OWASP threats. |
| **Full-Text Catalog Search** | Elasticsearch (Elastic Cloud on GCP) | Fuzzy matching, category facets, and auto-complete for fast product discovery. |
| **Caching** | Cloud Memorystore for Redis | Fully managed Redis for sub-millisecond caching of hot data. |
| **Asynchronous Messaging** | Cloud Pub/Sub | Fully managed, global-scale real-time messaging middleware. |
| **Relational Database** | Cloud SQL for PostgreSQL (HA) | Highly available multi-zone relational databases per service with read-replicas for extreme performance and standard tool compatibility. |
| **NoSQL Database** | GCP Firestore | Storing and caching translated product metadata and Channel Listing Mappings for marketplaces. |
| **Logging & Monitoring** | Cloud Logging & Cloud Monitoring (Operations Suite) | Centralized metrics, tracing, and log aggregation. See the detailed **[Monitoring & Observability Plan](observability.md)**. |

---

## 5. Key Decisions & Next Steps

1.  **Codebase Bootstrap:** Initialize the Multi-Module Monorepo with Spring Boot 3.x and Java 21, establishing shared `core-common` packages for security and model mapping.
2.  **Database Strategy Alignment:** Adopt **Logical DB-per-Service on a shared Cloud SQL for PostgreSQL instance**, implementing schema isolation per team domain. Detailed specifications, connection pooling, DDL schemas, and migration patterns are established in the **[PostgreSQL Database Strategy](database_strategy.md)**.
3.  **Split-Read Implementation:** Design indexing pipelines to feed real-time catalog changes from PostgreSQL to both Redis and Elasticsearch via GCP Pub/Sub.
4.  **CI/CD Pipeline Design:** Set up build and deployment pipelines targeting GKE, and establish system metrics, distributed tracing, and health checks as defined in the **[Delivery Plan](delivery.md)**.

