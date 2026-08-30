import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuppliersRepository } from './suppliersRepo';
import { ConflictError, DatabaseError, NotFoundError } from '../utils/errors';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
    getDatabase: vi.fn()
}));

// Import the mocked module
import { getDatabase } from '../db/sqlite';

describe('SuppliersRepository', () => {
    let repository: SuppliersRepository;
    let mockDb: any;
    
    beforeEach(() => {
        // Create mock database connection
        mockDb = {
            db: {} as any,
            run: vi.fn(),
            get: vi.fn(),
            all: vi.fn(),
            close: vi.fn()
        };

        // Mock getDatabase to return our mock
        (getDatabase as any).mockResolvedValue(mockDb);
        
        repository = new SuppliersRepository(mockDb);
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all suppliers', async () => {
            const mockResults = [
                { supplier_id: 1, name: 'Test Supplier', description: 'Test', contact_person: 'John', email: 'john@test.com', phone: '555-1234', active: true, verified: true }
            ];
            mockDb.all.mockResolvedValue(mockResults);

            const result = await repository.findAll();

            expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM suppliers ORDER BY supplier_id');
            expect(result).toHaveLength(1);
            expect(result[0].supplierId).toBe(1);
            expect(result[0].name).toBe('Test Supplier');
        });

        it('should return empty array when no suppliers exist', async () => {
            mockDb.all.mockResolvedValue([]);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('should return supplier when found', async () => {
            const mockResult = {
                supplier_id: 1,
                name: 'Test Supplier',
                description: 'Test',
                contact_person: 'John',
                email: 'john@test.com',
                phone: '555-1234',
                active: true,
                verified: true
            };
            mockDb.get.mockResolvedValue(mockResult);

            const result = await repository.findById(1);

            expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM suppliers WHERE supplier_id = ?', [1]);
            expect(result?.supplierId).toBe(1);
            expect(result?.name).toBe('Test Supplier');
        });

        it('should return null when supplier not found', async () => {
            mockDb.get.mockResolvedValue(undefined);

            const result = await repository.findById(999);

            expect(result).toBeNull();
        });

        it('should throw DatabaseError when the database connection fails during lookup', async () => {
            mockDb.get.mockRejectedValue(new Error('connection lost'));

            await expect(repository.findById(1)).rejects.toThrow(DatabaseError);
            await expect(repository.findById(1)).rejects.toThrow('Database operation failed: connection lost');
        });
    });

    describe('create', () => {
        it('should create a new supplier and return it', async () => {
            const newSupplier = {
                name: 'New Supplier',
                description: 'New Description',
                contactPerson: 'Jane Doe',
                email: 'jane@test.com',
                phone: '555-5678',
                active: true,
                verified: false
            };

            mockDb.run.mockResolvedValue({ lastID: 2, changes: 1 });
            mockDb.get.mockResolvedValue({
                supplier_id: 2,
                name: 'New Supplier',
                description: 'New Description',
                contact_person: 'Jane Doe',
                email: 'jane@test.com',
                phone: '555-5678',
                active: 1,
                verified: 0
            });

            const result = await repository.create(newSupplier);

            expect(mockDb.run).toHaveBeenCalledWith(
                'INSERT INTO suppliers (name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['New Supplier', 'New Description', 'Jane Doe', 'jane@test.com', '555-5678', 1, 0]
            );
            expect(result.supplierId).toBe(2);
            expect(result.name).toBe('New Supplier');
        });

        it('should throw ConflictError when a database unique constraint is violated', async () => {
            const newSupplier = {
                name: 'Duplicate Supplier',
                description: 'Duplicate',
                contactPerson: 'Jane Doe',
                email: 'duplicate@test.com',
                phone: '555-0000',
                active: true,
                verified: false
            };

            const constraintError = new DatabaseError('UNIQUE constraint failed: suppliers.email', 'SQLITE_CONSTRAINT', 500);
            constraintError.message = 'UNIQUE constraint failed: suppliers.email';
            mockDb.run.mockRejectedValue(constraintError);

            await expect(repository.create(newSupplier)).rejects.toThrow(ConflictError);
            await expect(repository.create(newSupplier)).rejects.toThrow('Conflict: Resource already exists');
        });
    });

    describe('update', () => {
        it('should update existing supplier and return updated data', async () => {
            const updateData = { name: 'Updated Supplier' };

            mockDb.run.mockResolvedValue({ changes: 1 });
            mockDb.get.mockResolvedValue({
                supplier_id: 1,
                name: 'Updated Supplier',
                description: 'Test',
                contact_person: 'John',
                email: 'john@test.com',
                phone: '555-1234',
                active: true,
                verified: true
            });

            const result = await repository.update(1, updateData);

            expect(mockDb.run).toHaveBeenCalledWith(
                'UPDATE suppliers SET name = ? WHERE supplier_id = ?',
                ['Updated Supplier', 1]
            );
            expect(result.name).toBe('Updated Supplier');
        });

        it('should throw NotFoundError when supplier does not exist', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.update(999, { name: 'Updated' }))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError when an invalid ID is used for update', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.update(0, { name: 'Updated' }))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw DatabaseError when the database connection fails during update', async () => {
            mockDb.run.mockRejectedValue(new Error('database unavailable'));

            await expect(repository.update(1, { name: 'Updated' })).rejects.toThrow(DatabaseError);
            await expect(repository.update(1, { name: 'Updated' })).rejects.toThrow('Database operation failed: database unavailable');
        });
    });

    describe('delete', () => {
        it('should delete existing supplier', async () => {
            mockDb.run.mockResolvedValue({ changes: 1 });

            await repository.delete(1);

            expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM suppliers WHERE supplier_id = ?', [1]);
        });

        it('should throw NotFoundError when supplier does not exist', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.delete(999))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError when an invalid ID is used for delete', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.delete(-1)).rejects.toThrow(NotFoundError);
        });

        it('should throw DatabaseError when the database connection fails during delete', async () => {
            mockDb.run.mockRejectedValue(new Error('delete failed'));

            await expect(repository.delete(1)).rejects.toThrow(DatabaseError);
            await expect(repository.delete(1)).rejects.toThrow('Database operation failed: delete failed');
        });
    });

    describe('exists', () => {
        it('should return true when supplier exists', async () => {
            mockDb.get.mockResolvedValue({ count: 1 });

            const result = await repository.exists(1);

            expect(result).toBe(true);
            expect(mockDb.get).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM suppliers WHERE supplier_id = ?', [1]);
        });

        it('should return false when supplier does not exist', async () => {
            mockDb.get.mockResolvedValue({ count: 0 });

            const result = await repository.exists(999);

            expect(result).toBe(false);
        });
    });

    describe('findByName', () => {
        it('should return suppliers matching name pattern', async () => {
            const mockResults = [
                { supplier_id: 1, name: 'Test Supplier', description: 'Test', contact_person: 'John', email: 'john@test.com', phone: '555-1234', active: true, verified: true }
            ];
            mockDb.all.mockResolvedValue(mockResults);

            const result = await repository.findByName('Test');

            expect(mockDb.all).toHaveBeenCalledWith(
                'SELECT * FROM suppliers WHERE name LIKE ? ORDER BY name',
                ['%Test%']
            );
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Test Supplier');
        });
    });
});
