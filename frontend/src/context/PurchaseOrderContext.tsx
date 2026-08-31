import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createPurchaseOrderDraft,
  listPurchaseOrders,
  submitPurchaseOrder,
  updatePurchaseOrderDraft,
  approvePurchaseOrder,
  transitionPurchaseOrderStatus,
  listPurchaseOrderNotifications,
} from '../api/purchaseOrders';
import type {
  ApprovalDecisionPayload,
  PurchaseOrder,
  PurchaseOrderLineItemInput,
  PurchaseOrderStatus,
  SupplierNotification,
} from '../types/purchaseOrder';

interface DraftPurchaseOrderInput {
  branchId: number;
  supplierId: number;
  createdByUserId: string;
  lineItems: PurchaseOrderLineItemInput[];
}

interface PurchaseOrderContextValue {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createDraft: (payload: DraftPurchaseOrderInput) => Promise<PurchaseOrder>;
  updateDraft: (
    purchaseOrderId: number,
    lineItems: PurchaseOrderLineItemInput[],
    supplierId?: number,
  ) => Promise<PurchaseOrder>;
  submitDraft: (purchaseOrderId: number) => Promise<PurchaseOrder>;
  recordApproval: (purchaseOrderId: number, payload: ApprovalDecisionPayload) => Promise<void>;
  transitionStatus: (
    purchaseOrderId: number,
    targetStatus: PurchaseOrderStatus,
  ) => Promise<PurchaseOrder>;
  getNotifications: (purchaseOrderId: number) => Promise<SupplierNotification[]>;
}

const PurchaseOrderContext = createContext<PurchaseOrderContextValue | undefined>(undefined);

export function PurchaseOrderProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPurchaseOrders();
      setPurchaseOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async (payload: DraftPurchaseOrderInput) => {
    const created = await createPurchaseOrderDraft(payload);
    setPurchaseOrders((prev) => [created, ...prev]);
    return created;
  };

  const updateDraft = async (
    purchaseOrderId: number,
    lineItems: PurchaseOrderLineItemInput[],
    supplierId?: number,
  ) => {
    const updated = await updatePurchaseOrderDraft(purchaseOrderId, { lineItems, supplierId });
    setPurchaseOrders((prev) =>
      prev.map((purchaseOrder) =>
        purchaseOrder.purchaseOrderId === purchaseOrderId ? updated : purchaseOrder,
      ),
    );
    return updated;
  };

  const submitDraft = async (purchaseOrderId: number) => {
    const submitted = await submitPurchaseOrder(purchaseOrderId);
    setPurchaseOrders((prev) =>
      prev.map((purchaseOrder) =>
        purchaseOrder.purchaseOrderId === purchaseOrderId ? submitted : purchaseOrder,
      ),
    );
    return submitted;
  };

  const recordApproval = async (
    purchaseOrderId: number,
    payload: ApprovalDecisionPayload,
  ) => {
    await approvePurchaseOrder(purchaseOrderId, payload);
    await refresh();
  };

  const transitionStatus = async (
    purchaseOrderId: number,
    targetStatus: PurchaseOrderStatus,
  ) => {
    const updated = await transitionPurchaseOrderStatus(purchaseOrderId, targetStatus);
    setPurchaseOrders((prev) =>
      prev.map((purchaseOrder) =>
        purchaseOrder.purchaseOrderId === purchaseOrderId ? updated : purchaseOrder,
      ),
    );
    return updated;
  };

  const getNotifications = async (purchaseOrderId: number) => {
    return listPurchaseOrderNotifications(purchaseOrderId);
  };

  const value = useMemo(
    () => ({
      purchaseOrders,
      loading,
      error,
      refresh,
      createDraft,
      updateDraft,
      submitDraft,
      recordApproval,
      transitionStatus,
      getNotifications,
    }),
    [error, loading, purchaseOrders],
  );

  return <PurchaseOrderContext.Provider value={value}>{children}</PurchaseOrderContext.Provider>;
}

export function usePurchaseOrders(): PurchaseOrderContextValue {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error('usePurchaseOrders must be used within PurchaseOrderProvider');
  }

  return context;
}
