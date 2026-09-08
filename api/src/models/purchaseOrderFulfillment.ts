export interface PurchaseOrderFulfillmentRecord {
  purchaseOrderFulfillmentId: number;
  purchaseOrderId: number;
  purchaseOrderLineItemId: number;
  quantity: number;
  reference?: string | null;
  fulfilledAt: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderFulfillmentInput {
  purchaseOrderLineItemId?: number;
  lineItemId?: number;
  quantity: number;
  reference?: string | null;
  remarks?: string | null;
}
