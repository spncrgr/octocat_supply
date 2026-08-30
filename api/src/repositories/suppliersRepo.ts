/**
 * Repository for suppliers data access.
 *
 * Provides CRUD operations and lookup helpers for supplier records stored in SQLite.
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { Supplier } from '../models/supplier';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class SuppliersRepository {
  private db: DatabaseConnection;

  /**
   * Creates a repository bound to a specific database connection.
   *
   * @param db - The SQLite database connection to use for repository operations.
   */
  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Retrieves every supplier in the database, ordered by supplier ID.
   *
   * @returns A promise that resolves to an array of all supplier records.
   *
   * @example
   * const repository = await getSuppliersRepository();
   * const suppliers = await repository.findAll();
   * console.log(suppliers[0]?.name);
   */
  async findAll(): Promise<Supplier[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM suppliers ORDER BY supplier_id');
      return this.mapSupplierRows(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Retrieves a single supplier by its unique identifier.
   *
   * @param id - The supplier ID to look up.
   * @returns A promise resolving to the matching supplier, or null when no supplier exists.
   *
   * @example
   * const supplier = await repository.findById(42);
   * if (supplier) {
   *   console.log(supplier.companyName);
   * }
   */
  async findById(id: number): Promise<Supplier | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
      return this.toSupplierOrNull(row);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Converts a database row into a typed supplier model when present.
   *
   * @param row - The raw SQLite row returned by the database.
   * @returns The mapped supplier record or null when no row exists.
   */
  private toSupplierOrNull(row: DatabaseRow | undefined): Supplier | null {
    if (!row) {
      return null;
    }

    return this.convertBooleanFields(objectToCamelCase<Supplier>(row));
  }

  /**
   * Maps raw database rows into supplier models and normalizes boolean values.
   *
   * @param rows - Database rows returned from a supplier query.
   * @returns Supplier objects ready for application use.
   */
  private mapSupplierRows(rows: DatabaseRow[]): Supplier[] {
    return mapDatabaseRows<Supplier>(rows).map((supplier) => this.convertBooleanFields(supplier));
  }

  /**
   * Converts integer-based SQLite boolean values into JavaScript booleans.
   *
   * SQLite stores booleans as integers, so this normalizes the data when returning
   * records from the database to the application model.
   *
   * @param supplier - The supplier object to normalize.
   * @returns A copy of the supplier with boolean fields converted to real booleans.
   */
  private convertBooleanFields(supplier: Supplier): Supplier {
    return {
      ...supplier,
      active: Boolean(supplier.active),
      verified: Boolean(supplier.verified),
    };
  }

  /**
   * Converts JavaScript boolean fields into SQLite-safe integer values before persisting.
   *
   * This ensures values such as `true` and `false` are stored as `1` and `0` in SQLite.
   *
   * @param supplier - A partial supplier payload to normalize before insert or update.
   * @returns A copy of the payload with boolean values converted to numeric integers.
   */
  private normalizeSupplierValues<T extends Partial<Omit<Supplier, 'supplierId'>>>(supplier: T): T {
    const normalized = { ...supplier };

    if (normalized.active !== undefined) {
      normalized.active = Number(Boolean(normalized.active)) as unknown as T['active'];
    }
    if (normalized.verified !== undefined) {
      normalized.verified = Number(Boolean(normalized.verified)) as unknown as T['verified'];
    }

    return normalized;
  }

  /**
   * Verifies that a database write affected at least one row.
   *
   * @param result - Database write result metadata.
   * @returns True when the operation changed at least one row.
   */
  private hasWriteChanges(result: { changes: number }): boolean {
    return result.changes > 0;
  }

  /**
   * Ensures the created or updated supplier can be read back from the database.
   *
   * @param supplier - The supplier retrieved after a write operation.
   * @throws Error when the persisted record cannot be loaded.
   */
  private assertSupplierLoaded(supplier: Supplier | null): asserts supplier is Supplier {
    if (!supplier) {
      throw new Error('Failed to retrieve supplier after write operation');
    }
  }

  /**
   * Inserts a new supplier record into the database.
   *
   * @param supplier - The supplier payload without a supplierId. The repository will persist it and return the inserted record.
   * @returns A promise that resolves to the newly created supplier record.
   *
   * @example
   * const created = await repository.create({
   *   name: 'Northwind Supplies',
   *   companyName: 'Northwind',
   *   email: 'orders@northwind.example',
   *   phone: '555-1000',
   *   active: true,
   *   verified: true,
   * });
   */
  async create(supplier: Omit<Supplier, 'supplierId'>): Promise<Supplier> {
    try {
      const normalizedSupplier = this.normalizeSupplierValues(supplier);
      const { sql, values } = buildInsertSQL('suppliers', normalizedSupplier);
      const result = await this.db.run(sql, values);

      const createdSupplier = await this.findById(result.lastID || 0);
      this.assertSupplierLoaded(createdSupplier);

      return createdSupplier;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Updates an existing supplier record identified by supplier ID.
   *
   * @param id - The supplier ID to update.
   * @param supplier - A partial supplier object containing the fields to change.
   * @returns A promise resolving to the updated supplier record.
   *
   * @example
   * const updated = await repository.update(7, {
   *   active: false,
   *   phone: '555-2000',
   * });
   */
  async update(id: number, supplier: Partial<Omit<Supplier, 'supplierId'>>): Promise<Supplier> {
    try {
      const normalizedSupplier = this.normalizeSupplierValues(supplier);
      const { sql, values } = buildUpdateSQL('suppliers', normalizedSupplier, 'supplier_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (!this.hasWriteChanges(result)) {
        throw new NotFoundError('Supplier', id);
      }

      const updatedSupplier = await this.findById(id);
      this.assertSupplierLoaded(updatedSupplier);

      return updatedSupplier;
    } catch (error) {
      handleDatabaseError(error, 'Supplier', id);
    }
  }

  /**
   * Deletes a supplier from the database by ID.
   *
   * @param id - The supplier ID to delete.
   * @returns A promise that resolves when the supplier is removed.
   *
   * @example
   * await repository.delete(12);
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM suppliers WHERE supplier_id = ?', [id]);

      if (!this.hasWriteChanges(result)) {
        throw new NotFoundError('Supplier', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'Supplier', id);
    }
  }

  /**
   * Checks whether a supplier with the provided ID exists.
   *
   * @param id - The supplier ID to validate.
   * @returns True if a matching supplier exists, otherwise false.
   *
   * @example
   * const hasSupplier = await repository.exists(5);
   * if (hasSupplier) {
   *   console.log('Supplier exists.');
   * }
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM suppliers WHERE supplier_id = ?',
        [id],
      );
      return this.hasSupplierCount(result);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Determines whether a count query indicates a matching supplier exists.
   *
   * @param result - The count query result.
   * @returns True when the supplier count is greater than zero.
   */
  private hasSupplierCount(result: { count?: number } | undefined): boolean {
    return (result?.count ?? 0) > 0;
  }

  /**
   * Searches for suppliers whose name contains a given substring.
   *
   * @param name - The partial supplier name to match against. Matching is case-sensitive at the SQL layer and uses a wildcard search.
   * @returns A promise resolving to all matching supplier records, ordered by name.
   *
   * @example
   * const matches = await repository.findByName('acme');
   * console.log(matches.map((supplier) => supplier.name));
   */
  async findByName(name: string): Promise<Supplier[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM suppliers WHERE name LIKE ? ORDER BY name',
        [`%${name}%`],
      );
      return this.mapSupplierRows(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

/**
 * Creates a new supplier repository instance for the specified database context.
 *
 * @param isTest - When true, connects to the test database instead of the default application database.
 * @returns A promise resolving to a configured SuppliersRepository instance.
 *
 * @example
 * const repo = await createSuppliersRepository();
 * const suppliers = await repo.findAll();
 */
export async function createSuppliersRepository(
  isTest: boolean = false,
): Promise<SuppliersRepository> {
  const db = await getDatabase(isTest);
  return new SuppliersRepository(db);
}

// Singleton instance for default usage
let suppliersRepo: SuppliersRepository | null = null;

/**
 * Gets the shared supplier repository singleton, creating one as needed.
 *
 * In test mode, a fresh repository is created each time to avoid cross-test data contamination.
 *
 * @param isTest - Set to true to force use of the test database and reset the cached singleton.
 * @returns A promise resolving to the active supplier repository instance.
 *
 * @example
 * const repo = await getSuppliersRepository();
 * const supplier = await repo.findById(1);
 */
export async function getSuppliersRepository(
  isTest: boolean = false,
): Promise<SuppliersRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    suppliersRepo = null;
    return createSuppliersRepository(true);
  }
  if (!suppliersRepo) {
    suppliersRepo = await createSuppliersRepository(false);
  }
  return suppliersRepo;
}
