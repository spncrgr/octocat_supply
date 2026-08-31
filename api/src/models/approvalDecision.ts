export type ApprovalDecisionType = 'Approved' | 'Rejected';

export interface ApprovalDecision {
  purchaseOrderApprovalId: number;
  purchaseOrderId: number;
  approverUserId: string;
  decision: ApprovalDecisionType;
  rationale?: string | null;
  decidedAt: string;
}
