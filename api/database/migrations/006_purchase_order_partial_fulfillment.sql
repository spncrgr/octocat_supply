-- Migration 006: Add partial fulfillment support and fulfillment history
-- This migration is intentionally non-destructive: the main purchase_orders table
-- already exists from migration 004 and is validated in application logic.
-- Rewriting that table is unsafe for SQLite reuse and can leave stale backup tables
-- such as purchase_orders_old behind in a previously failed migration run.

DROP TABLE IF EXISTS purchase_orders_old;
DROP TABLE IF EXISTS purchase_orders_new;

CREATE TABLE IF NOT EXISTS purchase_order_fulfillments (
    purchase_order_fulfillment_id INTEGER PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    purchase_order_line_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    reference TEXT,
    fulfilled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_order_line_item_id) REFERENCES purchase_order_line_items(purchase_order_line_item_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_fulfillments_order_id ON purchase_order_fulfillments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_fulfillments_line_item_id ON purchase_order_fulfillments(purchase_order_line_item_id);
