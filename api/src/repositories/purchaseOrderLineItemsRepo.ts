import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { handleDatabaseError } from '../utils/errors';
import { mapDatabaseRows, DatabaseRow } from '../utils/sql';
import { PurchaseOrderLineItem } from '../models/purchaseOrderLineItem';

export class PurchaseOrderLineItemsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async findByPurchaseOrderId(purchaseOrderId: number): Promise<PurchaseOrderLineItem[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM purchase_order_line_items WHERE purchase_order_id = ? ORDER BY purchase_order_line_item_id',
        [purchaseOrderId],
      );
      return mapDatabaseRows<PurchaseOrderLineItem>(rows);
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', purchaseOrderId);
    }
  }
}

export async function createPurchaseOrderLineItemsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderLineItemsRepository> {
  const db = await getDatabase(isTest);
  return new PurchaseOrderLineItemsRepository(db);
}

let purchaseOrderLineItemsRepo: PurchaseOrderLineItemsRepository | null = null;

export async function getPurchaseOrderLineItemsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderLineItemsRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createPurchaseOrderLineItemsRepository(true);
  }

  if (!purchaseOrderLineItemsRepo) {
    purchaseOrderLineItemsRepo = await createPurchaseOrderLineItemsRepository(false);
  }

  return purchaseOrderLineItemsRepo;
}
