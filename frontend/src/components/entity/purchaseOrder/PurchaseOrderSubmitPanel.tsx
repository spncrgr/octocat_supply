import type { PurchaseOrder, SupplierNotification } from '../../../types/purchaseOrder';

interface PurchaseOrderSubmitPanelProps {
  purchaseOrder: PurchaseOrder;
  notifications: SupplierNotification[];
  onSubmit: (purchaseOrderId: number) => Promise<void>;
  loading: boolean;
}

export default function PurchaseOrderSubmitPanel({
  purchaseOrder,
  notifications,
  onSubmit,
  loading,
}: PurchaseOrderSubmitPanelProps) {
  const latestNotification = notifications[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800">Submission & Notification</h3>
      <div className="mt-2 text-sm text-gray-700">
        <p>Status: {purchaseOrder.status}</p>
        <p>Approval Needed: {purchaseOrder.approvalNeeded ? 'Yes' : 'No'}</p>
        <p>Pre-Tax Total: ${purchaseOrder.preTaxTotal.toFixed(2)}</p>
      </div>
      <button
        type="button"
        onClick={() => onSubmit(purchaseOrder.purchaseOrderId)}
        disabled={loading || purchaseOrder.status !== 'Draft'}
        className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Purchase Order'}
      </button>

      <div className="mt-3 text-sm text-gray-700">
        <p className="font-medium">Latest Notification</p>
        {!latestNotification && <p>No notifications yet.</p>}
        {latestNotification && (
          <div className="mt-1 rounded bg-gray-50 p-2">
            <p>State: {latestNotification.state}</p>
            <p>Attempts: {latestNotification.attemptCount}</p>
            <p>Alert Raised: {latestNotification.alertRaised ? 'Yes' : 'No'}</p>
            {latestNotification.failureReason && <p>Failure: {latestNotification.failureReason}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
