import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseOrderService } from './purchaseOrderService';
import { PurchaseOrdersRepository } from '../repositories/purchaseOrdersRepo';
import { PurchaseOrderApprovalsRepository } from '../repositories/purchaseOrderApprovalsRepo';
import { PurchaseOrderNotificationsRepository } from '../repositories/purchaseOrderNotificationsRepo';
import { NotificationService } from './notificationService';

describe('PurchaseOrderService approval policy', () => {
  let service: PurchaseOrderService;

  beforeEach(() => {
    const purchaseOrdersRepo = {
      findAll: vi.fn(),
      findById: vi.fn(async () => ({
        purchaseOrderId: 1,
        branchId: 1,
        supplierId: 1,
        status: 'Submitted',
        approvalNeeded: true,
        preTaxTotal: 15000,
        createdByUserId: 'buyer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lineItems: [{ productId: 1, quantity: 30, expectedUnitPrice: 500 }],
      })),
      createDraft: vi.fn(),
      updateDraft: vi.fn(),
      transitionStatus: vi.fn(async () => ({
        purchaseOrderId: 1,
        branchId: 1,
        supplierId: 1,
        status: 'Approved',
        approvalNeeded: true,
        preTaxTotal: 15000,
        createdByUserId: 'buyer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lineItems: [],
      })),
    } as unknown as PurchaseOrdersRepository;

    const approvalsRepo = {
      createDecision: vi.fn(async () => ({
        purchaseOrderApprovalId: 1,
        purchaseOrderId: 1,
        approverUserId: 'manager-1',
        decision: 'Approved',
        decidedAt: new Date().toISOString(),
      })),
      findByPurchaseOrderId: vi.fn(),
    } as unknown as PurchaseOrderApprovalsRepository;

    const notificationsRepo = {
      createPending: vi.fn(),
      findByPurchaseOrderId: vi.fn(),
      updateState: vi.fn(),
    } as unknown as PurchaseOrderNotificationsRepository;

    const notificationService = {
      dispatchPurchaseOrderSubmitted: vi.fn(),
    } as unknown as NotificationService;

    service = new PurchaseOrderService(
      purchaseOrdersRepo,
      approvalsRepo,
      notificationsRepo,
      notificationService,
    );
  });

  it('rejects self-approval for high-value purchase orders', async () => {
    await expect(
      service.recordApprovalDecision(1, {
        approverUserId: 'buyer-1',
        decision: 'Approved',
        isApproverRole: true,
      }),
    ).rejects.toThrow('cannot self-approve');
  });

  it('allows manager approval for high-value purchase orders', async () => {
    const result = await service.recordApprovalDecision(1, {
      approverUserId: 'manager-1',
      decision: 'Approved',
      isApproverRole: true,
    });

    expect(result.decision).toBe('Approved');
  });
});
