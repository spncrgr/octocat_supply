import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/purchaseOrder';
import { PurchaseOrderLineItem, PurchaseOrderLineItemInput } from '../models/purchaseOrderLineItem';

interface PurchaseOrderCreateInput {
  branchId: number;
  supplierId: number;
  createdByUserId: string;
  preTaxTotal: number;
  approvalNeeded: boolean;
  lineItems: PurchaseOrderLineItemInput[];
}

interface PurchaseOrderUpdateInput {
  supplierId?: number;
  preTaxTotal: number;
  approvalNeeded: boolean;
  lineItems: PurchaseOrderLineItemInput[];
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  lineItems: PurchaseOrderLineItem[];
}

export class PurchaseOrdersRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async findAll(filters?: {
    branchId?: number;
    supplierId?: number;
    status?: PurchaseOrderStatus;
  }): Promise<PurchaseOrder[]> {
    try {
      const clauses: string[] = [];
      const params: unknown[] = [];

      if (filters?.branchId !== undefined) {
        clauses.push('branch_id = ?');
        params.push(filters.branchId);
      }

      if (filters?.supplierId !== undefined) {
        clauses.push('supplier_id = ?');
        params.push(filters.supplierId);
      }

      if (filters?.status !== undefined) {
        clauses.push('status = ?');
        params.push(filters.status);
      }

      const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const rows = await this.db.all<DatabaseRow>(
        `SELECT * FROM purchase_orders ${whereClause} ORDER BY purchase_order_id DESC`,
        params,
      );
      return mapDatabaseRows<PurchaseOrder>(rows).map((item) => ({
        ...item,
        approvalNeeded: Boolean(item.approvalNeeded),
      }));
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async findById(id: number): Promise<PurchaseOrderWithItems | null> {
    try {
      const orderRow = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_orders WHERE purchase_order_id = ?',
        [id],
      );

      if (!orderRow) {
        return null;
      }

      const lineRows = await this.db.all<DatabaseRow>(
        'SELECT * FROM purchase_order_line_items WHERE purchase_order_id = ? ORDER BY purchase_order_line_item_id',
        [id],
      );

      const order = objectToCamelCase<PurchaseOrder>(orderRow);
      const lineItems = mapDatabaseRows<PurchaseOrderLineItem>(lineRows);

      return {
        ...order,
        approvalNeeded: Boolean(order.approvalNeeded),
        lineItems,
      };
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', id);
    }
  }

  async createDraft(input: PurchaseOrderCreateInput): Promise<PurchaseOrderWithItems> {
    try {
      const now = new Date().toISOString();
      const result = await this.db.run(
        `INSERT INTO purchase_orders (
          branch_id, supplier_id, status, approval_needed, pre_tax_total, created_by_user_id,
          created_at, updated_at
        ) VALUES (?, ?, 'Draft', ?, ?, ?, ?, ?)`,
        [
          input.branchId,
          input.supplierId,
          input.approvalNeeded ? 1 : 0,
          input.preTaxTotal,
          input.createdByUserId,
          now,
          now,
        ],
      );

      const purchaseOrderId = result.lastID;
      if (!purchaseOrderId) {
        throw new Error('Failed to create purchase order');
      }

      await this.replaceLineItems(purchaseOrderId, input.lineItems);

      const created = await this.findById(purchaseOrderId);
      if (!created) {
        throw new Error('Failed to fetch created purchase order');
      }
      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async updateDraft(id: number, input: PurchaseOrderUpdateInput): Promise<PurchaseOrderWithItems> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError('PurchaseOrder', id);
      }

      if (existing.status !== 'Draft') {
        throw new Error('Only Draft purchase orders can be updated');
      }

      const now = new Date().toISOString();
      await this.db.run(
        `UPDATE purchase_orders
           SET supplier_id = ?, pre_tax_total = ?, approval_needed = ?, updated_at = ?
         WHERE purchase_order_id = ?`,
        [
          input.supplierId ?? existing.supplierId,
          input.preTaxTotal,
          input.approvalNeeded ? 1 : 0,
          now,
          id,
        ],
      );

      await this.replaceLineItems(id, input.lineItems);

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to fetch updated purchase order');
      }

      return updated;
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', id);
    }
  }

  async transitionStatus(
    id: number,
    status: PurchaseOrderStatus,
    fields: Partial<{
      submittedAt: string;
      approvedAt: string;
      fulfilledAt: string;
      cancelledAt: string;
    }> = {},
  ): Promise<PurchaseOrderWithItems> {
    try {
      const current = await this.findById(id);
      if (!current) {
        throw new NotFoundError('PurchaseOrder', id);
      }

      const now = new Date().toISOString();
      const submittedAt = fields.submittedAt ?? current.submittedAt ?? null;
      const approvedAt = fields.approvedAt ?? current.approvedAt ?? null;
      const fulfilledAt = fields.fulfilledAt ?? current.fulfilledAt ?? null;
      const cancelledAt = fields.cancelledAt ?? current.cancelledAt ?? null;

      const result = await this.db.run(
        `UPDATE purchase_orders
         SET status = ?, submitted_at = ?, approved_at = ?, fulfilled_at = ?, cancelled_at = ?, updated_at = ?
         WHERE purchase_order_id = ?`,
        [status, submittedAt, approvedAt, fulfilledAt, cancelledAt, now, id],
      );

      if (result.changes === 0) {
        throw new NotFoundError('PurchaseOrder', id);
      }

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to fetch transitioned purchase order');
      }
      return updated;
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', id);
    }
  }

  async replaceLineItems(orderId: number, lineItems: PurchaseOrderLineItemInput[]): Promise<void> {
    try {
      await this.db.run('DELETE FROM purchase_order_line_items WHERE purchase_order_id = ?', [orderId]);

      for (const lineItem of lineItems) {
        const lineTotal = Number((lineItem.quantity * lineItem.expectedUnitPrice).toFixed(2));
        await this.db.run(
          `INSERT INTO purchase_order_line_items (
             purchase_order_id, product_id, quantity, expected_unit_price, line_pre_tax_total,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            lineItem.productId,
            lineItem.quantity,
            lineItem.expectedUnitPrice,
            lineTotal,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        );
      }
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', orderId);
    }
  }
}

export async function createPurchaseOrdersRepository(
  isTest: boolean = false,
): Promise<PurchaseOrdersRepository> {
  const db = await getDatabase(isTest);
  return new PurchaseOrdersRepository(db);
}

let purchaseOrdersRepo: PurchaseOrdersRepository | null = null;

export async function getPurchaseOrdersRepository(
  isTest: boolean = false,
): Promise<PurchaseOrdersRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createPurchaseOrdersRepository(true);
  }

  if (!purchaseOrdersRepo) {
    purchaseOrdersRepo = await createPurchaseOrdersRepository(false);
  }

  return purchaseOrdersRepo;
}
