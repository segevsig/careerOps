import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import applicationsRoutes from './routes/applications';
import generateCoverLetter from './routes/coverLetter';
import resumeScoringRoutes from './routes/resumeScoring';
import { logger } from './utils/logger';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });
  next();
});

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
}));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: careerops-backend
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'careerops-backend' });
});

/**
 * @swagger
 * /health/rabbitmq:
 *   get:
 *     summary: Check RabbitMQ connection status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: RabbitMQ is connected
 *       503:
 *         description: RabbitMQ is not available
 */
app.get('/health/rabbitmq', async (_req, res) => {
  try {
    const { getConnection } = await import('./config/rabbitmq');
    await getConnection();
    res.json({ status: 'ok', rabbitmq: 'connected' });
  } catch (error) {
    logger.warn('RabbitMQ health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(503).json({
      status: 'error',
      rabbitmq: 'not available',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/cover-letter', generateCoverLetter);
app.use('/api/resume-scoring', resumeScoringRoutes);

export default app;
