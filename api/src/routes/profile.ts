/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: API endpoints for managing user profiles
 */

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileInput'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid profile payload
 *
 * /api/profiles/{id}:
 *   get:
 *     summary: Get a profile by ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 *   put:
 *     summary: Update a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid profile payload
 *       404:
 *         description: Profile not found
 *   delete:
 *     summary: Delete a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       204:
 *         description: Profile deleted successfully
 *       404:
 *         description: Profile not found
 */

import express from 'express';
import { CreateProfile, UpdateProfile } from '../models/profile';
import { getProfilesRepository } from '../repositories/profilesRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseProfileId(idParam: string): number {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Profile ID must be a positive integer');
  }
  return id;
}

function validateCreateProfile(body: unknown): CreateProfile {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const candidate = body as Partial<CreateProfile>;
  if (!candidate.displayName || typeof candidate.displayName !== 'string') {
    throw new ValidationError('displayName is required and must be a string');
  }
  if (!candidate.email || typeof candidate.email !== 'string') {
    throw new ValidationError('email is required and must be a string');
  }
  if (!isValidEmail(candidate.email)) {
    throw new ValidationError('email must be a valid email address');
  }

  return candidate as CreateProfile;
}

function validateUpdateProfile(body: unknown): UpdateProfile {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const candidate = body as Record<string, unknown>;
  const updateProfile: UpdateProfile = {};

  if (candidate.displayName !== undefined) {
    if (typeof candidate.displayName !== 'string' || candidate.displayName.length === 0) {
      throw new ValidationError('displayName must be a non-empty string');
    }
    updateProfile.displayName = candidate.displayName;
  }

  if (candidate.email !== undefined) {
    if (typeof candidate.email !== 'string' || candidate.email.length === 0) {
      throw new ValidationError('email must be a non-empty string');
    }
    if (!isValidEmail(candidate.email)) {
      throw new ValidationError('email must be a valid email address');
    }
    updateProfile.email = candidate.email;
  }

  if (candidate.bio !== undefined) {
    if (typeof candidate.bio !== 'string') {
      throw new ValidationError('bio must be a string');
    }
    updateProfile.bio = candidate.bio;
  }

  if (candidate.avatarUrl !== undefined) {
    if (typeof candidate.avatarUrl !== 'string') {
      throw new ValidationError('avatarUrl must be a string');
    }
    updateProfile.avatarUrl = candidate.avatarUrl;
  }

  if (Object.keys(updateProfile).length === 0) {
    throw new ValidationError('At least one updatable field is required');
  }

  return updateProfile;
}

router.post('/', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const newProfile = await repo.create(validateCreateProfile(req.body));
    res.status(201).json(newProfile);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const id = parseProfileId(req.params.id);
    const profile = await repo.findById(id);
    if (profile) {
      res.json(profile);
    } else {
      throw new NotFoundError('Profile', id);
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const updatedProfile = await repo.update(parseProfileId(req.params.id), validateUpdateProfile(req.body));
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    await repo.delete(parseProfileId(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
