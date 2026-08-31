import { useEffect, useMemo, useState } from 'react';
import { PurchaseOrderProvider, usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import PurchaseOrderDraftForm from './PurchaseOrderDraftForm';
import PurchaseOrderSubmitPanel from './PurchaseOrderSubmitPanel';
import PurchaseOrderApprovalPanel from './PurchaseOrderApprovalPanel';
import PurchaseOrderStatusTimeline from './PurchaseOrderStatusTimeline';
import type { SupplierNotification } from '../../../types/purchaseOrder';

function PurchaseOrdersPageInner() {
  const {
    purchaseOrders,
    loading,
    error,
    refresh,
    createDraft,
    submitDraft,
    recordApproval,
    getNotifications,
    transitionStatus,
  } = usePurchaseOrders();
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<number | null>(null);
  const [notificationMap, setNotificationMap] = useState<Record<number, SupplierNotification[]>>({});

  useEffect(() => {
    void refresh();
  }, []);

  const selectedPurchaseOrder = useMemo(() => {
    if (!selectedPurchaseOrderId) {
      return purchaseOrders[0] ?? null;
    }

    return purchaseOrders.find((purchaseOrder) => purchaseOrder.purchaseOrderId === selectedPurchaseOrderId) ?? null;
  }, [purchaseOrders, selectedPurchaseOrderId]);

  const handleCreateDraft = async (payload: {
    branchId: number;
    supplierId: number;
    createdByUserId: string;
    lineItems: Array<{ productId: number; quantity: number; expectedUnitPrice: number }>;
  }) => {
    const created = await createDraft(payload);
    setSelectedPurchaseOrderId(created.purchaseOrderId);
    await refresh();
  };

  const handleSubmit = async (purchaseOrderId: number) => {
    await submitDraft(purchaseOrderId);
    const notifications = await getNotifications(purchaseOrderId);
    setNotificationMap((prev) => ({ ...prev, [purchaseOrderId]: notifications }));
  };

  const handleLoadNotifications = async (purchaseOrderId: number) => {
    const notifications = await getNotifications(purchaseOrderId);
    setNotificationMap((prev) => ({ ...prev, [purchaseOrderId]: notifications }));
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create drafts, submit orders to suppliers, and handle high-value approval workflows.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <PurchaseOrderDraftForm onCreateDraft={handleCreateDraft} />

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Purchase Order List</h2>
            <button
              type="button"
              className="mt-2 rounded bg-gray-100 px-3 py-1 text-xs"
              onClick={() => void refresh()}
            >
              Refresh
            </button>

            {loading && <p className="mt-2 text-sm text-gray-500">Loading purchase orders...</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <ul className="mt-3 space-y-2">
              {purchaseOrders.map((purchaseOrder) => (
                <li key={purchaseOrder.purchaseOrderId}>
                  <button
                    type="button"
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${selectedPurchaseOrder?.purchaseOrderId === purchaseOrder.purchaseOrderId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => {
                      setSelectedPurchaseOrderId(purchaseOrder.purchaseOrderId);
                      void handleLoadNotifications(purchaseOrder.purchaseOrderId);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>PO #{purchaseOrder.purchaseOrderId}</span>
                      <span className="font-semibold">{purchaseOrder.status}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Supplier {purchaseOrder.supplierId} • ${purchaseOrder.preTaxTotal.toFixed(2)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {selectedPurchaseOrder && (
            <>
              <PurchaseOrderStatusTimeline purchaseOrder={selectedPurchaseOrder} />
              <PurchaseOrderSubmitPanel
                purchaseOrder={selectedPurchaseOrder}
                notifications={notificationMap[selectedPurchaseOrder.purchaseOrderId] ?? []}
                loading={loading}
                onSubmit={handleSubmit}
              />
              <PurchaseOrderApprovalPanel
                purchaseOrder={selectedPurchaseOrder}
                onDecision={async (purchaseOrderId, payload) => {
                  await recordApproval(purchaseOrderId, payload);
                  await refresh();
                }}
              />

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-800">Transitions</h3>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                    onClick={async () => {
                      await transitionStatus(selectedPurchaseOrder.purchaseOrderId, 'Fulfilled');
                      await refresh();
                    }}
                  >
                    Mark Fulfilled
                  </button>
                  <button
                    type="button"
                    className="rounded bg-gray-700 px-3 py-1 text-xs font-semibold text-white"
                    onClick={async () => {
                      await transitionStatus(selectedPurchaseOrder.purchaseOrderId, 'Cancelled');
                      await refresh();
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <PurchaseOrderProvider>
      <PurchaseOrdersPageInner />
    </PurchaseOrderProvider>
  );
}
