import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import app from './app';
import { initDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info('CareerOps backend started', { port: PORT });
    });
  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error : undefined);
    process.exit(1);
  }
};

startServer();
