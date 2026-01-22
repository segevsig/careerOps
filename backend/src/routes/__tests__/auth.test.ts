import request from 'supertest';
import express from 'express';
import pool from '../../config/database';

// Mock dependencies BEFORE importing routes
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../config/database');
jest.mock('../../middleware/auth', () => ({
  generateToken: jest.fn(() => 'mock-token'),
}));
jest.mock('../../services/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  isSmtpConfigured: jest.fn().mockReturnValue(false),
  getResetLink: jest.fn((token: string) => `http://localhost:5173/reset-password?token=${token}`),
}));

// Import after mocks
import authRoutes from '../auth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
      };

      (pool.query as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert user

      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed-password');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if user already exists', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [{ id: 1, email: 'test@example.com' }],
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
      };

      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [mockUser],
      });

      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 401 for wrong password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
      };

      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [mockUser],
      });

      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email is required');
    });

    it('should return 200 and generic message when email not found', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If that email is registered');
    });

    it('should create token, send email, and return 200 when user exists', async () => {
      const mockUser = { id: 1, email: 'user@example.com' };
      (pool.query as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If that email is registered');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO password_reset_tokens'),
        expect.any(Array)
      );
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if token or password missing', async () => {
      const res1 = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpass123' });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'abc123' });
      expect(res2.status).toBe(400);
    });

    it('should return 400 for invalid or expired token', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'newpass123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should reset password and return 200 for valid token', async () => {
      const rawToken = 'valid-reset-token-xyz';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      (pool.query as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('new-hash');

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'newpass123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password reset successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    });
  });
});
