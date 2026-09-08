# Feature Specification: Purchase Order Management

**Feature Branch**: `[001-purchase-order-management]`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Create a Purchase Order management system. Buyers at branches can create purchase orders to suppliers for products. Each PO contains multiple line items with quantities and expected prices. Track PO status (Draft, Submitted, Approved, Partially Fulfilled, Fulfilled, Cancelled). Line items can be fulfilled in multiple shipments, with fulfillment history captured per line item. Suppliers receive notifications when POs are submitted. Include approval workflow for POs over $10,000. Add GET /api/purchase-orders/:id/fulfillment-history endpoint."

## Clarifications

### Session 2026-08-31

- Q: Who is allowed to approve purchase orders above $10,000? → A: Branch manager or designated approver can approve, but the request creator cannot self-approve.
- Q: How should the system represent a purchase order that is submitted and waiting for high-value approval? → A: Keep status as Submitted and track approval-needed as a separate flag/state marker.
- Q: What should happen if supplier notification delivery fails right after a purchase order is submitted? → A: Keep order Submitted, mark notification as Failed, and retry automatically with alerts.
- Q: Should the $10,000 approval threshold be evaluated on the pre-tax total or a tax-included total? → A: Use pre-tax purchase order total only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Draft Purchase Order (Priority: P1)

A branch buyer creates a purchase order for a supplier, adds one or more product line items, and saves the order as Draft so it can be reviewed before submission.

**Why this priority**: Draft creation is the core business action that enables all downstream purchasing workflows.

**Independent Test**: Can be fully tested by creating a new purchase order with multiple line items, saving it as Draft, and verifying all entered values are preserved and editable.

**Acceptance Scenarios**:

1. **Given** a branch buyer has selected a supplier, **When** the buyer creates a purchase order with at least one line item including quantity and expected unit price and saves it, **Then** the purchase order is stored with status Draft.
2. **Given** a Draft purchase order exists, **When** the buyer updates line item quantities or expected prices, **Then** the updated values are saved and visible in the Draft purchase order.

---

### User Story 2 - Submit PO and Notify Supplier (Priority: P1)

A branch buyer submits a completed Draft purchase order so the supplier is informed and can begin fulfillment planning.

**Why this priority**: Submission and supplier notification are required to convert internal demand into actionable supplier work.

**Independent Test**: Can be fully tested by submitting a valid Draft purchase order and confirming the status changes to Submitted and a supplier notification is generated.

**Acceptance Scenarios**:

1. **Given** a Draft purchase order with valid line items exists, **When** the buyer submits the purchase order, **Then** the status changes to Submitted.
2. **Given** a purchase order transitions to Submitted, **When** submission is completed, **Then** the assigned supplier receives a notification containing purchase order reference details.

---

### User Story 3 - Enforce High-Value Approval Workflow (Priority: P2)

A purchasing approver reviews and decides on purchase orders whose total expected value exceeds $10,000 before they can proceed to fulfillment.

**Why this priority**: Approval controls reduce financial and procurement risk for high-value purchases.

**Independent Test**: Can be fully tested by submitting one purchase order above $10,000 and one at or below $10,000, then verifying approval is required only for the higher-value order.

**Acceptance Scenarios**:

1. **Given** a Submitted purchase order total exceeds $10,000, **When** a buyer attempts to move it forward without approval, **Then** the order remains in Submitted status with approval-needed indicated and cannot be fulfilled.
2. **Given** a Submitted purchase order total exceeds $10,000, **When** a branch manager or designated approver who is not the request creator approves it, **Then** the purchase order status changes to Approved.
3. **Given** a Submitted purchase order total is $10,000 or less, **When** workflow checks are applied, **Then** no additional approval step is required before normal progression.

---

### User Story 4 - Partially Fulfill Purchase Order Line Items (Priority: P1)

A buyer or fulfillment team records payment, shipping, or delivery activity for only a portion of a purchase order, while preserving the remaining open line items for future fulfillment.

**Why this priority**: In real-world purchasing, delivery and completion rarely happen in a single shipment, and partial shipments must be visible and auditable.

**Independent Test**: Can be fully tested by fulfilling one line item in a multi-item purchase order, verifying the purchase order status becomes Partially Fulfilled, and confirming a fulfillment history record exists for the shipped quantity.

**Acceptance Scenarios**:

1. **Given** an Approved or otherwise eligible purchase order contains multiple line items, **When** one line item is shipped or received in a partial delivery, **Then** the shipped quantity for that line item is recorded without closing the entire purchase order.
2. **Given** a purchase order has at least one fulfilled line item and at least one remaining unfulfilled line item, **When** the system recalculates order status, **Then** the status changes to Partially Fulfilled.
3. **Given** the final remaining line item on a purchase order is fulfilled, **When** fulfillment is recorded, **Then** the purchase order status changes to Fulfilled.
4. **Given** a purchase order has fulfillment activity recorded, **When** a user requests the fulfillment history, **Then** the system returns a chronological record of each shipment or fulfillment event by line item.

### Edge Cases

