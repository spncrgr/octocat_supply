# Data Model: Purchase Order Management

## Overview
This data model defines entities and relationships needed for purchase-order authoring, submission, high-value approval, fulfillment gating, and supplier notification reliability.

## Entity: PurchaseOrder

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique PO identifier | Non-empty, immutable |
| branchId | string | Yes | Branch creating the PO | Must reference existing branch |
| supplierId | string | Yes | Supplier receiving the PO | Must reference existing supplier |
| status | enum | Yes | Lifecycle status | One of: Draft, Submitted, Approved, Fulfilled, Cancelled |
| approvalNeeded | boolean | Yes | Whether PO exceeds approval threshold | Derived from pre-tax total > 10000 |
| preTaxTotal | number | Yes | Sum of line-item pre-tax totals | >= 0, recalculated on line-item change |
| createdByUserId | string | Yes | Buyer who created PO | Must reference authenticated user |
| submittedAt | datetime | No | Timestamp of submission | Set once on transition to Submitted |
| approvedAt | datetime | No | Timestamp of approval decision | Required when approved high-value PO |
| fulfilledAt | datetime | No | Timestamp of fulfillment | Required on transition to Fulfilled |
| cancelledAt | datetime | No | Timestamp of cancellation | Required on transition to Cancelled |
| createdAt | datetime | Yes | Creation timestamp | Immutable |
| updatedAt | datetime | Yes | Last update timestamp | Updated on mutation |

## Entity: PurchaseOrderLineItem

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique line-item identifier | Non-empty, immutable |
| purchaseOrderId | string | Yes | Parent PO reference | Must reference existing PO |
| productId | string | Yes | Product being ordered | Must reference existing product |
| quantity | integer | Yes | Requested quantity | > 0 |
| expectedUnitPrice | number | Yes | Buyer-entered pre-tax unit price | > 0 |
| linePreTaxTotal | number | Yes | quantity * expectedUnitPrice | Derived, >= 0 |
| createdAt | datetime | Yes | Creation timestamp | Immutable |
| updatedAt | datetime | Yes | Last update timestamp | Updated on mutation |

## Entity: ApprovalDecision

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique approval decision identifier | Non-empty, immutable |
| purchaseOrderId | string | Yes | Approved/rejected PO reference | Must reference existing PO |
| approverUserId | string | Yes | User making decision | Must be branch manager or designated approver; cannot equal createdByUserId |
| decision | enum | Yes | Approval outcome | Approved or Rejected |
| rationale | string | No | Optional reason note | Trimmed text, bounded length |
| decidedAt | datetime | Yes | Decision timestamp | Immutable once set |

## Entity: SupplierNotification

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique notification record identifier | Non-empty, immutable |
| purchaseOrderId | string | Yes | Related PO reference | Must reference existing PO |
| channel | enum | Yes | Delivery channel | Email (initial scope) |
| state | enum | Yes | Delivery state | Pending, Sent, Failed |
| attemptCount | integer | Yes | Number of send attempts | >= 0 |
| lastAttemptAt | datetime | No | Last attempt timestamp | Updated on each attempt |
| sentAt | datetime | No | Successful delivery timestamp | Required when state is Sent |
| failureReason | string | No | Last failure reason | Required when state is Failed |
| alertRaised | boolean | Yes | Whether ops alert fired on exhaustion | Default false |

## Relationships
- One PurchaseOrder has many PurchaseOrderLineItems.
- One PurchaseOrder has zero or many ApprovalDecisions (latest active decision governs outcome).
- One PurchaseOrder has one or many SupplierNotifications (initial send plus retries tracked in same record or append-only log per implementation choice).
- PurchaseOrder references one Branch and one Supplier.

## Derived Values and Policies
- `preTaxTotal` = sum(`linePreTaxTotal`) across all active line items.
- `approvalNeeded` is true only when `preTaxTotal > 10000`.
- POs with `approvalNeeded = true` cannot transition to `Fulfilled` without an `Approved` decision.
- Submission requires at least one valid line item.

## State Transitions

### PurchaseOrder Status

| From | To | Allowed | Conditions |
|------|----|---------|------------|
| Draft | Submitted | Yes | At least one valid line item; totals computed |
| Draft | Cancelled | Yes | Authorized user action |
| Submitted | Approved | Yes | approvalNeeded = true and valid approver decision |
| Submitted | Fulfilled | Yes | approvalNeeded = false OR already Approved |
| Submitted | Cancelled | Yes | Authorized user action |
| Approved | Fulfilled | Yes | Fulfillment workflow completed |
| Approved | Cancelled | Yes | Authorized user action before fulfillment |
| Fulfilled | * | No | Terminal status |
| Cancelled | * | No | Terminal status |

### SupplierNotification State

| From | To | Trigger |
|------|----|---------|
| Pending | Sent | Delivery success |
| Pending | Failed | Initial delivery failure |
| Failed | Sent | Retry success |
| Failed | Failed | Retry failure (attemptCount increments) |

## Validation Notes for Tests
- Reject zero/negative quantity and expected unit price.
- Enforce pre-tax threshold behavior at exactly 10000 (no approval required).
- Prevent creator self-approval for high-value POs.
- Raise alert when notification retries are exhausted and state remains Failed.
