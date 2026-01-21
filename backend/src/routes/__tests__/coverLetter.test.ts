import request from 'supertest';
import express from 'express';
import { authenticateToken } from '../../middleware/auth';

// Mock OpenAI before importing the route
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    (req as any).userId = 1;
    next();
  }),
}));

// Import after mocks
import coverLetterRoutes from '../coverLetter';

const app = express();
app.use(express.json());
app.use('/api/cover-letter', coverLetterRoutes);

describe('Cover Letter Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockClear();
  });

  describe('POST /api/cover-letter', () => {
    it('should generate a cover letter successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated cover letter text',
            },
          },
        ],
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/cover-letter')
        .send({
          jobDescription: 'Job description here',
          cvText: 'CV text here',
          tone: 'professional',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('coverLetter');
      expect(response.body.coverLetter).toBe('Generated cover letter text');
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

    it('should use default tone if not provided', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated cover letter',
            },
          },
        ],
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      await request(app)
        .post('/api/cover-letter')
        .send({
          jobDescription: 'Job description',
          cvText: 'CV text',
        });

      expect(mockCreate).toHaveBeenCalled();
    });
  });
});
