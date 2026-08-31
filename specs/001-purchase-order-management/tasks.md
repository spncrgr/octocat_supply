# Tasks: Purchase Order Management

**Input**: Design documents from `/specs/001-purchase-order-management/`

**Prerequisites**: specs/001-purchase-order-management/plan.md, specs/001-purchase-order-management/spec.md, specs/001-purchase-order-management/research.md, specs/001-purchase-order-management/data-model.md, specs/001-purchase-order-management/contracts/purchase-orders.openapi.yaml

**Tests**: Include API Vitest and frontend Playwright coverage because test tooling and validation scenarios are explicitly defined in the feature artifacts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project files and interfaces required by all stories.

- [X] T001 Create purchase-order API contract scaffold in specs/001-purchase-order-management/contracts/purchase-orders.openapi.yaml
- [X] T002 Add placeholder purchase-order route registration in api/src/index.ts
- [X] T003 [P] Create purchase-order domain model definitions in api/src/models/purchaseOrder.ts
- [X] T004 [P] Create purchase-order line-item model definitions in api/src/models/purchaseOrderLineItem.ts
- [X] T005 [P] Create approval-decision model definitions in api/src/models/approvalDecision.ts
- [X] T006 [P] Create supplier-notification model definitions in api/src/models/supplierNotification.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core persistence, validation, and service infrastructure required before user story delivery.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T007 Create migration for purchase orders and line items in api/database/migrations/004_create_purchase_orders.sql
- [X] T008 [P] Create migration for approvals and notifications in api/database/migrations/005_create_po_approvals_notifications.sql
- [X] T009 [P] Add seed data for purchase-order testing relationships in api/database/seed/006_purchase_orders.sql
- [X] T010 Implement purchase-order repository data access in api/src/repositories/purchaseOrdersRepo.ts
- [X] T011 [P] Implement purchase-order line-item repository operations in api/src/repositories/purchaseOrderLineItemsRepo.ts
- [X] T012 [P] Implement approval-decision repository operations in api/src/repositories/purchaseOrderApprovalsRepo.ts
- [X] T013 [P] Implement supplier-notification repository operations in api/src/repositories/purchaseOrderNotificationsRepo.ts
- [X] T014 Create purchase-order validation and transition guards in api/src/utils/purchaseOrderValidation.ts
- [X] T015 Implement purchase-order orchestration service in api/src/services/purchaseOrderService.ts
- [X] T016 [P] Implement notification adapter and retry policy service in api/src/services/notificationService.ts
- [X] T017 [P] Define frontend purchase-order API client and DTO mapping in frontend/src/api/purchaseOrders.ts

**Checkpoint**: Foundation ready; user stories can begin.

---

## Phase 3: User Story 1 - Create Draft Purchase Order (Priority: P1) MVP

**Goal**: Enable branch buyers to create and edit draft purchase orders with multiple line items and pre-tax total calculation.

**Independent Test**: Create a draft with multiple items, edit quantity/expected prices, and verify persisted `Draft` status plus recalculated totals.

### Tests for User Story 1

- [X] T018 [P] [US1] Add repository integration tests for draft create/update in api/src/repositories/purchaseOrdersRepo.test.ts
- [X] T019 [P] [US1] Add route tests for draft create/update validation in api/src/routes/purchaseOrder.test.ts
- [X] T020 [P] [US1] Add frontend E2E draft authoring flow test in frontend/tests/e2e/purchase-order-draft.spec.ts

### Implementation for User Story 1

- [X] T021 [US1] Implement draft create and update methods in api/src/services/purchaseOrderService.ts
- [X] T022 [US1] Implement draft create and patch endpoints in api/src/routes/purchaseOrder.ts
- [X] T023 [US1] Register purchase-order route handlers in api/src/index.ts
- [X] T024 [P] [US1] Add purchase-order TypeScript types for frontend state in frontend/src/types/purchaseOrder.ts
- [X] T025 [US1] Implement purchase-order draft state context in frontend/src/context/PurchaseOrderContext.tsx
- [X] T026 [P] [US1] Build draft line-item editor UI in frontend/src/components/entity/purchaseOrder/PurchaseOrderDraftForm.tsx
- [X] T027 [US1] Add draft creation page and route integration in frontend/src/App.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Submit PO and Notify Supplier (Priority: P1)

**Goal**: Allow buyers to submit valid drafts and trigger supplier notification with retry/alert behavior on failure.

**Independent Test**: Submit a valid draft, verify `Submitted` status, verify notification record creation, then simulate notification failure and observe retry + alert exhaustion behavior.

### Tests for User Story 2

- [X] T028 [P] [US2] Add route tests for submit behavior and line-item prerequisites in api/src/routes/purchaseOrder.test.ts
- [X] T029 [P] [US2] Add notification retry and alert tests in api/src/services/notificationService.test.ts
- [X] T030 [P] [US2] Add frontend E2E submit and notification status test in frontend/tests/e2e/purchase-order-submit-notify.spec.ts

### Implementation for User Story 2

- [X] T031 [US2] Implement submit workflow and notification handoff in api/src/services/purchaseOrderService.ts
- [X] T032 [US2] Implement notification send, retry scheduling, and alert flag updates in api/src/services/notificationService.ts
- [X] T033 [US2] Implement submit and notification status endpoints in api/src/routes/purchaseOrder.ts
- [X] T034 [P] [US2] Implement supplier-notification query operations in api/src/repositories/purchaseOrderNotificationsRepo.ts
- [X] T035 [US2] Add frontend submit action and notification status panel in frontend/src/components/entity/purchaseOrder/PurchaseOrderSubmitPanel.tsx
- [X] T036 [US2] Integrate submission UX state handling in frontend/src/context/PurchaseOrderContext.tsx

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Enforce High-Value Approval Workflow (Priority: P2)

