# ADR 0002: Backend Programming Language, Framework, and Codebase Structure

## Status
**Accepted**

## Context
The Abysalto Webshop requires a robust, secure, and highly performant backend capable of handling millions of transactions, processing real-time order updates, and supporting multiple integrations (marketplaces, B2B, native mobile apps, and the web shop). The platform must be developed by two cross-functional teams who need to share core domain schemas, security protocols, and client models while retaining the ability to deploy services independently.

We need to choose:
1. The programming language and backend framework.
2. The codebase structure (e.g., individual repositories vs. monorepo).
3. The runtime/deployment platform.

## Decision
We decided to build the backend business logic on **Java 21** using **Spring Boot 3.x**, structured as a **Multi-Module Monorepo**, and deployed as containerized microservices to **Google Kubernetes Engine (GKE)**.

```text
abysalto-webshop/  (Git Monorepo)
├── build.gradle (Root configuration)
├── doc/ (Documentation & ADRs)
├── shopping-cart-service/ (Java Backend Service)
└── web-shop/ (Next.js Frontend App)
```

### Key Rationale
* **Java 21 & Spring Boot 3.x:** Java 21 introduces virtual threads (Project Loom) which radically improve scaling throughput for synchronous/blocking operations (e.g., database JDBC connections), giving near-reactive performance with simple imperative programming. Spring Boot 3.x has native support for Java 21, GraalVM native images (for rapid cold starts), and Micrometer telemetry integration.
* **Multi-Module Monorepo:** Having a single Git repository containing decoupled modules balances isolation and developer productivity:
  - **Shared Libraries:** Shared logic (like custom exceptions, logging layouts, or security utilities) can be kept in a core library and imported as a compile-time dependency, avoiding duplicate code or private package managers.
  - **Independent CI/CD:** Using toolings like GitHub Actions with path filtering, we can build, test, and package only the modified module, compiling them into distroless container images.
* **Google Kubernetes Engine (GKE):** Standardizes microservice scheduling, auto-scaling (HPA), routing, and container orchestration with native GCP security policies.

## Consequences

### Positive (Benefits)
* **High Performance & Low Resource Usage:** Leveraging Java 21 Virtual Threads reduces memory overhead and scheduling latency, while Spring Boot 3's modern dependency injection is optimized for Kubernetes runtimes.
* **Developer Velocity:** Monorepos simplify cross-service dependency updates, global refactoring, pull requests, and unified dependency versions.
* **Strict Type Safety:** Enterprise Java provides highly robust type checking, refactoring capabilities, and a rich ecosystem for heavy B2B XML/EDI and REST integration schemas.

### Negative / Trade-offs
* **Monorepo Complexity:** Over time, dependency graphs in monorepos can become complex if not strictly governed (e.g., avoiding circular dependencies between modules).
* **Build Times:** A change to a shared module requires rebuilding and re-testing all dependent modules (mitigated by CI/CD caching and selective builds).
* **Spring Boot Overhead:** Standard JVM container images can have slower cold start times than Go or Node.js. Mitigated by setting proper GKE horizontal auto-scaling limits and using JVM warm-up flags.