- What happens when a purchase order pre-tax total is exactly $10,000 at submission time (no high-value approval required)?
- How does the system handle repeated notification failures after automatic retries are exhausted?
- What happens when all line items are removed from a Draft purchase order and the buyer attempts submission?
- How does the system handle status update attempts from Cancelled or Fulfilled orders?
- What happens when expected price or quantity values are zero or negative?
- What happens when a line item is fulfilled multiple times across separate shipments? 
- How should the system behave if a fulfillment shipment exceeds the originally requested quantity for a line item?
- How does the system track which line items remain open after a partial shipment?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a branch buyer to create a new purchase order associated with one branch and one supplier.
- **FR-002**: System MUST allow a buyer to add, edit, and remove multiple line items on a Draft purchase order.
- **FR-003**: Each line item MUST capture product reference, quantity, and expected unit price before submission.
- **FR-004**: System MUST calculate and display the total expected purchase order value from all line items.
- **FR-005**: System MUST support and track purchase order statuses: Draft, Submitted, Approved, Partially Fulfilled, Fulfilled, and Cancelled.
- **FR-006**: System MUST only allow purchase order submission when at least one valid line item exists.
- **FR-007**: Upon successful submission, system MUST generate a supplier notification tied to the submitted purchase order.
- **FR-008**: If initial supplier notification delivery fails after submission, system MUST keep the purchase order in Submitted status, mark notification state as Failed, and retry delivery automatically.
- **FR-009**: System MUST trigger an operational alert when supplier notification retries are exhausted and notification remains Failed.
- **FR-010**: Purchase orders with a total expected value greater than $10,000 MUST require explicit approval before they can be marked Fulfilled.
- **FR-011**: Purchase orders with a total expected value of $10,000 or less MUST proceed without the high-value approval requirement.
- **FR-012**: System MUST evaluate the high-value approval threshold using pre-tax purchase order total only.
- **FR-013**: System MUST permit approval of high-value purchase orders only by a branch manager or designated approver, and MUST prevent request creator self-approval.
- **FR-014**: System MUST record the approval decision, approver identity, and decision time for high-value purchase orders.
- **FR-015**: System MUST represent high-value orders awaiting approval as Submitted status with a separate approval-needed indicator, not as a separate purchase order status.
- **FR-016**: System MUST prevent invalid status transitions, including moving Cancelled or Fulfilled orders back to active processing statuses.
- **FR-017**: System MUST provide buyers and approvers with visibility into current purchase order status and status history.
- **FR-018**: System MUST allow authorized users to cancel purchase orders that are not already Fulfilled.
- **FR-019**: System MUST allow a purchase order to be fulfilled in multiple shipments, with some line items or quantities shipped before others are completed.
- **FR-020**: System MUST track fulfillment history at the line-item level, including the quantity fulfilled, shipment or delivery reference, fulfillment timestamp, and any associated remarks or receiving note.
- **FR-021**: System MUST automatically set purchase order status to Partially Fulfilled whenever at least one line item has been fulfilled and at least one line item remains unfulfilled, and MUST set status to Fulfilled only when all line items have been fully completed.
- **FR-022**: System MUST expose a fulfillment history view for a purchase order through the GET /api/purchase-orders/:id/fulfillment-history endpoint so users can review all shipped quantities and delivery events across line items.
- **FR-023**: System MUST preserve fulfillment history even when a purchase order later changes status between Partially Fulfilled and Fulfilled, and MUST not discard earlier shipment events when final completion occurs.

### Key Entities *(include if feature involves data)*

- **Purchase Order**: Represents a procurement request from a branch to a supplier, including branch, supplier, current status, total expected value, approval-needed indicator, timestamps, and status history.
- **Purchase Order Line Item**: Represents an individual product request within a purchase order, including product reference, quantity, expected unit price, computed line total, remaining quantity, and fulfillment state.
- **Fulfillment Record**: Represents a shipment or delivery event for one or more quantities of a line item, including shipment reference, fulfilled quantity, timestamp, and any receiving or delivery notes.
- **Approval Decision**: Represents the review outcome for high-value purchase orders, including approver, decision type, decision timestamp, and optional rationale.
- **Supplier Notification**: Represents a delivery of submitted purchase order information to the supplier, including notification state and delivery timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of branch buyers can create and save a multi-line purchase order draft in under 4 minutes during user acceptance testing.
- **SC-002**: 99% of submitted purchase orders generate a supplier notification record within 1 minute of submission.
- **SC-003**: 100% of purchase orders with total expected value above $10,000 are blocked from fulfillment until an approval decision is recorded.
- **SC-004**: 100% of purchase orders at or below $10,000 are able to proceed without the high-value approval step.
- **SC-005**: 100% of purchase orders with at least one partially fulfilled line item indicate Partially Fulfilled status until all line items are complete.
- **SC-006**: At least 90% of buyers and approvers report they can identify current purchase order status, remaining line-item quantities, and fulfillment timeline without external support in usability evaluation.

## Assumptions

- Branch buyers and approvers are authenticated and have role-appropriate access managed by existing identity controls.
- Supplier contact details required for notification delivery already exist and are maintained in the current supplier records.
- Currency handling for approval threshold is based on a single default business currency for this feature version.
- The initial scope includes creation, submission, approval, partial fulfillment tracking, and cancellation, but excludes supplier-side acknowledgement workflows.
- Expected prices entered by buyers represent pre-tax values unless organizational policy states otherwise.
- Partial fulfillment may occur across multiple shipments and is tracked by line item, with the aggregated status reflecting whether any quantity remains outstanding.
