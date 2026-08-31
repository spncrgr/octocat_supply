# Implementation Plan: Purchase Order Management

**Branch**: `[001-purchase-order-management]` | **Date**: 2026-08-31 | **Spec**: [specs/001-purchase-order-management/spec.md](specs/001-purchase-order-management/spec.md)

**Input**: Feature specification from `/specs/001-purchase-order-management/spec.md`

## Summary

Implement end-to-end purchase order management for branch buyers and approvers, including draft authoring, submission, supplier notification, high-value approval routing over $10,000 (pre-tax), fulfillment gating, cancellation rules, and status visibility. The implementation will follow existing repository and route patterns, introduce a dedicated service layer for approval and notification orchestration, and keep contracts synchronized through OpenAPI.

## Technical Context

**Language/Version**: TypeScript 5.x for API and frontend

**Primary Dependencies**: Express.js, better-sqlite3, swagger-jsdoc/swagger-ui-express, React, React Router, Axios, Nodemailer (stubbed transport for now)

**Storage**: SQLite with migration and seed scripts under `api/database`

**Testing**: Vitest for API unit/integration tests, frontend Vitest where needed, Playwright for end-to-end validation

**Target Platform**: Linux-hosted web application (API + browser frontend)

**Project Type**: Monorepo web application (`api` + `frontend`)

**Performance Goals**:
- Persist a valid draft purchase order with multiple line items in under 2 seconds for normal data sizes.
- Record supplier notification creation for submitted orders within 1 minute for 99% of cases.
- Maintain deterministic approval gating so 100% of >$10,000 pre-tax orders require approval before fulfillment.

**Constraints**:
- Preserve existing status vocabulary: Draft, Submitted, Approved, Fulfilled, Cancelled.
- Represent waiting approval via an approval-needed indicator while status remains Submitted.
- Enforce no self-approval for high-value orders.
- Keep implementation consistent with repository pattern and current REST naming conventions.

**Scale/Scope**:
- Single-tenant application context with branch-level buyers and approvers.
- Initial scope covers CRUD-like authoring, submit, approve/reject, fulfillment, cancel, notification tracking, and observability hooks for notification failures.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Library-First Architecture**: PASS. Plan introduces reusable purchase-order service modules (pricing totals, approval policy, notification policy) and repository methods with clear interfaces.
- **II. Test-Driven Development**: PASS. Plan requires writing/expanding failing route and repository tests before implementation updates.
- **III. Integration Testing Over Mocks**: PASS. API behavior and persistence will be validated against SQLite-backed tests; only notification transport boundary uses stub behavior.
- **IV. Simplicity Over Abstraction**: PASS. Service layer is minimal and focused on business orchestration; no extra framework or speculative abstraction is introduced.
- **V. REST API Design and Type Safety**: PASS. Contracts are defined in OpenAPI and aligned to TypeScript models/DTOs across API and frontend.

Post-Phase-1 Re-check: PASS. Research, data model, contracts, and quickstart remain compliant with all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-purchase-order-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── purchase-orders.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
api/
├── src/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/                # new for purchase-order business orchestration
│   └── utils/
└── database/
    ├── migrations/
    └── seed/

frontend/
├── src/
│   ├── components/
│   ├── context/
│   ├── api/
│   └── types/
└── tests/
```

**Structure Decision**: Use the existing monorepo web-application layout, extending API with purchase-order model/repository/route/service units and frontend with purchase-order UI/state additions. No new top-level packages are needed.

## Complexity Tracking

No constitution violations identified; complexity exemptions are not required.
