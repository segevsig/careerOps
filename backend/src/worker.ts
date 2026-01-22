import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initDatabase } from './config/database';
import { consumeMessages } from './services/queue/consumer';
import { processCoverLetterJob } from './services/workers/coverLetterWorker';
import { QueueNames } from './types/queue.types';
import { CoverLetterJobMessage } from './types/queue.types';

const startWorker = async () => {
  try {
    console.log('Starting CareerOps worker...');

    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Start consuming cover letter generation jobs
    await consumeMessages<CoverLetterJobMessage>(
      QueueNames.COVER_LETTER_GENERATE,
      processCoverLetterJob,
      {
        prefetch: 1, // Process one job at a time
      }
    );

    console.log('Worker started successfully');
    console.log(`Consuming messages from queue: ${QueueNames.COVER_LETTER_GENERATE}`);
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startWorker();
