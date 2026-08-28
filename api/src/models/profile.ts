/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       required:
 *         - profileId
 *         - displayName
 *         - email
 *       properties:
 *         profileId:
 *           type: integer
 *           description: The unique identifier for the profile
 *         displayName:
 *           type: string
 *           description: The display name for the profile
 *         email:
 *           type: string
 *           format: email
 *           description: The profile email address
 *         bio:
 *           type: string
 *           description: The profile biography
 *         avatarUrl:
 *           type: string
 *           description: The avatar image URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Profile creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Profile last update timestamp
 *     ProfileInput:
 *       type: object
 *       required:
 *         - displayName
 *         - email
 *       properties:
 *         displayName:
 *           type: string
 *           description: The display name for the profile
 *         email:
 *           type: string
 *           format: email
 *           description: The profile email address
 *         bio:
 *           type: string
 *           description: The profile biography
 *         avatarUrl:
 *           type: string
 *           description: The avatar image URL
 */
export interface Profile {
  profileId: number;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProfile = Omit<Profile, 'profileId' | 'createdAt' | 'updatedAt'>;
export type UpdateProfile = Partial<CreateProfile>;
