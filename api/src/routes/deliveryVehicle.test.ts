import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import deliveryVehicleRouter from './deliveryVehicle';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('DeliveryVehicle API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name) VALUES (?, ?, ?)',
      [1, 1, 'Central Branch'],
    );
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name) VALUES (?, ?, ?)',
      [2, 1, 'West Branch'],
    );

    app = express();
    app.use(express.json());
    app.use('/delivery-vehicles', deliveryVehicleRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new delivery vehicle', async () => {
    const newVehicle = {
      branchId: 1,
      name: 'Van A',
      plateNumber: 'CAT-100',
      vehicleType: 'van',
      capacityKg: 1200,
      status: 'active',
    };

    const response = await request(app).post('/delivery-vehicles').send(newVehicle);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(newVehicle);
    expect(response.body.deliveryVehicleId).toBeDefined();
  });

  it('should get all delivery vehicles', async () => {
    const response = await request(app).get('/delivery-vehicles');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a delivery vehicle by ID', async () => {
    const createResponse = await request(app).post('/delivery-vehicles').send({
      branchId: 1,
      name: 'Truck One',
      plateNumber: 'CAT-101',
      vehicleType: 'truck',
      capacityKg: 2800,
      status: 'active',
    });

    const response = await request(app).get(`/delivery-vehicles/${createResponse.body.deliveryVehicleId}`);

    expect(response.status).toBe(200);
    expect(response.body.deliveryVehicleId).toBe(createResponse.body.deliveryVehicleId);
    expect(response.body.name).toBe('Truck One');
  });

  it('should get delivery vehicles by branch ID', async () => {
    await request(app).post('/delivery-vehicles').send({
      branchId: 1,
      name: 'Branch One Van',
      plateNumber: 'CAT-201',
      vehicleType: 'van',
      capacityKg: 1000,
      status: 'active',
    });

    await request(app).post('/delivery-vehicles').send({
      branchId: 2,
      name: 'Branch Two Van',
      plateNumber: 'CAT-202',
      vehicleType: 'van',
      capacityKg: 1000,
      status: 'active',
    });

    const response = await request(app).get('/delivery-vehicles/branch/1');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].branchId).toBe(1);
  });

  it('should update a delivery vehicle by ID', async () => {
    const createResponse = await request(app).post('/delivery-vehicles').send({
      branchId: 1,
      name: 'Original Vehicle',
      plateNumber: 'CAT-301',
      vehicleType: 'bike',
      capacityKg: 150,
      status: 'inactive',
    });

    const updatedVehicle = {
      branchId: 1,
      name: 'Updated Vehicle',
      plateNumber: 'CAT-301',
      vehicleType: 'bike',
      capacityKg: 200,
      status: 'active',
    };

    const response = await request(app)
      .put(`/delivery-vehicles/${createResponse.body.deliveryVehicleId}`)
      .send(updatedVehicle);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Vehicle');
    expect(response.body.capacityKg).toBe(200);
  });

  it('should delete a delivery vehicle by ID', async () => {
    const createResponse = await request(app).post('/delivery-vehicles').send({
      branchId: 1,
      name: 'Delete Vehicle',
      plateNumber: 'CAT-401',
      vehicleType: 'van',
      capacityKg: 900,
      status: 'active',
    });

    const response = await request(app).delete(
      `/delivery-vehicles/${createResponse.body.deliveryVehicleId}`,
    );

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existing delivery vehicle', async () => {
    const response = await request(app).get('/delivery-vehicles/999');

    expect(response.status).toBe(404);
  });
});