import axios from 'axios';
import { api } from './config';
import type {
  ApprovalDecisionPayload,
  PurchaseOrder,
  PurchaseOrderLineItemInput,
  PurchaseOrderStatus,
  SupplierNotification,
} from '../types/purchaseOrder';

interface CreateDraftPayload {
  branchId: number;
  supplierId: number;
  createdByUserId: string;
  lineItems: PurchaseOrderLineItemInput[];
}

interface UpdateDraftPayload {
  supplierId?: number;
  lineItems: PurchaseOrderLineItemInput[];
}

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data } = await axios.get<PurchaseOrder[]>(`${api.baseURL}${api.endpoints.purchaseOrders}`);
  return data;
}

export async function createPurchaseOrderDraft(payload: CreateDraftPayload): Promise<PurchaseOrder> {
  const { data } = await axios.post<PurchaseOrder>(
    `${api.baseURL}${api.endpoints.purchaseOrders}`,
    payload,
  );
  return data;
}

export async function updatePurchaseOrderDraft(
  purchaseOrderId: number,
  payload: UpdateDraftPayload,
): Promise<PurchaseOrder> {
  const { data } = await axios.patch<PurchaseOrder>(
    `${api.baseURL}${api.endpoints.purchaseOrders}/${purchaseOrderId}`,
    payload,
  );
  return data;
}

export async function submitPurchaseOrder(purchaseOrderId: number): Promise<PurchaseOrder> {
  const { data } = await axios.post<PurchaseOrder>(
    `${api.baseURL}${api.endpoints.purchaseOrders}/${purchaseOrderId}/submit`,
  );
  return data;
}

export async function approvePurchaseOrder(
  purchaseOrderId: number,
  payload: ApprovalDecisionPayload,
): Promise<void> {
  await axios.post(`${api.baseURL}${api.endpoints.purchaseOrders}/${purchaseOrderId}/approval-decisions`, payload);
}

export async function transitionPurchaseOrderStatus(
  purchaseOrderId: number,
  targetStatus: PurchaseOrderStatus,
): Promise<PurchaseOrder> {
  const { data } = await axios.patch<PurchaseOrder>(
    `${api.baseURL}${api.endpoints.purchaseOrders}/${purchaseOrderId}/status`,
    { targetStatus },
  );
  return data;
}

export async function listPurchaseOrderNotifications(
  purchaseOrderId: number,
): Promise<SupplierNotification[]> {
  const { data } = await axios.get<SupplierNotification[]>(
    `${api.baseURL}${api.endpoints.purchaseOrders}/${purchaseOrderId}/notifications`,
  );
  return data;
}
