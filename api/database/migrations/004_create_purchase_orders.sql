-- Migration 004: Create purchase order and line item tables

CREATE TABLE IF NOT EXISTS purchase_orders (
    purchase_order_id INTEGER PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Fulfilled', 'Cancelled')),
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

CREATE TABLE IF NOT EXISTS purchase_order_line_items (
    purchase_order_line_item_id INTEGER PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    expected_unit_price REAL NOT NULL CHECK(expected_unit_price > 0),
    line_pre_tax_total REAL NOT NULL CHECK(line_pre_tax_total >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approval_needed ON purchase_orders(approval_needed);
CREATE INDEX IF NOT EXISTS idx_purchase_order_line_items_order_id ON purchase_order_line_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_line_items_product_id ON purchase_order_line_items(product_id);
