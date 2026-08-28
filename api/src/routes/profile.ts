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
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
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
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
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
import { CreateProfile } from '../models/profile';
import { getProfilesRepository } from '../repositories/profilesRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const newProfile = await repo.create(req.body as CreateProfile);
    res.status(201).json(newProfile);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const profile = await repo.findById(parseInt(req.params.id, 10));
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).send('Profile not found');
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    const updatedProfile = await repo.update(parseInt(req.params.id, 10), req.body);
    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Profile not found');
    } else {
      next(error);
    }
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getProfilesRepository();
    await repo.delete(parseInt(req.params.id, 10));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Profile not found');
    } else {
      next(error);
    }
  }
});

export default router;
