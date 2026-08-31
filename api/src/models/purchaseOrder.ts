/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseOrder:
 *       type: object
 *       required:
 *         - purchaseOrderId
 *         - branchId
 *         - supplierId
 *         - status
 *         - approvalNeeded
 *         - preTaxTotal
 *         - createdByUserId
 *       properties:
 *         purchaseOrderId:
 *           type: integer
 *         branchId:
 *           type: integer
 *         supplierId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [Draft, Submitted, Approved, Fulfilled, Cancelled]
 *         approvalNeeded:
 *           type: boolean
 *         preTaxTotal:
 *           type: number
 *         createdByUserId:
 *           type: string
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         fulfilledAt:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Fulfilled' | 'Cancelled';

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
}
