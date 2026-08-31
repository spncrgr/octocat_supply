export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Fulfilled' | 'Cancelled';
export type NotificationState = 'Pending' | 'Sent' | 'Failed';

export interface PurchaseOrderLineItemInput {
  productId: number;
  quantity: number;
  expectedUnitPrice: number;
}

export interface PurchaseOrderLineItem extends PurchaseOrderLineItemInput {
  purchaseOrderLineItemId: number;
  purchaseOrderId: number;
  linePreTaxTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  branchId: number;
  supplierId: number;
  status: PurchaseOrderStatus;
  approvalNeeded: boolean;
  preTaxTotal: number;
  createdByUserId: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: PurchaseOrderLineItem[];
}

export interface SupplierNotification {
  purchaseOrderNotificationId: number;
  purchaseOrderId: number;
  channel: string;
  state: NotificationState;
  attemptCount: number;
  lastAttemptAt?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  alertRaised: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDecisionPayload {
  approverUserId: string;
  decision: 'Approved' | 'Rejected';
  isApproverRole: boolean;
  rationale?: string;
}
