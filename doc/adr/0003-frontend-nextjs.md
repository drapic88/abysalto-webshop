# ADR 0003: Frontend Web Shop Framework

## Status
**Accepted**

## Context
The Abysalto Web Shop serves a global consumer market. For an e-commerce platform of this scale, performance directly translates to conversion rates: every 100ms of latency can decrease revenue. 
The critical requirements for the primary customer-facing web application are:
1. **Sub-second Initial Load Times:** Customers should see a fully rendered, interactive page immediately.
2. **Excellent Search Engine Optimization (SEO):** Product pages, categories, and blogs must be easily indexed by search engines to drive organic traffic.
3. **Responsive, Premium User Experience:** High-fidelity animations, instant transitions, and rich interactive components.
4. **Developer Productivity:** Ability to reuse components, mock APIs, and write modular code.

## Decision
We decided to build the customer-facing web application using **Next.js** (React) deployed on containerized environments and accelerated globally via **GCP Cloud CDN**.

### Key Rationale
* **Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR):**
  - **ISR** allows us to pre-render million-product catalogs as static HTML pages in the background, serving them globally in milliseconds from CDN edges. Updates to prices or descriptions happen lazily without rebuilding the entire site.
  - **SSR** handles dynamic checkout, personalized dashboards, and real-time cart states directly on the server to prevent layout shifts.
* **Image Optimization:** Next.js has built-in image processing that automatically resizes, compresses, and serves modern formats (WebP/AVIF) based on customer device viewports, cutting load payload sizes.
* **Seamless API Communication:** Communicates with the backend GKE microservices over secure REST APIs via the GCP Apigee/API Gateway.

## Consequences

### Positive (Benefits)
* **Sub-Second Global Load Times:** Static pages are cached at edge nodes globally through Cloud CDN, bypasses origin compute for most visits.
* **Unbeatable SEO Rank:** Search engine bots receive complete semantic HTML with metadata pre-rendered on the server side instead of blank client-side React skeletons.
* **Vibrant and Dynamic UI:** Full support for modern CSS-in-JS, TailwindCSS, Framer Motion, and robust UI design libraries.

### Negative / Trade-offs
* **Complexity of Hybrid Rendering:** Developers must carefully understand which code runs on the Server (Server Components) and which runs on the Client (Client Components), increasing the learning curve.
* **Server Cost:** Unlike purely static Single-Page Apps (SPAs) hosted on storage buckets, Next.js requires a Node.js server environment to execute SSR/ISR and API routes. Handled by running Next.js as a scalable containerized deployment on GKE or Cloud Run.
