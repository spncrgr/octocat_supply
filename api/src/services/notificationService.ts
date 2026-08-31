import nodemailer from 'nodemailer';
import { SupplierNotification } from '../models/supplierNotification';
import { PurchaseOrderWithItems } from '../repositories/purchaseOrdersRepo';
import { PurchaseOrderNotificationsRepository } from '../repositories/purchaseOrderNotificationsRepo';

const MAX_RETRIES = 3;

export class NotificationService {
  private repo: PurchaseOrderNotificationsRepository;
  private mailer = nodemailer.createTransport({ jsonTransport: true });

  constructor(repo: PurchaseOrderNotificationsRepository) {
    this.repo = repo;
  }

  async dispatchPurchaseOrderSubmitted(
    order: PurchaseOrderWithItems,
    notification: SupplierNotification,
  ): Promise<SupplierNotification> {
    let current = notification;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        await this.mailer.sendMail({
          from: 'no-reply@octocat-supply.local',
          to: `supplier-${order.supplierId}@octocat-supply.local`,
          subject: `Purchase Order ${order.purchaseOrderId} Submitted`,
          text: `Purchase order ${order.purchaseOrderId} has been submitted with total ${order.preTaxTotal}.`,
        });

        current = await this.repo.updateState(current.purchaseOrderNotificationId, 'Sent', {
          incrementAttempt: true,
          sentAt: new Date().toISOString(),
          failureReason: null,
          alertRaised: false,
        });
        return current;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown notification error';
        const isLastAttempt = attempt === MAX_RETRIES;

        current = await this.repo.updateState(current.purchaseOrderNotificationId, 'Failed', {
          incrementAttempt: true,
          failureReason: reason,
          alertRaised: isLastAttempt,
        });
      }
    }

    return current;
  }
}