**Goal**: Enforce pre-tax threshold approval rules, approver role checks, and no self-approval before fulfillment for high-value POs.

**Independent Test**: Validate `$10,000` pre-tax orders proceed without high-value approval while `>$10,000` orders require branch-manager/designated-approver decision and block creator self-approval.

### Tests for User Story 3

- [X] T037 [P] [US3] Add approval policy tests for threshold and self-approval constraints in api/src/services/purchaseOrderService.test.ts
- [X] T038 [P] [US3] Add approval decision endpoint tests in api/src/routes/purchaseOrder.test.ts
- [X] T039 [P] [US3] Add frontend E2E high-value approval flow test in frontend/tests/e2e/purchase-order-approval.spec.ts

### Implementation for User Story 3

- [X] T040 [US3] Implement approval-needed derivation and fulfillment gating in api/src/services/purchaseOrderService.ts
- [X] T041 [US3] Implement approval decision persistence and audit fields in api/src/repositories/purchaseOrderApprovalsRepo.ts
- [X] T042 [US3] Implement approval decision and status transition endpoints in api/src/routes/purchaseOrder.ts
- [X] T043 [US3] Implement role-aware approval UI and self-approval blocking message in frontend/src/components/entity/purchaseOrder/PurchaseOrderApprovalPanel.tsx
- [X] T044 [US3] Add approval-needed indicator and status history UI in frontend/src/components/entity/purchaseOrder/PurchaseOrderStatusTimeline.tsx

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, contract parity, and regression confidence across all stories.

- [x] T045 [P] Update API Swagger aggregate contract with purchase-order schemas in api/api-swagger.json
- [X] T046 [P] Add route-level API docs/comments for purchase-order endpoints in api/src/routes/purchaseOrder.ts
- [X] T047 [P] Add quickstart execution notes and observed outputs in specs/001-purchase-order-management/quickstart.md
- [X] T048 Run API regression tests and address failures in api/src/routes/purchaseOrder.test.ts
- [x] T049 Run frontend E2E regression tests and address failures in frontend/tests/e2e/purchase-order-approval.spec.ts
- [X] T050 Validate no contract drift between implementation and spec in specs/001-purchase-order-management/contracts/purchase-orders.openapi.yaml

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2 completion and reuses US1 draft APIs.
- **Phase 5 (US3)**: Depends on Phase 2 completion and extends US2 submission behavior.
- **Phase 6 (Polish)**: Depends on completion of targeted user stories.

### User Story Dependencies

- **US1**: Foundational dependency only; forms MVP baseline.
- **US2**: Depends on US1 draft lifecycle APIs for submission entry point.
- **US3**: Depends on US2 submitted lifecycle and notification-visible state.

### Within Each User Story

- Test tasks should be authored first and fail before implementation changes.
- Repository/service logic should precede route handlers.
- API endpoints should be complete before frontend workflow wiring.
- Story checkpoint must pass before moving to the next priority story.

### Parallel Opportunities

- Phase 1 model files (T003-T006) can run in parallel.
- Phase 2 repository tasks (T011-T013) can run in parallel after migrations.
- US1 tests (T018-T020) can run in parallel.
- US2 test and notification repository tasks (T028-T030, T034) can run in parallel.
- US3 tests (T037-T039) can run in parallel.
- Polish doc/contract tasks (T045-T047, T050) can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T018 [US1] repository integration tests in api/src/repositories/purchaseOrdersRepo.test.ts"
Task: "T019 [US1] route tests in api/src/routes/purchaseOrder.test.ts"
Task: "T020 [US1] Playwright draft flow test in frontend/tests/e2e/purchase-order-draft.spec.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T029 [US2] notification retry tests in api/src/services/notificationService.test.ts"
Task: "T030 [US2] submit notification E2E in frontend/tests/e2e/purchase-order-submit-notify.spec.ts"
Task: "T034 [US2] notification query repository in api/src/repositories/purchaseOrderNotificationsRepo.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T037 [US3] approval policy tests in api/src/services/purchaseOrderService.test.ts"
Task: "T038 [US3] approval endpoint tests in api/src/routes/purchaseOrder.test.ts"
Task: "T039 [US3] high-value approval E2E in frontend/tests/e2e/purchase-order-approval.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1).
3. Validate the US1 independent test criteria and stabilize before expanding scope.

### Incremental Delivery

1. Deliver US1 draft lifecycle.
2. Add US2 submission and notification reliability.
3. Add US3 high-value approval controls.
4. Execute Phase 6 cross-cutting validation and contract parity checks.

### Parallel Team Strategy

1. Shared team completes Setup and Foundational phases.
2. Backend and frontend contributors split by story once foundation is stable.
3. QA runs Playwright scenarios in parallel with API Vitest as stories complete.

---

## Notes

- [P] tasks indicate independent files with no blocking dependency on incomplete tasks.
- Story labels map every story-phase task to the related user story for traceability.
- Keep status terminology consistent with spec clarifications: no separate pending-approval status.
- Commit by logical task group and re-run targeted tests at each story checkpoint.
