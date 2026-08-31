-- Migration 005: Create purchase order approval and notification tables

CREATE TABLE IF NOT EXISTS purchase_order_approvals (
    purchase_order_approval_id INTEGER PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    approver_user_id TEXT NOT NULL,
    decision TEXT NOT NULL CHECK(decision IN ('Approved', 'Rejected')),
    rationale TEXT,
    decided_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_order_notifications (
    purchase_order_notification_id INTEGER PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    channel TEXT NOT NULL DEFAULT 'Email',
    state TEXT NOT NULL CHECK(state IN ('Pending', 'Sent', 'Failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
    last_attempt_at TEXT,
    sent_at TEXT,
    failure_reason TEXT,
    alert_raised INTEGER NOT NULL DEFAULT 0 CHECK(alert_raised IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_po_approvals_order_id ON purchase_order_approvals(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_notifications_order_id ON purchase_order_notifications(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_notifications_state ON purchase_order_notifications(state);
