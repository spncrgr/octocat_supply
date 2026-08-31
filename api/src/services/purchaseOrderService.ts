import { ValidationError, ConflictError, NotFoundError } from '../utils/errors';
import {
  PurchaseOrderStatus,
  PurchaseOrder,
} from '../models/purchaseOrder';
import {
  PurchaseOrderLineItemInput,
} from '../models/purchaseOrderLineItem';
import { ApprovalDecision, ApprovalDecisionType } from '../models/approvalDecision';
import { SupplierNotification } from '../models/supplierNotification';
import {
  PurchaseOrdersRepository,
  PurchaseOrderWithItems,
} from '../repositories/purchaseOrdersRepo';
import { PurchaseOrderApprovalsRepository } from '../repositories/purchaseOrderApprovalsRepo';
import { PurchaseOrderNotificationsRepository } from '../repositories/purchaseOrderNotificationsRepo';
import {
  validateLineItems,
  calculatePreTaxTotal,
  needsApproval,
  validateTransition,
} from '../utils/purchaseOrderValidation';
import { NotificationService } from './notificationService';

interface DraftInput {
  branchId: number;
  supplierId: number;
  createdByUserId: string;
  lineItems: PurchaseOrderLineItemInput[];
}

interface DraftUpdateInput {
  supplierId?: number;
  lineItems: PurchaseOrderLineItemInput[];
}

interface ApprovalInput {
  approverUserId: string;
  decision: ApprovalDecisionType;
  rationale?: string;
  isApproverRole: boolean;
}

export class PurchaseOrderService {
  private purchaseOrdersRepo: PurchaseOrdersRepository;
  private approvalsRepo: PurchaseOrderApprovalsRepository;
  private notificationsRepo: PurchaseOrderNotificationsRepository;
  private notificationService: NotificationService;

  constructor(
    purchaseOrdersRepo: PurchaseOrdersRepository,
    approvalsRepo: PurchaseOrderApprovalsRepository,
    notificationsRepo: PurchaseOrderNotificationsRepository,
    notificationService: NotificationService,
  ) {
    this.purchaseOrdersRepo = purchaseOrdersRepo;
    this.approvalsRepo = approvalsRepo;
    this.notificationsRepo = notificationsRepo;
    this.notificationService = notificationService;
  }

  async listPurchaseOrders(filters?: {
    branchId?: number;
    supplierId?: number;
    status?: PurchaseOrderStatus;
  }): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersRepo.findAll(filters);
  }

  async getPurchaseOrderById(id: number): Promise<PurchaseOrderWithItems> {
    const order = await this.purchaseOrdersRepo.findById(id);
    if (!order) {
      throw new NotFoundError('PurchaseOrder', id);
    }
    return order;
  }

  async createDraft(input: DraftInput): Promise<PurchaseOrderWithItems> {
    validateLineItems(input.lineItems);

    const preTaxTotal = calculatePreTaxTotal(input.lineItems);
    const approvalNeeded = needsApproval(preTaxTotal);

    return this.purchaseOrdersRepo.createDraft({
      ...input,
      preTaxTotal,
      approvalNeeded,
    });
  }

  async updateDraft(id: number, input: DraftUpdateInput): Promise<PurchaseOrderWithItems> {
    validateLineItems(input.lineItems);

    const preTaxTotal = calculatePreTaxTotal(input.lineItems);
    const approvalNeeded = needsApproval(preTaxTotal);

    return this.purchaseOrdersRepo.updateDraft(id, {
      ...input,
      preTaxTotal,
      approvalNeeded,
    });
  }

  async submitDraft(id: number): Promise<PurchaseOrderWithItems> {
    const order = await this.getPurchaseOrderById(id);
    if (order.status !== 'Draft') {
      throw new ConflictError('Only Draft purchase orders can be submitted');
    }

    if (order.lineItems.length === 0) {
      throw new ValidationError('At least one line item is required for submission');
    }

    const submittedOrder = await this.purchaseOrdersRepo.transitionStatus(id, 'Submitted', {
      submittedAt: new Date().toISOString(),
    });

    const notification = await this.notificationsRepo.createPending(id);
    await this.notificationService.dispatchPurchaseOrderSubmitted(submittedOrder, notification);

    return this.getPurchaseOrderById(id);
  }

  async recordApprovalDecision(id: number, input: ApprovalInput): Promise<ApprovalDecision> {
    const order = await this.getPurchaseOrderById(id);

    if (!order.approvalNeeded) {
      throw new ConflictError('Approval decision is not required for this purchase order');
    }

    if (!input.isApproverRole) {
      throw new ValidationError('Only branch managers or designated approvers can approve');
    }

    if (input.approverUserId === order.createdByUserId) {
      throw new ValidationError('Purchase order creators cannot self-approve');
    }

    if (order.status !== 'Submitted' && order.status !== 'Approved') {
      throw new ConflictError('Approval decisions are only allowed for Submitted purchase orders');
    }

    const decision = await this.approvalsRepo.createDecision({
      purchaseOrderId: id,
      approverUserId: input.approverUserId,
      decision: input.decision,
      rationale: input.rationale,
    });

    if (input.decision === 'Approved') {
      await this.purchaseOrdersRepo.transitionStatus(id, 'Approved', {
        approvedAt: decision.decidedAt,
      });
    }

    return decision;
  }

  async transitionStatus(id: number, targetStatus: PurchaseOrderStatus): Promise<PurchaseOrderWithItems> {
    const order = await this.getPurchaseOrderById(id);

    validateTransition(order.status, targetStatus);

    if (targetStatus === 'Fulfilled' && order.approvalNeeded && order.status !== 'Approved') {
      throw new ConflictError('High-value purchase orders require approval before fulfillment');
    }

    const now = new Date().toISOString();
    const fields: Partial<{
      submittedAt: string;
      approvedAt: string;
      fulfilledAt: string;
      cancelledAt: string;
    }> = {};

    if (targetStatus === 'Fulfilled') {
      fields.fulfilledAt = now;
    }

    if (targetStatus === 'Cancelled') {
      fields.cancelledAt = now;
    }

    return this.purchaseOrdersRepo.transitionStatus(id, targetStatus, fields);
  }

  async listNotifications(id: number): Promise<SupplierNotification[]> {
    await this.getPurchaseOrderById(id);
    return this.notificationsRepo.findByPurchaseOrderId(id);
  }
}
