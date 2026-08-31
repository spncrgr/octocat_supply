# OctoCAT Supply Chain Constitution

## Core Principles

### I. Library-First Architecture
Every feature and reusable capability MUST be designed as a standalone library or well-bounded module with a clear purpose, explicit inputs/outputs, and independent testability. Reuse is preferred over duplication because the supply chain domain contains repeated workflows, validation rules, and data access patterns that must stay consistent across services and UI surfaces.

### II. Test-Driven Development
All new behavior MUST begin with a failing contract or integration test before implementation. The red-to-green cycle is mandatory because correct supply-chain workflows depend on real data contracts, not assumptions about mock behavior or hidden edge cases.

### III. Integration Testing Over Mocks
Integration tests using the real SQLite-backed database are the default validation strategy for repository and API behavior. Mock-heavy tests are permitted only when they validate a clearly isolated boundary, but they MUST NOT replace end-to-end verification of data persistence, queries, and API contracts.

### IV. Simplicity Over Abstraction
The project MUST favor direct framework usage and minimal abstraction layers unless there is a demonstrated need for reuse or separation of concerns. Simplicity is non-negotiable because overly abstract architectures slow delivery, create maintenance burden, and obscure the actual supply-chain workflows being implemented.

### V. REST API Design and Type Safety
The application MUST expose clear REST resources with consistent naming, documented OpenAPI contracts, and TypeScript-driven type safety across the API and frontend. Contract clarity and strong typing reduce integration errors, keep interfaces predictable, and make changes safer across the supply chain workflow.

## Technology Standards

TypeScript is the required language for application logic, types, and client-facing integration contracts. The project MUST prefer the simplest viable implementation, with each dependency evaluated for necessity before it is introduced because unnecessary libraries increase maintenance, security surface, and onboarding cost.

The API MUST describe its resources and schemas via OpenAPI documentation to preserve discoverability and contract stability. The application MUST use SQLite-backed testing and local persistence for realistic validation of repository behavior, schema correctness, and integration flows in the same way they run in production.

## Development Workflow

Features MUST start with explicit contracts, failing tests, and a clear understanding of the user-facing behavior before implementation begins. Implementation then proceeds in small, reviewable increments with validation against the real SQLite database and the documented API surface.

Review and change management MUST confirm compliance with the principles above, including library reuse, test-first behavior, simplicity, and dependency discipline. Any new abstraction or dependency must be justified by measurable value rather than hypothetical future flexibility.

## Governance

This Constitution governs all project decisions related to architecture, testing, delivery, and technical standards. It supersedes convenience-driven shortcuts and ad hoc local practices when those choices conflict with the principles above.

Amendments MUST be documented in the project constitution, include a clear rationale for the change, and be reviewed for impact on testing, architecture, and operational safety. A version bump is required for any substantive governance change, and the project MUST maintain a record of the ratification and amendment dates as part of the constitution header.

The project team MUST verify that new changes are consistent with the governing principles before merge, with special attention to reuse, test coverage, contract stability, dependency choices, and simplicity. When a decision trades off one principle for another, the tradeoff MUST be explicit, justified, and reviewed rather than silently accepted.

**Version**: 1.0.0 | **Ratified**: 2026-08-31 | **Last Amended**: 2026-08-31
