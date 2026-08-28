import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfilesRepository } from './profilesRepo';
import { NotFoundError } from '../utils/errors';
import { DatabaseRow } from '../utils/sql';
import { CreateProfile } from '../models/profile';

describe('ProfilesRepository', () => {
  let repository: ProfilesRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn(),
    };
    repository = new ProfilesRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all profiles mapped to camelCase', async () => {
      const mockRows: DatabaseRow[] = [
        { profile_id: 1, display_name: 'Luna', email: 'luna@example.com' },
        { profile_id: 2, display_name: 'Milo', email: 'milo@example.com' },
      ];
      mockDb.all.mockResolvedValue(mockRows);

      const result = await repository.findAll();

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM profiles ORDER BY profile_id');
      expect(result).toEqual([
        { profileId: 1, displayName: 'Luna', email: 'luna@example.com' },
        { profileId: 2, displayName: 'Milo', email: 'milo@example.com' },
      ]);
    });

    it('should return empty array when no profiles exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return profile when found', async () => {
      const mockRow: DatabaseRow = {
        profile_id: 1,
        display_name: 'Luna',
        email: 'luna@example.com',
      };
      mockDb.get.mockResolvedValue(mockRow);

      const result = await repository.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM profiles WHERE profile_id = ?', [1]);
      expect(result).toEqual({
        profileId: 1,
        displayName: 'Luna',
        email: 'luna@example.com',
      });
    });

    it('should return null when profile not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create profile and return created record', async () => {
      const newProfile: CreateProfile = {
        displayName: 'Nora',
        email: 'nora@example.com',
        bio: 'QA lead',
      };

      mockDb.run.mockResolvedValue({ lastID: 5, changes: 1 });
      mockDb.get.mockResolvedValue({
        profile_id: 5,
        display_name: 'Nora',
        email: 'nora@example.com',
        bio: 'QA lead',
      });

      const result = await repository.create(newProfile);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO profiles (display_name, email, bio) VALUES (?, ?, ?)',
        ['Nora', 'nora@example.com', 'QA lead'],
      );
      expect(result).toEqual({
        profileId: 5,
        displayName: 'Nora',
        email: 'nora@example.com',
        bio: 'QA lead',
      });
    });
  });

  describe('update', () => {
    it('should update profile and return updated record', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.get.mockResolvedValue({
        profile_id: 1,
        display_name: 'Updated Luna',
        email: 'luna@example.com',
      });

      const result = await repository.update(1, { displayName: 'Updated Luna' });

      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(mockDb.run.mock.calls[0][0]).toContain('UPDATE profiles SET');
      expect(mockDb.run.mock.calls[0][0]).toContain('display_name = ?');
      expect(mockDb.run.mock.calls[0][0]).toContain('updated_at = ?');
      expect(mockDb.run.mock.calls[0][1][0]).toBe('Updated Luna');
      expect(mockDb.run.mock.calls[0][1].at(-1)).toBe(1);
      expect(result).toEqual({
        profileId: 1,
        displayName: 'Updated Luna',
        email: 'luna@example.com',
      });
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.update(999, { displayName: 'Unknown' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete profile successfully', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.delete(1);

      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM profiles WHERE profile_id = ?', [1]);
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true when profile exists', async () => {
      mockDb.get.mockResolvedValue({ count: 1 });

      const result = await repository.exists(1);

      expect(result).toBe(true);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM profiles WHERE profile_id = ?',
        [1],
      );
    });

    it('should return false when profile does not exist', async () => {
      mockDb.get.mockResolvedValue({ count: 0 });

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });
});
