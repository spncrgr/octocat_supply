import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter from './product';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Product API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Test Supplier', 'Supplier for tests', 'Jane Supplier', 'jane@test.com', '555-1001', 1, 1],
    );

    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new product', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'Smart Laser Toy',
      description: 'Interactive toy for curious cats',
      price: 79.99,
      sku: 'CAT-LASER-001',
      unit: 'piece',
      imgName: 'laser-toy.png',
      discount: 0.1,
    };

    const response = await request(app).post('/products').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(newProduct);
    expect(response.body.productId).toBeDefined();
  });

  it('should get all products', async () => {
    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a product by ID', async () => {
    const createResponse = await request(app).post('/products').send({
      supplierId: 1,
      name: 'Feather Wand',
      description: 'Classic wand toy',
      price: 24.5,
      sku: 'CAT-WAND-001',
      unit: 'piece',
      imgName: 'feather-wand.png',
      discount: 0,
    });

    const response = await request(app).get(`/products/${createResponse.body.productId}`);

    expect(response.status).toBe(200);
    expect(response.body.productId).toBe(createResponse.body.productId);
    expect(response.body.name).toBe('Feather Wand');
  });

  it('should update a product by ID', async () => {
    const createResponse = await request(app).post('/products').send({
      supplierId: 1,
      name: 'Original Name',
      description: 'Original description',
      price: 49.99,
      sku: 'CAT-ORIG-001',
      unit: 'piece',
      imgName: 'original.png',
      discount: 0.05,
    });

    const updatedProduct = {
      supplierId: 1,
      name: 'Updated Product Name',
      description: 'Updated description',
      price: 59.99,
      sku: 'CAT-ORIG-002',
      unit: 'box',
      imgName: 'updated.png',
      discount: 0.15,
    };

    const response = await request(app).put(`/products/${createResponse.body.productId}`).send(updatedProduct);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Product Name');
    expect(response.body.price).toBe(59.99);
  });

  it('should delete a product by ID', async () => {
    const createResponse = await request(app).post('/products').send({
      supplierId: 1,
      name: 'Delete Me Product',
      description: 'This will be deleted',
      price: 10.0,
      sku: 'CAT-DELETE-001',
      unit: 'piece',
      imgName: 'delete-me.png',
      discount: 0,
    });

    const response = await request(app).delete(`/products/${createResponse.body.productId}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existing product', async () => {
    const response = await request(app).get('/products/999');

    expect(response.status).toBe(404);
  });
});
