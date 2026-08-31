import { useState } from 'react';
import type { PurchaseOrderLineItemInput } from '../../../types/purchaseOrder';

interface PurchaseOrderDraftFormProps {
  onCreateDraft: (payload: {
    branchId: number;
    supplierId: number;
    createdByUserId: string;
    lineItems: PurchaseOrderLineItemInput[];
  }) => Promise<void>;
}

function emptyLineItem(): PurchaseOrderLineItemInput {
  return { productId: 1, quantity: 1, expectedUnitPrice: 1 };
}

export default function PurchaseOrderDraftForm({ onCreateDraft }: PurchaseOrderDraftFormProps) {
  const [branchId, setBranchId] = useState(1);
  const [supplierId, setSupplierId] = useState(1);
  const [createdByUserId, setCreatedByUserId] = useState('buyer-demo');
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItemInput[]>([emptyLineItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLineItem = (
    index: number,
    field: keyof PurchaseOrderLineItemInput,
    value: number,
  ) => {
    setLineItems((prev) =>
      prev.map((lineItem, lineIndex) =>
        lineIndex === index ? { ...lineItem, [field]: value } : lineItem,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onCreateDraft({ branchId, supplierId, createdByUserId, lineItems });
      setLineItems([emptyLineItem()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Create Draft Purchase Order</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-gray-700">
          Branch ID
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            type="number"
            min={1}
            value={branchId}
            onChange={(e) => setBranchId(Number(e.target.value))}
          />
        </label>
        <label className="text-sm text-gray-700">
          Supplier ID
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            type="number"
            min={1}
            value={supplierId}
            onChange={(e) => setSupplierId(Number(e.target.value))}
          />
        </label>
        <label className="text-sm text-gray-700">
          Buyer User ID
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            type="text"
            value={createdByUserId}
            onChange={(e) => setCreatedByUserId(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {lineItems.map((lineItem, index) => (
          <div key={`line-${index}`} className="grid gap-2 md:grid-cols-4">
            <input
              type="number"
              min={1}
              className="rounded border border-gray-300 px-2 py-1"
              value={lineItem.productId}
              onChange={(e) => updateLineItem(index, 'productId', Number(e.target.value))}
              aria-label={`Line item ${index + 1} product id`}
            />
            <input
              type="number"
              min={1}
              className="rounded border border-gray-300 px-2 py-1"
              value={lineItem.quantity}
              onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
              aria-label={`Line item ${index + 1} quantity`}
            />
            <input
              type="number"
              min={0.01}
              step="0.01"
              className="rounded border border-gray-300 px-2 py-1"
              value={lineItem.expectedUnitPrice}
              onChange={(e) =>
                updateLineItem(index, 'expectedUnitPrice', Number(e.target.value))
              }
              aria-label={`Line item ${index + 1} expected price`}
            />
            <button
              type="button"
              onClick={() =>
                setLineItems((prev) => prev.filter((_, lineIndex) => lineIndex !== index))
              }
              className="rounded bg-red-50 px-3 py-1 text-sm text-red-600"
              disabled={lineItems.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLineItems((prev) => [...prev, emptyLineItem()])}
          className="rounded bg-gray-100 px-3 py-1 text-sm"
        >
          Add Line Item
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Create Draft'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
