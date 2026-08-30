/**
 * @swagger
 * tags:
 *   name: Delivery Vehicles
 *   description: API endpoints for managing delivery vehicles
 */

/**
 * @swagger
 * /api/delivery-vehicles:
 *   get:
 *     summary: Returns all delivery vehicles
 *     tags: [Delivery Vehicles]
 *     responses:
 *       200:
 *         description: List of all delivery vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryVehicle'
 *   post:
 *     summary: Create a new delivery vehicle
 *     tags: [Delivery Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryVehicle'
 *     responses:
 *       201:
 *         description: Delivery vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryVehicle'
 *
 * /api/delivery-vehicles/{id}:
 *   get:
 *     summary: Get a delivery vehicle by ID
 *     tags: [Delivery Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery vehicle ID
 *     responses:
 *       200:
 *         description: Delivery vehicle found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryVehicle'
 *       404:
 *         description: Delivery vehicle not found
 *   put:
 *     summary: Update a delivery vehicle
 *     tags: [Delivery Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryVehicle'
 *     responses:
 *       200:
 *         description: Delivery vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryVehicle'
 *       404:
 *         description: Delivery vehicle not found
 *   delete:
 *     summary: Delete a delivery vehicle
 *     tags: [Delivery Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery vehicle ID
 *     responses:
 *       204:
 *         description: Delivery vehicle deleted successfully
 *       404:
 *         description: Delivery vehicle not found
 *
 * /api/delivery-vehicles/branch/{branchId}:
 *   get:
 *     summary: Get delivery vehicles by branch ID
 *     tags: [Delivery Vehicles]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: List of delivery vehicles in the branch
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryVehicle'
 */

import express from 'express';
import { DeliveryVehicle } from '../models/deliveryVehicle';
import { getDeliveryVehiclesRepository } from '../repositories/deliveryVehiclesRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    const newVehicle = await repo.create(req.body as Omit<DeliveryVehicle, 'deliveryVehicleId'>);
    res.status(201).json(newVehicle);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    const vehicles = await repo.findAll();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

router.get('/branch/:branchId', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    const vehicles = await repo.findByBranchId(parseInt(req.params.branchId));
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    const vehicle = await repo.findById(parseInt(req.params.id));
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).send('DeliveryVehicle not found');
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    const updatedVehicle = await repo.update(parseInt(req.params.id), req.body);
    res.json(updatedVehicle);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('DeliveryVehicle not found');
    } else {
      next(error);
    }
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getDeliveryVehiclesRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('DeliveryVehicle not found');
    } else {
      next(error);
    }
  }
});

export default router;