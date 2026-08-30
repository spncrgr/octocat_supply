/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryVehicle:
 *       type: object
 *       required:
 *         - deliveryVehicleId
 *         - branchId
 *         - name
 *         - plateNumber
 *         - status
 *       properties:
 *         deliveryVehicleId:
 *           type: integer
 *           description: The unique identifier for the delivery vehicle
 *         branchId:
 *           type: integer
 *           description: The ID of the branch this vehicle belongs to
 *         name:
 *           type: string
 *           description: The display name of the vehicle
 *         plateNumber:
 *           type: string
 *           description: Vehicle plate number
 *         vehicleType:
 *           type: string
 *           description: The category/type of the vehicle
 *         capacityKg:
 *           type: number
 *           format: float
 *           description: Maximum carrying capacity in kilograms
 *         status:
 *           type: string
 *           description: Current status of the vehicle
 */
export interface DeliveryVehicle {
  deliveryVehicleId: number;
  branchId: number;
  name: string;
  plateNumber: string;
  vehicleType: string;
  capacityKg: number;
  status: string;
}