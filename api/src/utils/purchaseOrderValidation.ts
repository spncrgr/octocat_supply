import { ValidationError } from './errors';
import { PurchaseOrderStatus } from '../models/purchaseOrder';
import { PurchaseOrderLineItemInput } from '../models/purchaseOrderLineItem';

export const APPROVAL_THRESHOLD = 10000;

const terminalStatuses: PurchaseOrderStatus[] = ['Fulfilled', 'Cancelled'];

export function validateLineItems(lineItems: PurchaseOrderLineItemInput[]): void {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ValidationError('At least one line item is required');
  }

  for (const lineItem of lineItems) {
    if (!Number.isInteger(lineItem.productId) || lineItem.productId <= 0) {
      throw new ValidationError('Line item productId must be a positive integer');
    }

    if (!Number.isInteger(lineItem.quantity) || lineItem.quantity <= 0) {
      throw new ValidationError('Line item quantity must be a positive integer');
    }

    if (typeof lineItem.expectedUnitPrice !== 'number' || lineItem.expectedUnitPrice <= 0) {
      throw new ValidationError('Line item expectedUnitPrice must be greater than 0');
    }
  }
}

export function calculatePreTaxTotal(lineItems: PurchaseOrderLineItemInput[]): number {
  const total = lineItems.reduce((sum, lineItem) => {
    return sum + lineItem.quantity * lineItem.expectedUnitPrice;
  }, 0);

  return Number(total.toFixed(2));
}

export function needsApproval(preTaxTotal: number): boolean {
  return preTaxTotal > APPROVAL_THRESHOLD;
}

export function validateTransition(currentStatus: PurchaseOrderStatus, nextStatus: PurchaseOrderStatus): void {
  if (terminalStatuses.includes(currentStatus)) {
    throw new ValidationError(`Cannot transition purchase order from terminal status ${currentStatus}`);
  }

  const transitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    Draft: ['Submitted', 'Cancelled'],
    Submitted: ['Approved', 'Fulfilled', 'Cancelled'],
    Approved: ['Fulfilled', 'Cancelled'],
    Fulfilled: [],
    Cancelled: [],
  };

  if (!transitions[currentStatus].includes(nextStatus)) {
    throw new ValidationError(
      `Invalid purchase order status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}
