# Quickstart Validation Guide: Purchase Order Management

## Purpose
Validate purchase-order workflows end-to-end across API and frontend using the approved spec, data model, and API contract.

References:
- Spec: `specs/001-purchase-order-management/spec.md`
- Data model: `specs/001-purchase-order-management/data-model.md`
- Contract: `specs/001-purchase-order-management/contracts/purchase-orders.openapi.yaml`

## Prerequisites
- Node.js and npm installed
- Dependencies installed for `api` and `frontend`
- SQLite file writable in local environment

## Setup
From repository root:

```bash
make install
make build-api
make db-seed
```

## Start the Application
Run API and frontend in separate terminals:

```bash
make dev-api
```

```bash
make dev-frontend
```

## Validation Scenarios

### Scenario 1: Create and update a draft purchase order
1. Authenticate as a branch buyer.
2. Create a draft purchase order for a supplier with at least two line items.
3. Confirm draft is saved with status `Draft` and computed pre-tax total.
4. Update quantity and expected unit price on one line item.

Expected outcomes:
- Draft persists and remains editable.
- Totals recompute correctly.
- Zero/negative quantity or price is rejected.

### Scenario 2: Submit and notify supplier
1. Submit a valid Draft purchase order.
2. Verify status transitions to `Submitted`.
3. Verify a supplier notification record is created.

Expected outcomes:
- Submission succeeds when at least one valid line item exists.
- Notification state progresses toward `Sent`.

### Scenario 3: Notification failure and retry behavior
1. Simulate notification send failure via stubbed notifier.
2. Submit a valid Draft purchase order.
3. Inspect notification state and retry attempt history.

Expected outcomes:
- PO remains `Submitted`.
- Notification is marked `Failed` on failure and retries are attempted automatically.
- Alert flag/observable event appears when retries are exhausted.

### Scenario 4: High-value approval enforcement
1. Submit one PO with pre-tax total `10000`.
2. Submit one PO with pre-tax total `10000.01`.
3. Attempt fulfillment for both.

Expected outcomes:
- `10000` PO does not require high-value approval.
- `10000.01` PO requires approval before fulfillment.
- Approval-needed indicator is visible while status remains `Submitted`.

### Scenario 5: Approver authorization and self-approval prevention
1. Create a high-value PO as buyer A.
2. Attempt approval as buyer A.
3. Attempt approval as branch manager or designated approver B.

Expected outcomes:
- Self-approval attempt is rejected.
- Authorized approver decision is accepted and recorded with timestamp.

### Scenario 6: Status transition guardrails
1. Cancel a Draft or Submitted PO with an authorized user.
2. Attempt to transition a `Cancelled` PO back to active processing statuses.
3. Fulfill an eligible PO and then attempt further transitions.

Expected outcomes:
- Cancel and fulfill transitions follow contract rules.
- Terminal statuses (`Cancelled`, `Fulfilled`) reject invalid further transitions.

## Suggested Test Commands
API tests:

```bash
cd api && npm run test
```

API coverage:

```bash
cd api && npm run test:coverage
```

Frontend E2E tests:

```bash
cd frontend && npm run test:e2e
```

## Exit Criteria
- All validation scenarios pass.
- Approval and notification rules match clarifications in the spec.
- Contract and implementation responses remain aligned for all PO endpoints.

## Execution Notes
- API build and tests pass in the current workspace (`api`: 9 test files, 52 tests).
- Frontend production build succeeds in the current workspace (`frontend`).
- Purchase-order Playwright specs are authored, but runtime execution is blocked in this environment because Playwright reports Chromium unsupported on Ubuntu 26.04-x64.
