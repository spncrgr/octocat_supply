import { useState } from 'react';
import type { PurchaseOrder } from '../../../types/purchaseOrder';

interface PurchaseOrderApprovalPanelProps {
  purchaseOrder: PurchaseOrder;
  onDecision: (purchaseOrderId: number, payload: {
    approverUserId: string;
    decision: 'Approved' | 'Rejected';
    isApproverRole: boolean;
    rationale?: string;
  }) => Promise<void>;
}

export default function PurchaseOrderApprovalPanel({
  purchaseOrder,
  onDecision,
}: PurchaseOrderApprovalPanelProps) {
  const [approverUserId, setApproverUserId] = useState('manager-demo');
  const [isApproverRole, setIsApproverRole] = useState(true);
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!purchaseOrder.approvalNeeded) {
    return null;
  }

  const handleDecision = async (decision: 'Approved' | 'Rejected') => {
    setError(null);
    try {
      await onDecision(purchaseOrder.purchaseOrderId, {
        approverUserId,
        decision,
        isApproverRole,
        rationale,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply approval decision');
    }
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-900">High-Value Approval</h3>
      <p className="mt-1 text-xs text-amber-800">
        Submitted high-value orders require a branch manager or designated approver. Creators cannot self-approve.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input
          type="text"
          value={approverUserId}
          onChange={(e) => setApproverUserId(e.target.value)}
          className="rounded border border-amber-300 px-2 py-1 text-sm"
          placeholder="Approver user ID"
        />
        <label className="inline-flex items-center gap-2 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={isApproverRole}
            onChange={(e) => setIsApproverRole(e.target.checked)}
          />
          User has approver role
        </label>
      </div>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        className="mt-2 w-full rounded border border-amber-300 px-2 py-1 text-sm"
        rows={2}
        placeholder="Optional rationale"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white"
          onClick={() => handleDecision('Approved')}
        >
          Approve
        </button>
        <button
          type="button"
          className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white"
          onClick={() => handleDecision('Rejected')}
        >
          Reject
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
