# ReconX application flow notes (Days 1–8)

This note brings together the learning from [student-guides/day1/README.md](day1/README.md) through [student-guides/day8/README.md](day8/README.md) and maps them onto the actual repository structure in this project.

The simplest way to think about ReconX is this:

- the database stores trade and reconciliation data,
- the backend validates, processes, and serves that data,
- the UI displays the data and lets users interact with it,
- observability and performance features make the system measurable and reliable.

---

## 1. What ReconX is trying to do

ReconX is a trade reconciliation platform. Its core purpose is to compare internal trade records with external or counterparty data, identify mismatches, and let operations teams review, resolve, and monitor them.

In practical terms, the application does four major things:

1. Stores trade-related data safely in PostgreSQL.
2. Exposes business logic through a Spring Boot backend.
3. Presents data through a React/Vite frontend.
4. Shows live updates, metrics, and health information for operations teams.

---

## 2. End-to-end application flow

### A. Data foundation (Day 1)

The application starts with the data model and persistence layer.

- The database design is defined in [db/](../db/), including partitioning, queries, and ERD assets.
- Liquibase changelogs are applied by the backend at startup, so the schema is created and versioned automatically.
- The trading domain is organized around entities such as trade, instrument, and counterparty data.
- Partitioning and seed data make the system realistic and scalable from the beginning.

This layer is the foundation for everything else. If the schema or migration flow is wrong, every later feature becomes harder to build.

### B. Domain model and business rules (Day 2)

Once the database structure exists, the Java domain layer defines how trades are represented and validated.

- The trade model is built around a sealed trade hierarchy and immutable value objects.
- Business invariants such as non-null fields, positive quantities, and valid trade references are enforced in the model layer.
- The reconciliation logic is shaped around trade comparison rules rather than raw strings or loosely typed input.

At this point, the system stops being “data in a table” and becomes a business domain with rules.

### C. Reconciliation engine and tests (Day 3)

The business logic becomes active when the application compares internal and external trades.

- A reconciliation engine processes trade lists and produces matching or break results.
- Functional Java patterns such as streams and collectors are used to keep the implementation expressive and efficient.
- Tests ensure the logic behaves correctly before it is exposed through the API.

This is the point where the platform shifts from storage to decision-making.

### D. Backend service skeleton (Day 4)

The backend is then shaped into a real Spring Boot application.

- The main entry point is [backend/src/main/java/com/dbtraining/reconx/ReconxApplication.java](../backend/src/main/java/com/dbtraining/reconx/ReconxApplication.java).
- The application is wired for JPA, auditing, configuration profiles, and API support.
- DTOs, repositories, entities, and mappers are introduced so the API can work cleanly with the database.

This day creates the application architecture that the rest of the system depends on.

### E. REST API and security (Day 5)

Once the backend is structured, it exposes endpoints for the UI.

- Controllers receive HTTP requests for listing, creating, updating, and reconciling trades.
- Requests are validated before reaching the service layer.
- JWT and role-based access control protect sensitive operations.
- The frontend can only interact with the backend through these controlled contracts.

This is the handoff point between the business logic and the user-facing experience.

### F. Performance and observability (Day 6)

With the backend functional, the project adds production-style concerns.

- Caching reduces repeated lookups for reference data.
- Metrics capture business events and application behaviour.
- Prometheus and Grafana collect and display operational metrics.
- The system becomes observable rather than “black-box.”

This is what makes the platform suitable for real operations use, not just local demos.

### G. Static dashboard and live updates (Day 7)

Before the React app arrives, the UI is built as a static dashboard.

- The static experience is implemented under [static-dashboard/](../static-dashboard/).
- It shows a layout, theme handling, and a live trade feed using Server-Sent Events.
- This is the visual prototype for the later React app.

The important point is that the UI can already consume streaming data even before React patterns are added.

### H. React UI and component flow (Day 8)

The frontend is then rebuilt in React for a richer experience.

