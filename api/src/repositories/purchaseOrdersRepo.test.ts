import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { runMigrations } from '../db/migrate';
import { createPurchaseOrdersRepository } from './purchaseOrdersRepo';

async function seedReferences(): Promise<void> {
  const db = await getDatabase(true);

  await db.run(
    'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 'Repo Supplier', 'Supplier for repo tests', 'Repo Contact', 'repo@test.com', '555-8801', 1, 1],
  );

  await db.run(
    'INSERT INTO headquarters (headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [1, 'Repo HQ', 'HQ for repo tests', '7 Repo Street', 'Repo Lead', 'repo-hq@test.com', '555-8802'],
  );

  await db.run(
    'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 1, 'Repo Branch', 'Branch for repo tests', '8 Repo Street', 'Repo Branch Lead', 'repo-branch@test.com', '555-8803'],
  );

  await db.run(
    'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 1, 'Repo Product', 'Product for repo tests', 250, 'REPO-PROD-001', 'unit', 'repo-product.png', 0],
  );
}

describe('PurchaseOrdersRepository', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    await seedReferences();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('creates and retrieves draft purchase orders with line items', async () => {
    const repo = await createPurchaseOrdersRepository(true);

    const created = await repo.createDraft({
      branchId: 1,
      supplierId: 1,
      createdByUserId: 'repo-buyer',
      preTaxTotal: 750,
      approvalNeeded: false,
      lineItems: [{ productId: 1, quantity: 3, expectedUnitPrice: 250 }],
    });

    expect(created.purchaseOrderId).toBeDefined();
    expect(created.status).toBe('Draft');
    expect(created.lineItems).toHaveLength(1);

    const found = await repo.findById(created.purchaseOrderId);
    expect(found).not.toBeNull();
    expect(found?.lineItems[0].quantity).toBe(3);
  });

  it('updates draft line items and totals', async () => {
    const repo = await createPurchaseOrdersRepository(true);

    const created = await repo.createDraft({
      branchId: 1,
      supplierId: 1,
      createdByUserId: 'repo-buyer-2',
      preTaxTotal: 500,
      approvalNeeded: false,
      lineItems: [{ productId: 1, quantity: 2, expectedUnitPrice: 250 }],
    });

    const updated = await repo.updateDraft(created.purchaseOrderId, {
      preTaxTotal: 1000,
      approvalNeeded: false,
      lineItems: [{ productId: 1, quantity: 4, expectedUnitPrice: 250 }],
    });

    expect(updated.preTaxTotal).toBe(1000);
    expect(updated.lineItems[0].quantity).toBe(4);
  });
});
