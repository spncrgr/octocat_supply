export interface PurchaseOrderLineItem {
  purchaseOrderLineItemId: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  expectedUnitPrice: number;
  linePreTaxTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItemInput {
  productId: number;
  quantity: number;
  expectedUnitPrice: number;
}
