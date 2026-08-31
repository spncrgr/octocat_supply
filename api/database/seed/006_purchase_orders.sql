-- Seed data for purchase orders
INSERT OR IGNORE INTO purchase_orders (
    purchase_order_id,
    branch_id,
    supplier_id,
    status,
    approval_needed,
    pre_tax_total,
    created_by_user_id,
    created_at,
    updated_at
) VALUES
(1, 1, 1, 'Draft', 0, 0, 'buyer-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
