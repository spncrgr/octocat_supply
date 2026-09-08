import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { handleDatabaseError } from '../utils/errors';
import { mapDatabaseRows, objectToCamelCase, DatabaseRow } from '../utils/sql';
import {
  PurchaseOrderFulfillmentInput,
  PurchaseOrderFulfillmentRecord,
} from '../models/purchaseOrderFulfillment';

export class PurchaseOrderFulfillmentsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async addFulfillment(
    purchaseOrderId: number,
    input: PurchaseOrderFulfillmentInput,
  ): Promise<PurchaseOrderFulfillmentRecord> {
    try {
      const now = new Date().toISOString();
      const result = await this.db.run(
        `INSERT INTO purchase_order_fulfillments (
           purchase_order_id, purchase_order_line_item_id, quantity, reference, fulfilled_at, remarks, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchaseOrderId,
          input.purchaseOrderLineItemId,
          input.quantity,
          input.reference ?? null,
          now,
          input.remarks ?? null,
          now,
          now,
        ],
      );

      const created = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_order_fulfillments WHERE purchase_order_fulfillment_id = ?',
        [result.lastID],
      );

      if (!created) {
        throw new Error('Failed to fetch created fulfillment record');
      }

      return objectToCamelCase<PurchaseOrderFulfillmentRecord>(created);
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrderFulfillment', purchaseOrderId);
    }
  }

  async listByPurchaseOrderId(purchaseOrderId: number): Promise<PurchaseOrderFulfillmentRecord[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM purchase_order_fulfillments WHERE purchase_order_id = ? ORDER BY fulfilled_at ASC, purchase_order_fulfillment_id ASC',
        [purchaseOrderId],
      );

      return mapDatabaseRows<PurchaseOrderFulfillmentRecord>(rows);
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', purchaseOrderId);
    }
  }
}

export async function createPurchaseOrderFulfillmentsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderFulfillmentsRepository> {
  const db = await getDatabase(isTest);
  return new PurchaseOrderFulfillmentsRepository(db);
}

let purchaseOrderFulfillmentsRepo: PurchaseOrderFulfillmentsRepository | null = null;

export async function getPurchaseOrderFulfillmentsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderFulfillmentsRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createPurchaseOrderFulfillmentsRepository(true);
  }

  if (!purchaseOrderFulfillmentsRepo) {
    purchaseOrderFulfillmentsRepo = await createPurchaseOrderFulfillmentsRepository(false);
  }

  return purchaseOrderFulfillmentsRepo;
}
