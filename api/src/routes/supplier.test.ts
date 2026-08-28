import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import supplierRouter from './supplier';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Supplier API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    app = express();
    app.use(express.json());
    app.use('/suppliers', supplierRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new supplier', async () => {
    const newSupplier = {
      name: 'North Paw Supply',
      description: 'Premium cat supplies',
      contactPerson: 'Ava Paws',
      email: 'ava@northpaw.com',
      phone: '555-2100',
      active: true,
      verified: false,
    };

    const response = await request(app).post('/suppliers').send(newSupplier);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      ...newSupplier,
      active: true,
      verified: false,
    });
    expect(response.body.supplierId).toBeDefined();
  });

  it('should get all suppliers', async () => {
    const response = await request(app).get('/suppliers');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a supplier by ID', async () => {
    const createResponse = await request(app).post('/suppliers').send({
      name: 'Mittens & Co',
      description: 'Toy and accessory supplier',
      contactPerson: 'Marta Mew',
      email: 'marta@mittensco.com',
      phone: '555-2101',
      active: true,
      verified: true,
    });

    const response = await request(app).get(`/suppliers/${createResponse.body.supplierId}`);

    expect(response.status).toBe(200);
    expect(response.body.supplierId).toBe(createResponse.body.supplierId);
    expect(response.body.name).toBe('Mittens & Co');
  });

  it('should update a supplier by ID', async () => {
    const createResponse = await request(app).post('/suppliers').send({
      name: 'Original Supplier',
      description: 'Original description',
      contactPerson: 'Original Contact',
      email: 'original@supplier.com',
      phone: '555-2102',
      active: false,
      verified: false,
    });

    const updatedSupplier = {
      name: 'Updated Supplier',
      description: 'Updated description',
      contactPerson: 'New Contact',
      email: 'updated@supplier.com',
      phone: '555-2103',
      active: true,
      verified: true,
    };

    const response = await request(app)
      .put(`/suppliers/${createResponse.body.supplierId}`)
      .send(updatedSupplier);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Supplier');
    expect(response.body.active).toBe(true);
  });

  it('should delete a supplier by ID', async () => {
    const createResponse = await request(app).post('/suppliers').send({
      name: 'Delete Me Supplier',
      description: 'This supplier will be deleted',
      contactPerson: 'Delete Person',
      email: 'delete@supplier.com',
      phone: '555-2999',
      active: true,
      verified: false,
    });

    const response = await request(app).delete(`/suppliers/${createResponse.body.supplierId}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existing supplier', async () => {
    const response = await request(app).get('/suppliers/999');

    expect(response.status).toBe(404);
  });

  it('should return the supplier status by ID', async () => {
    const createResponse = await request(app).post('/suppliers').send({
      name: 'Status Supplier',
      description: 'Status test supplier',
      contactPerson: 'Status Person',
      email: 'status@supplier.com',
      phone: '555-2200',
      active: true,
      verified: false,
    });

    const response = await request(app).get(`/suppliers/${createResponse.body.supplierId}/status`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'APPROVED' });
  });
});