- The app shell is created in [frontend/src/App.jsx](../frontend/src/App.jsx).
- Pages such as Dashboard, Trades, AddTrade, and Login are loaded as route-based views.
- Authentication is handled by [frontend/src/context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx).
- Network calls are routed through [frontend/src/services/apiService.js](../frontend/src/services/apiService.js).
- The table experience is built around compound components and reusable hooks.

This is the user-facing layer that turns backend data into a trader-friendly workflow.

---

## 3. How UI data flows through the application

### Example 1: login flow

1. The user enters credentials in the Login page.
2. The frontend sends credentials to the backend authentication endpoint.
3. The backend validates the user and returns a JWT.
4. The frontend stores the token and user role in browser state.
5. Protected pages use the authentication context to decide whether to render the page or redirect the user.

This is the first entry point into the application and shows the boundary between UI and backend clearly.

### Example 2: viewing trades

1. The Trades page or Dashboard requests trade data from the backend.
2. The backend controller accepts the request and delegates to the service layer.
3. The service uses repository access to read from PostgreSQL.
4. The data is mapped into response DTOs.
5. The frontend receives the data and displays it in the table or cards.

This is the most common read flow and is the backbone of the user experience.

### Example 3: creating a trade

1. The user fills a form in the AddTrade page.
2. The frontend validates the form data and sends a request to the backend.
3. The backend validates the payload and creates a new trade record.
4. The repository writes the trade into the database.
5. The backend returns the created resource or an error response.
6. The UI updates the visible list or shows a success message.

This demonstrates the full write path: UI → API → service → repository → database → response.

### Example 4: reconciliation flow

1. A trade or set of trades is available in the system.
2. The backend reconciliation engine compares internal and external data.
3. Matching trades are accepted, while mismatches become break results.
4. The results can be surfaced to the user through the UI and/or monitoring stack.

This is the business core of ReconX and is why the model and service layers matter so much.

---

## 4. Backend layers in more detail

The backend is built around a layered structure:

- Controller layer
  - Receives HTTP requests.
  - Converts incoming data into DTOs.
  - Returns responses and status codes.

- Service layer
  - Holds the business logic.
  - Coordinates validation, reconciliation, and domain behaviour.

- Repository layer
  - Performs data access against PostgreSQL.
  - Uses Spring Data repositories and specifications for querying.

- Model and DTO layer
  - Model classes represent the domain.
  - DTOs define the API contract and keep entities from leaking into the UI boundary.

- Security layer
  - Authenticates requests and authorizes actions based on roles.

- Observability layer
  - Metrics, logging, and health checks support operations and troubleshooting.

That separation makes the application easier to reason about and easier to grow.

---

## 5. Frontend layers in more detail

The frontend is also layered:

- App shell
  - Provides the route structure and shared layout.

- Pages
  - Dashboard, Trades, AddTrade, and Login each handle a distinct concern.

- Components
  - Reusable UI pieces such as tables, cards, and wrappers.

- Context
  - Authentication and theme state are shared across the app.

- Hooks
  - Behaviour such as debounced search, infinite scrolling, and trade streaming is encapsulated here.

- Services
  - The API adapter centralizes HTTP requests and error handling.

This structure keeps UI logic organized and makes it easier to evolve the application over time.

---

## 6. How the system fits together physically

The repository is organized to reflect the application architecture:

- [db/](../db/) contains the data and schema foundation.
- [backend/](../backend/) contains the Java/Spring service and business logic.
- [frontend/](../frontend/) contains the React UI.
- [static-dashboard/](../static-dashboard/) contains the earlier HTML/CSS prototype.
- [monitoring/](../monitoring/) contains Prometheus and Grafana assets.
- [docker-compose.yml](../docker-compose.yml) wires the whole platform together.

A developer can therefore think about the system as a stack of layers:

Database → Backend services → API → React UI → Live updates/monitoring.

---

## 7. The big picture in one sentence

ReconX moves from raw trade data in the database, through validated business logic in the backend, to a user-friendly React experience in the browser, while observability and performance features keep the platform understandable and operational.
