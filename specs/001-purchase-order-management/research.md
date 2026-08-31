# Phase 0 Research: Purchase Order Management

## Decision 1: Keep existing PO status vocabulary and model approval wait as a separate indicator
- Decision: Retain status values `Draft`, `Submitted`, `Approved`, `Fulfilled`, and `Cancelled`; represent approval wait with `approvalNeeded` while status remains `Submitted`.
- Rationale: The specification explicitly preserves current status terms and clarified that approval wait must not introduce a new status.
- Alternatives considered: Add `Pending Approval` status. Rejected because it conflicts with clarified lifecycle constraints and increases migration/UI complexity.

## Decision 2: Evaluate high-value approval threshold on pre-tax total only
- Decision: Use aggregated pre-tax line totals to determine whether total is `>$10,000` for approval gating.
- Rationale: Clarification session explicitly selected pre-tax threshold behavior; this prevents tax-policy variation from changing approval eligibility.
- Alternatives considered: Tax-included threshold or max(pre-tax, tax-included). Rejected due to ambiguity and policy inconsistency.

## Decision 3: Enforce separation-of-duties approval policy
- Decision: Only branch managers or designated approvers may approve high-value POs, and PO creators cannot self-approve.
- Rationale: This provides clear financial control and auditable approval ownership.
- Alternatives considered: Any buyer approval or dual-signature for all high-value POs. Rejected as either too permissive or outside current scope.

## Decision 4: Submission succeeds even if supplier notification initially fails
- Decision: Keep PO in `Submitted` when notification send fails, mark notification `Failed`, retry automatically, and raise an operational alert when retries are exhausted.
- Rationale: Buyer workflow remains unblocked while preserving visibility and recovery behavior.
- Alternatives considered: Block submission until notification succeeds; manual resend only. Rejected for poor user experience or weaker reliability.

## Decision 5: Introduce a focused service layer for orchestration
- Decision: Implement purchase-order business logic in service modules that coordinate repositories, approval policy checks, and notification dispatch/retry decisions.
- Rationale: Repository pattern in the codebase handles data access well, while approval and notification workflows require transactional orchestration beyond route handlers.
- Alternatives considered: Put all logic in routes or repositories. Rejected due to poor separation of concerns and lower testability.

## Decision 6: Notification integration starts with a Nodemailer adapter stub
- Decision: Add a notification adapter interface with an initial Nodemailer-based stub transport suitable for local/dev and test usage.
- Rationale: Meets near-term feature requirement without binding to production mail infrastructure.
- Alternatives considered: Immediate third-party email provider integration. Rejected for unnecessary scope expansion in this feature phase.

## Decision 7: Contract-first API design via OpenAPI artifact
- Decision: Define PO endpoints and schemas in a dedicated OpenAPI contract file under `specs/001-purchase-order-management/contracts` before implementation tasks.
- Rationale: Aligns with constitution requirements for REST clarity and type-safe integration across API/frontend.
- Alternatives considered: Code-first routes with later docs update. Rejected due to risk of contract drift.

## Decision 8: Test strategy prioritizes SQLite-backed integration verification
- Decision: Use Vitest integration tests with real SQLite paths for repository and route behavior, and Playwright scenarios for approval and notification UX flows.
- Rationale: Constitution requires integration-first confidence for data workflows.
- Alternatives considered: Mostly mocked tests. Rejected because they would not validate persistence and state-transition integrity.
