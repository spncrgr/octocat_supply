import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { mapDatabaseRows, objectToCamelCase, DatabaseRow } from '../utils/sql';
import { SupplierNotification, SupplierNotificationState } from '../models/supplierNotification';

export class PurchaseOrderNotificationsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async createPending(purchaseOrderId: number): Promise<SupplierNotification> {
    try {
      const now = new Date().toISOString();
      const result = await this.db.run(
        `INSERT INTO purchase_order_notifications (
           purchase_order_id, channel, state, attempt_count, created_at, updated_at
         ) VALUES (?, 'Email', 'Pending', 0, ?, ?)`,
        [purchaseOrderId, now, now],
      );

      const created = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_order_notifications WHERE purchase_order_notification_id = ?',
        [result.lastID],
      );
      if (!created) {
        throw new Error('Failed to fetch created supplier notification');
      }

      const notification = objectToCamelCase<SupplierNotification>(created);
      return { ...notification, alertRaised: Boolean(notification.alertRaised) };
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', purchaseOrderId);
    }
  }

  async updateState(
    notificationId: number,
    state: SupplierNotificationState,
    options: {
      failureReason?: string | null;
      sentAt?: string | null;
      lastAttemptAt?: string | null;
      incrementAttempt?: boolean;
      alertRaised?: boolean;
    } = {},
  ): Promise<SupplierNotification> {
    try {
      const existing = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_order_notifications WHERE purchase_order_notification_id = ?',
        [notificationId],
      );

      if (!existing) {
        throw new NotFoundError('PurchaseOrderNotification', notificationId);
      }

      const existingNotification = objectToCamelCase<SupplierNotification>(existing);
      const attemptCount =
        existingNotification.attemptCount + (options.incrementAttempt ? 1 : 0);
      const now = new Date().toISOString();

      const result = await this.db.run(
        `UPDATE purchase_order_notifications
         SET state = ?,
             attempt_count = ?,
             last_attempt_at = ?,
             sent_at = ?,
             failure_reason = ?,
             alert_raised = ?,
             updated_at = ?
         WHERE purchase_order_notification_id = ?`,
        [
          state,
          attemptCount,
          options.lastAttemptAt ?? now,
          options.sentAt ?? null,
          options.failureReason ?? null,
          options.alertRaised ? 1 : 0,
          now,
          notificationId,
        ],
      );

      if (result.changes === 0) {
        throw new NotFoundError('PurchaseOrderNotification', notificationId);
      }

      const updated = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_order_notifications WHERE purchase_order_notification_id = ?',
        [notificationId],
      );

      if (!updated) {
        throw new Error('Failed to fetch updated supplier notification');
      }

      const notification = objectToCamelCase<SupplierNotification>(updated);
      return { ...notification, alertRaised: Boolean(notification.alertRaised) };
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrderNotification', notificationId);
    }
  }

  async findByPurchaseOrderId(purchaseOrderId: number): Promise<SupplierNotification[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM purchase_order_notifications WHERE purchase_order_id = ? ORDER BY purchase_order_notification_id DESC',
        [purchaseOrderId],
      );
      return mapDatabaseRows<SupplierNotification>(rows).map((item) => ({
        ...item,
        alertRaised: Boolean(item.alertRaised),
      }));
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', purchaseOrderId);
    }
  }
}

export async function createPurchaseOrderNotificationsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderNotificationsRepository> {
  const db = await getDatabase(isTest);
  return new PurchaseOrderNotificationsRepository(db);
}

let purchaseOrderNotificationsRepo: PurchaseOrderNotificationsRepository | null = null;

export async function getPurchaseOrderNotificationsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderNotificationsRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createPurchaseOrderNotificationsRepository(true);
  }

  if (!purchaseOrderNotificationsRepo) {
    purchaseOrderNotificationsRepo = await createPurchaseOrderNotificationsRepository(false);
  }

  return purchaseOrderNotificationsRepo;
}
