import type { PurchaseOrder } from '../../../types/purchaseOrder';

interface PurchaseOrderStatusTimelineProps {
  purchaseOrder: PurchaseOrder;
}

export default function PurchaseOrderStatusTimeline({
  purchaseOrder,
}: PurchaseOrderStatusTimelineProps) {
  const statuses = ['Draft', 'Submitted', 'Approved', 'Fulfilled', 'Cancelled'] as const;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Status Timeline</h3>
      <ol className="mt-2 space-y-1 text-sm">
        {statuses.map((status) => {
          const active = purchaseOrder.status === status;
          return (
            <li key={status} className={active ? 'font-semibold text-blue-700' : 'text-gray-500'}>
              {status}
            </li>
          );
        })}
      </ol>
      {purchaseOrder.status === 'Submitted' && purchaseOrder.approvalNeeded && (
        <p className="mt-2 text-xs text-amber-700">
          Approval needed before fulfillment.
        </p>
      )}
    </div>
  );
}
