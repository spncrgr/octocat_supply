-- Migration 007: expand purchase_order status enum to include partial fulfillment
-- This is a one-time schema correction for databases created under the earlier partial-fulfillment work.
-- The table is rebuilt in-place to ensure the CHECK constraint includes 'Partially Fulfilled'.

DROP TABLE IF EXISTS purchase_orders_old;
DROP TABLE IF EXISTS purchase_orders_new;

CREATE TABLE purchase_orders_new (
    purchase_order_id INTEGER PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Partially Fulfilled', 'Fulfilled', 'Cancelled')),
    approval_needed INTEGER NOT NULL DEFAULT 0 CHECK(approval_needed IN (0, 1)),
    pre_tax_total REAL NOT NULL DEFAULT 0 CHECK(pre_tax_total >= 0),
    created_by_user_id TEXT NOT NULL,
    submitted_at TEXT,
    approved_at TEXT,
    fulfilled_at TEXT,
    cancelled_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT
);

INSERT INTO purchase_orders_new (
    purchase_order_id, branch_id, supplier_id, status, approval_needed, pre_tax_total,
    created_by_user_id, submitted_at, approved_at, fulfilled_at, cancelled_at, created_at, updated_at
)
SELECT
    purchase_order_id, branch_id, supplier_id, status, approval_needed, pre_tax_total,
    created_by_user_id, submitted_at, approved_at, fulfilled_at, cancelled_at, created_at, updated_at
FROM purchase_orders;

DROP TABLE purchase_orders;
ALTER TABLE purchase_orders_new RENAME TO purchase_orders;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approval_needed ON purchase_orders(approval_needed);
