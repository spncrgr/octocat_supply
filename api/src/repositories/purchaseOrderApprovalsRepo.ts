import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { handleDatabaseError } from '../utils/errors';
import { mapDatabaseRows, objectToCamelCase, DatabaseRow } from '../utils/sql';
import { ApprovalDecision, ApprovalDecisionType } from '../models/approvalDecision';

export class PurchaseOrderApprovalsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async createDecision(input: {
    purchaseOrderId: number;
    approverUserId: string;
    decision: ApprovalDecisionType;
    rationale?: string;
  }): Promise<ApprovalDecision> {
    try {
      const now = new Date().toISOString();
      const result = await this.db.run(
        `INSERT INTO purchase_order_approvals (
           purchase_order_id, approver_user_id, decision, rationale, decided_at
         ) VALUES (?, ?, ?, ?, ?)`,
        [
          input.purchaseOrderId,
          input.approverUserId,
          input.decision,
          input.rationale ?? null,
          now,
        ],
      );

      const created = await this.db.get<DatabaseRow>(
        'SELECT * FROM purchase_order_approvals WHERE purchase_order_approval_id = ?',
        [result.lastID],
      );

      if (!created) {
        throw new Error('Failed to fetch created approval decision');
      }

      return objectToCamelCase<ApprovalDecision>(created);
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', input.purchaseOrderId);
    }
  }

  async findByPurchaseOrderId(purchaseOrderId: number): Promise<ApprovalDecision[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM purchase_order_approvals WHERE purchase_order_id = ? ORDER BY decided_at DESC',
        [purchaseOrderId],
      );
      return mapDatabaseRows<ApprovalDecision>(rows);
    } catch (error) {
      handleDatabaseError(error, 'PurchaseOrder', purchaseOrderId);
    }
  }
}

export async function createPurchaseOrderApprovalsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderApprovalsRepository> {
  const db = await getDatabase(isTest);
  return new PurchaseOrderApprovalsRepository(db);
}

let purchaseOrderApprovalsRepo: PurchaseOrderApprovalsRepository | null = null;

export async function getPurchaseOrderApprovalsRepository(
  isTest: boolean = false,
): Promise<PurchaseOrderApprovalsRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createPurchaseOrderApprovalsRepository(true);
  }

  if (!purchaseOrderApprovalsRepo) {
    purchaseOrderApprovalsRepo = await createPurchaseOrderApprovalsRepository(false);
  }

  return purchaseOrderApprovalsRepo;
}
