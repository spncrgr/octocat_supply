import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import profileRouter from './profile';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Profile API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    app = express();
    app.use(express.json());
    app.use('/profiles', profileRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new profile', async () => {
    const newProfile = {
      displayName: 'New User',
      email: 'new.user@example.com',
      bio: 'New team member',
      avatarUrl: 'https://example.com/avatars/new-user.png',
    };

    const response = await request(app).post('/profiles').send(newProfile);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(newProfile);
    expect(response.body.profileId).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  it('should get a profile by ID', async () => {
    const createResponse = await request(app).post('/profiles').send({
      displayName: 'Lookup User',
      email: 'lookup.user@example.com',
      bio: 'Profile lookup test',
      avatarUrl: 'https://example.com/avatars/lookup-user.png',
    });

    const response = await request(app).get(`/profiles/${createResponse.body.profileId}`);

    expect(response.status).toBe(200);
    expect(response.body.profileId).toBe(createResponse.body.profileId);
    expect(response.body.displayName).toBe('Lookup User');
  });

  it('should update a profile by ID', async () => {
    const createResponse = await request(app).post('/profiles').send({
      displayName: 'Original Profile',
      email: 'original.profile@example.com',
      bio: 'Before update',
      avatarUrl: 'https://example.com/avatars/original.png',
    });

    const response = await request(app)
      .put(`/profiles/${createResponse.body.profileId}`)
      .send({ displayName: 'Updated Profile', bio: 'After update' });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Updated Profile');
    expect(response.body.bio).toBe('After update');
  });

  it('should delete a profile by ID', async () => {
    const createResponse = await request(app).post('/profiles').send({
      displayName: 'Delete Profile',
      email: 'delete.profile@example.com',
      bio: 'Will be deleted',
      avatarUrl: 'https://example.com/avatars/delete.png',
    });

    const response = await request(app).delete(`/profiles/${createResponse.body.profileId}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existing profile', async () => {
    const response = await request(app).get('/profiles/999');

    expect(response.status).toBe(404);
  });

  it('should return 404 when updating non-existing profile', async () => {
    const response = await request(app).put('/profiles/999').send({ displayName: 'Missing' });

    expect(response.status).toBe(404);
  });

  it('should return 404 when deleting non-existing profile', async () => {
    const response = await request(app).delete('/profiles/999');

    expect(response.status).toBe(404);
  });

  it('should return 400 when creating profile with missing required fields', async () => {
    const response = await request(app).post('/profiles').send({ bio: 'Missing required values' });

    expect(response.status).toBe(400);
  });

  it('should return 400 when creating profile with invalid email', async () => {
    const response = await request(app).post('/profiles').send({
      displayName: 'Invalid Email',
      email: 'invalid-email',
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 when updating profile with unsupported fields only', async () => {
    const createResponse = await request(app).post('/profiles').send({
      displayName: 'Validation User',
      email: 'validation.user@example.com',
    });

    const response = await request(app)
      .put(`/profiles/${createResponse.body.profileId}`)
      .send({ profileId: 999 });

    expect(response.status).toBe(400);
  });

  it('should return 400 when updating profile with invalid email', async () => {
    const createResponse = await request(app).post('/profiles').send({
      displayName: 'Email Update User',
      email: 'email.update.user@example.com',
    });

    const response = await request(app)
      .put(`/profiles/${createResponse.body.profileId}`)
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});
