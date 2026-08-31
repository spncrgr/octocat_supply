export type SupplierNotificationState = 'Pending' | 'Sent' | 'Failed';

export interface SupplierNotification {
  purchaseOrderNotificationId: number;
  purchaseOrderId: number;
  channel: string;
  state: SupplierNotificationState;
  attemptCount: number;
  lastAttemptAt?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  alertRaised: boolean;
  createdAt: string;
  updatedAt: string;
}
