import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notificationService';
import { PurchaseOrderNotificationsRepository } from '../repositories/purchaseOrderNotificationsRepo';
import { PurchaseOrderWithItems } from '../repositories/purchaseOrdersRepo';
import { SupplierNotification } from '../models/supplierNotification';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: '1' }),
    })),
  },
}));

describe('NotificationService', () => {
  let repo: PurchaseOrderNotificationsRepository;
  let service: NotificationService;

  beforeEach(() => {
    repo = {
      updateState: vi.fn(async (_id, state, options) => ({
        purchaseOrderNotificationId: 1,
        purchaseOrderId: 1,
        channel: 'Email',
        state,
        attemptCount: options?.incrementAttempt ? 1 : 0,
        lastAttemptAt: new Date().toISOString(),
        sentAt: state === 'Sent' ? new Date().toISOString() : null,
        failureReason: options?.failureReason ?? null,
        alertRaised: Boolean(options?.alertRaised),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    } as unknown as PurchaseOrderNotificationsRepository;

    service = new NotificationService(repo);
  });

  it('marks notification sent after successful dispatch', async () => {
    const order = {
      purchaseOrderId: 1,
      branchId: 1,
      supplierId: 1,
      status: 'Submitted',
      approvalNeeded: false,
      preTaxTotal: 400,
      createdByUserId: 'buyer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineItems: [],
    } as PurchaseOrderWithItems;

    const pending = {
      purchaseOrderNotificationId: 1,
      purchaseOrderId: 1,
      channel: 'Email',
      state: 'Pending',
      attemptCount: 0,
      alertRaised: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SupplierNotification;

    const result = await service.dispatchPurchaseOrderSubmitted(order, pending);

    expect(result.state).toBe('Sent');
    expect((repo.updateState as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
