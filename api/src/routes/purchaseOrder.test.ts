import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import purchaseOrderRouter from './purchaseOrder';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { runMigrations } from '../db/migrate';
import { errorHandler } from '../utils/errors';

let app: express.Express;

async function seedReferences(): Promise<void> {
  const db = await getDatabase(true);

  await db.run(
    'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 'PO Supplier', 'Supplier for purchase order tests', 'Alex Supplier', 'supplier@test.com', '555-9001', 1, 1],
  );

  await db.run(
    'INSERT INTO headquarters (headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [1, 'HQ', 'HQ for tests', '1 Main Street', 'HQ Lead', 'hq@test.com', '555-9002'],
  );

  await db.run(
    'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 1, 'Branch A', 'Branch for tests', '2 Main Street', 'Branch Lead', 'branch@test.com', '555-9003'],
  );

  await db.run(
    'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [1, 1, 'PO Product', 'Product for PO tests', 500, 'PO-PROD-001', 'unit', 'po-product.png', 0],
  );
}

describe('Purchase Order API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    await seedReferences();

    app = express();
    app.use(express.json());
    app.use('/purchase-orders', purchaseOrderRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('creates and updates a draft purchase order', async () => {
    const createResponse = await request(app).post('/purchase-orders').send({
      branchId: 1,
      supplierId: 1,
      createdByUserId: 'buyer-a',
      lineItems: [{ productId: 1, quantity: 2, expectedUnitPrice: 500 }],
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('Draft');
    expect(createResponse.body.preTaxTotal).toBe(1000);

    const updateResponse = await request(app)
      .patch(`/purchase-orders/${createResponse.body.purchaseOrderId}`)
      .send({
        lineItems: [{ productId: 1, quantity: 3, expectedUnitPrice: 400 }],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.preTaxTotal).toBe(1200);
  });

  it('submits a draft and creates notification records', async () => {
    const createResponse = await request(app).post('/purchase-orders').send({
      branchId: 1,
      supplierId: 1,
      createdByUserId: 'buyer-b',
      lineItems: [{ productId: 1, quantity: 2, expectedUnitPrice: 500 }],
    });

    const submitResponse = await request(app).post(
      `/purchase-orders/${createResponse.body.purchaseOrderId}/submit`,
    );

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.status).toBe('Submitted');

    const notificationsResponse = await request(app).get(
      `/purchase-orders/${createResponse.body.purchaseOrderId}/notifications`,
    );

    expect(notificationsResponse.status).toBe(200);
    expect(Array.isArray(notificationsResponse.body)).toBe(true);
    expect(notificationsResponse.body.length).toBeGreaterThan(0);
  });

  it('enforces high-value approval and prevents self-approval', async () => {
    const createResponse = await request(app).post('/purchase-orders').send({
      branchId: 1,
      supplierId: 1,
      createdByUserId: 'buyer-c',
      lineItems: [{ productId: 1, quantity: 21, expectedUnitPrice: 500 }],
    });

    await request(app).post(`/purchase-orders/${createResponse.body.purchaseOrderId}/submit`);

    const selfApprovalResponse = await request(app)
      .post(`/purchase-orders/${createResponse.body.purchaseOrderId}/approval-decisions`)
      .send({
        approverUserId: 'buyer-c',
        decision: 'Approved',
        isApproverRole: true,
      });

    expect(selfApprovalResponse.status).toBe(400);

    const approvalResponse = await request(app)
      .post(`/purchase-orders/${createResponse.body.purchaseOrderId}/approval-decisions`)
      .send({
        approverUserId: 'manager-1',
        decision: 'Approved',
        isApproverRole: true,
      });

    expect(approvalResponse.status).toBe(200);

    const fulfillResponse = await request(app)
      .patch(`/purchase-orders/${createResponse.body.purchaseOrderId}/status`)
      .send({ targetStatus: 'Fulfilled' });

    expect(fulfillResponse.status).toBe(200);
    expect(fulfillResponse.body.status).toBe('Fulfilled');
  });
});
