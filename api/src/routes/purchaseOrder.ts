/**
 * @swagger
 * tags:
 *   name: PurchaseOrders
 *   description: API endpoints for managing purchase orders
 *
 * /api/purchase-orders:
 *   get:
 *     summary: List purchase orders
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Purchase orders returned
 *   post:
 *     summary: Create a draft purchase order
 *     tags: [PurchaseOrders]
 *     responses:
 *       201:
 *         description: Draft purchase order created
 *
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Purchase order returned
 *       404:
 *         description: Purchase order not found
 *   patch:
 *     summary: Update a draft purchase order
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Draft purchase order updated
 *
 * /api/purchase-orders/{id}/submit:
 *   post:
 *     summary: Submit a draft purchase order and trigger supplier notification
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Purchase order submitted
 *
 * /api/purchase-orders/{id}/approval-decisions:
 *   post:
 *     summary: Record high-value approval decision
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Approval decision recorded
 *
 * /api/purchase-orders/{id}/status:
 *   patch:
 *     summary: Transition purchase order status
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Purchase order status updated
 *
 * /api/purchase-orders/{id}/notifications:
 *   get:
 *     summary: List purchase order notification attempts
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: Notification attempts returned
 */

import express from 'express';
import { ValidationError } from '../utils/errors';
import { getPurchaseOrdersRepository } from '../repositories/purchaseOrdersRepo';
import { getPurchaseOrderApprovalsRepository } from '../repositories/purchaseOrderApprovalsRepo';
import { getPurchaseOrderNotificationsRepository } from '../repositories/purchaseOrderNotificationsRepo';
import { NotificationService } from '../services/notificationService';
import { PurchaseOrderService } from '../services/purchaseOrderService';
import { PurchaseOrderStatus } from '../models/purchaseOrder';

const router = express.Router();

async function getPurchaseOrderService(): Promise<PurchaseOrderService> {
  const purchaseOrdersRepo = await getPurchaseOrdersRepository();
  const approvalsRepo = await getPurchaseOrderApprovalsRepository();
  const notificationsRepo = await getPurchaseOrderNotificationsRepository();
  const notificationService = new NotificationService(notificationsRepo);

  return new PurchaseOrderService(
    purchaseOrdersRepo,
    approvalsRepo,
    notificationsRepo,
    notificationService,
  );
}

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('ID must be a positive integer');
  }
  return id;
}

router.get('/', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const status = req.query.status as PurchaseOrderStatus | undefined;

    const purchaseOrders = await service.listPurchaseOrders({ branchId, supplierId, status });
    res.json(purchaseOrders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const purchaseOrder = await service.getPurchaseOrderById(parseId(req.params.id));
    res.json(purchaseOrder);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const purchaseOrder = await service.createDraft({
      branchId: Number(req.body.branchId),
      supplierId: Number(req.body.supplierId),
      createdByUserId: String(req.body.createdByUserId),
      lineItems: req.body.lineItems,
    });
    res.status(201).json(purchaseOrder);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const purchaseOrder = await service.updateDraft(parseId(req.params.id), {
      supplierId: req.body.supplierId !== undefined ? Number(req.body.supplierId) : undefined,
      lineItems: req.body.lineItems,
    });
    res.json(purchaseOrder);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/submit', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const purchaseOrder = await service.submitDraft(parseId(req.params.id));
    res.json(purchaseOrder);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approval-decisions', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const decision = await service.recordApprovalDecision(parseId(req.params.id), {
      approverUserId: String(req.body.approverUserId),
      decision: req.body.decision,
      rationale: req.body.rationale,
      isApproverRole: Boolean(req.body.isApproverRole),
    });
    res.json(decision);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const purchaseOrder = await service.transitionStatus(
      parseId(req.params.id),
      req.body.targetStatus as PurchaseOrderStatus,
    );
    res.json(purchaseOrder);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/notifications', async (req, res, next) => {
  try {
    const service = await getPurchaseOrderService();
    const notifications = await service.listNotifications(parseId(req.params.id));
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

export default router;
