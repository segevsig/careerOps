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

// Import after mocks
import authRoutes from '../auth';
import bcrypt from 'bcrypt';

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
});
