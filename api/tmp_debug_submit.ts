import express from 'express';
import request from 'supertest';
import purchaseOrderRouter from './src/routes/purchaseOrder.ts';
import { closeDatabase, getDatabase } from './src/db/sqlite';
import { runMigrations } from './src/db/migrate';
import { errorHandler } from './src/utils/errors';

async function seedReferences() {
  const db = await getDatabase(true);
  await db.run('INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 'PO Supplier', 'Supplier for purchase order tests', 'Alex Supplier', 'supplier@test.com', '555-9001', 1, 1]);
  await db.run('INSERT INTO headquarters (headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, 'HQ', 'HQ for tests', '1 Main Street', 'HQ Lead', 'hq@test.com', '555-9002']);
  await db.run('INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 1, 'Branch A', 'Branch for tests', '2 Main Street', 'Branch Lead', 'branch@test.com', '555-9003']);
  await db.run('INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, 1, 'PO Product', 'Product for PO tests', 500, 'PO-PROD-001', 'unit', 'po-product.png', 0]);
}

async function main() {
  await closeDatabase();
  await getDatabase(true);
  await runMigrations(true);
  await seedReferences();
  const app = express();
  app.use(express.json());
  app.use('/purchase-orders', purchaseOrderRouter);
  app.use(errorHandler);

  const createRes = await request(app).post('/purchase-orders').send({
    branchId: 1,
    supplierId: 1,
    createdByUserId: 'buyer-b',
    lineItems: [{ productId: 1, quantity: 2, expectedUnitPrice: 500 }],
  });
  console.log('CREATE', createRes.status, JSON.stringify(createRes.body, null, 2));

  const submitRes = await request(app).post(`/purchase-orders/${createRes.body.purchaseOrderId}/submit`);
  console.log('SUBMIT', submitRes.status, JSON.stringify(submitRes.body, null, 2));

  await closeDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
