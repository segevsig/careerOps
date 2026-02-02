import request from 'supertest';
import express from 'express';

jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req: any, _res: any, next: any) => {
    req.userId = 1;
    next();
  }),
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

jest.mock('../../services/queue/publisher', () => ({
  publishCoverLetterJob: jest.fn().mockResolvedValue(true),
}));

import coverLetterRoutes from '../coverLetter';

const app = express();
app.use(express.json());
app.use('/api/cover-letter', coverLetterRoutes);

describe('Cover Letter Routes', () => {
  describe('POST /api/cover-letter', () => {
    it('should create cover letter job and return 202 with jobId', async () => {
      const response = await request(app)
        .post('/api/cover-letter')
        .send({
          jobDescription: 'Job description here',
          cvText: 'CV text here',
          tone: 'professional',
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if jobDescription is missing', async () => {
      const response = await request(app)
        .post('/api/cover-letter')
        .send({
          cvText: 'CV text here',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if cvText is missing', async () => {
      const response = await request(app)
        .post('/api/cover-letter')
        .send({
          jobDescription: 'Job description here',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
