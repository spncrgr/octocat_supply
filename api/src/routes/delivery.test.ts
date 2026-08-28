import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import deliveryRouter, { resetNotifyRateLimits } from './delivery';
import supplierRouter from './supplier';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

vi.mock('child_process', () => ({
  execFile: vi.fn((...args: unknown[]) => {
    const callback = args[3] as (error: Error | null, stdout: string) => void;
    callback(null, 'notified');
  }),
}));

let app: express.Express;

describe('Delivery API rate limiting', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    resetNotifyRateLimits();

    app = express();
    app.use(express.json());
    app.use('/suppliers', supplierRouter);
    app.use('/deliveries', deliveryRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('returns 429 when notify command is called too frequently from the same IP', async () => {
    const supplierResponse = await request(app).post('/suppliers').send({
      name: 'Rate Limit Supplier',
      description: 'Rate limit test supplier',
      contactPerson: 'Rate Limit Contact',
      email: 'rate-limit@supplier.com',
      phone: '555-9911',
      active: true,
      verified: true,
    });

    const deliveryResponse = await request(app).post('/deliveries').send({
      supplierId: supplierResponse.body.supplierId,
      deliveryDate: '2026-08-28',
      name: 'Rate Limit Delivery',
      description: 'Rate limit delivery',
      status: 'pending',
    });

    for (let i = 0; i < 10; i += 1) {
      const response = await request(app)
        .put(`/deliveries/${deliveryResponse.body.deliveryId}/status`)
        .send({ status: 'in-transit', deliveryPartner: 'fast-cat-courier' });
      expect(response.status).toBe(200);
    }

    const rateLimitedResponse = await request(app)
      .put(`/deliveries/${deliveryResponse.body.deliveryId}/status`)
      .send({ status: 'in-transit', deliveryPartner: 'fast-cat-courier' });

    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.body).toEqual({
      error: 'Too many notify requests. Please try again later.',
    });
  });
});
