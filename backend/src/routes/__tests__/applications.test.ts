import request from 'supertest';
import express from 'express';
import pool from '../../config/database';
import applicationsRoutes from '../applications';
import { authenticateToken } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    (req as any).userId = 1;
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/applications', applicationsRoutes);

describe('Applications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/applications', () => {
    it('should get all applications for authenticated user', async () => {
      const mockApplications = [
        {
          id: 1,
          company_name: 'Tech Corp',
          position_title: 'Developer',
          status: 'applied',
          applied_date: '2024-01-15',
          notes: 'Test note',
          applied_from: 'Linkedin',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: mockApplications,
      });

      const response = await request(app).get('/api/applications');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('applications');
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].company_name).toBe('Tech Corp');
    });

    it('should return empty array when no applications exist', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app).get('/api/applications');

      expect(response.status).toBe(200);
      expect(response.body.applications).toEqual([]);
    });
  });

  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const mockApplication = {
        id: 1,
        company_name: 'Tech Corp',
        position_title: 'Developer',
        status: 'applied',
        applied_date: '2024-01-15',
        notes: null,
        applied_from: 'Linkedin',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [mockApplication],
      });

      const response = await request(app)
        .post('/api/applications')
        .send({
          companyName: 'Tech Corp',
          positionTitle: 'Developer',
          status: 'applied',
          appliedDate: '2024-01-15',
          appliedfrom: 'Linkedin',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('application');
      expect(response.body.application.company_name).toBe('Tech Corp');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/applications')
        .send({
          companyName: 'Tech Corp',
          // Missing positionTitle and appliedDate
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if status is invalid', async () => {
      const response = await request(app)
        .post('/api/applications')
        .send({
          companyName: 'Tech Corp',
          positionTitle: 'Developer',
          appliedDate: '2024-01-15',
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('should delete an application', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      const response = await request(app).delete('/api/applications/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Application deleted successfully');
    });

    it('should return 404 if application not found', async () => {
      (pool.query as jest.Mock) = jest.fn().mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app).delete('/api/applications/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Application not found');
    });
  });
});
