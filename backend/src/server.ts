import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import app from './app';
import { initDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`CareerOps backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
