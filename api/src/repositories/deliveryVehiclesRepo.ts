/**
 * Repository for delivery vehicles data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { DeliveryVehicle } from '../models/deliveryVehicle';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import {
  buildInsertSQL,
  buildUpdateSQL,
  objectToCamelCase,
  mapDatabaseRows,
  DatabaseRow,
} from '../utils/sql';

export class DeliveryVehiclesRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async findAll(): Promise<DeliveryVehicle[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM delivery_vehicles ORDER BY delivery_vehicle_id',
      );
      return mapDatabaseRows<DeliveryVehicle>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async findById(id: number): Promise<DeliveryVehicle | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT * FROM delivery_vehicles WHERE delivery_vehicle_id = ?',
        [id],
      );
      return row ? objectToCamelCase<DeliveryVehicle>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async findByBranchId(branchId: number): Promise<DeliveryVehicle[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM delivery_vehicles WHERE branch_id = ? ORDER BY name',
        [branchId],
      );
      return mapDatabaseRows<DeliveryVehicle>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async create(vehicle: Omit<DeliveryVehicle, 'deliveryVehicleId'>): Promise<DeliveryVehicle> {
    try {
      const { sql, values } = buildInsertSQL('delivery_vehicles', vehicle);
      const result = await this.db.run(sql, values);

      const createdVehicle = await this.findById(result.lastID || 0);
      if (!createdVehicle) {
        throw new Error('Failed to retrieve created delivery vehicle');
      }

      return createdVehicle;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async update(
    id: number,
    vehicle: Partial<Omit<DeliveryVehicle, 'deliveryVehicleId'>>,
  ): Promise<DeliveryVehicle> {
    try {
      const { sql, values } = buildUpdateSQL('delivery_vehicles', vehicle, 'delivery_vehicle_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError('DeliveryVehicle', id);
      }

      const updatedVehicle = await this.findById(id);
      if (!updatedVehicle) {
        throw new Error('Failed to retrieve updated delivery vehicle');
      }

      return updatedVehicle;
    } catch (error) {
      handleDatabaseError(error, 'DeliveryVehicle', id);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM delivery_vehicles WHERE delivery_vehicle_id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('DeliveryVehicle', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'DeliveryVehicle', id);
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM delivery_vehicles WHERE delivery_vehicle_id = ?',
        [id],
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export async function createDeliveryVehiclesRepository(
  isTest: boolean = false,
): Promise<DeliveryVehiclesRepository> {
  const db = await getDatabase(isTest);
  return new DeliveryVehiclesRepository(db);
}

let deliveryVehiclesRepo: DeliveryVehiclesRepository | null = null;

export async function getDeliveryVehiclesRepository(
  isTest: boolean = false,
): Promise<DeliveryVehiclesRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createDeliveryVehiclesRepository(true);
  }
  if (!deliveryVehiclesRepo) {
    deliveryVehiclesRepo = await createDeliveryVehiclesRepository(false);
  }
  return deliveryVehiclesRepo;
}