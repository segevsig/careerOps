import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initDatabase } from './config/database';
import pool from './config/database';
import { consumeMessages } from './services/queue/consumer';
import { processCoverLetterJob } from './services/workers/coverLetterWorker';
import { QueueNames } from './types/queue.types';
import { CoverLetterJobMessage } from './types/queue.types';

/**
 * Process pending jobs from database (fallback for jobs that weren't picked up by queue)
 */
const processPendingJobs = async () => {
  try {
    // Find pending jobs older than 10 seconds (to avoid race conditions)
    const result = await pool.query(
      `SELECT job_id, user_id, job_description, cv_text, tone, created_at
       FROM cover_letter_jobs
       WHERE status = 'pending'
       AND created_at < NOW() - INTERVAL '10 seconds'
       ORDER BY created_at ASC
       LIMIT 10`
    );

    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} pending job(s) to process from database`);
      
      for (const row of result.rows) {
        try {
          const message: CoverLetterJobMessage = {
            jobId: row.job_id,
            userId: row.user_id,
            jobDescription: row.job_description,
            cvText: row.cv_text,
            tone: row.tone || 'professional',
            createdAt: row.created_at.toISOString(),
          };

          // Process the job (no rawMessage needed when processing from DB)
          await processCoverLetterJob(message);
          console.log(`Processed pending job from database: ${row.job_id}`);
        } catch (error) {
          console.error(`Error processing pending job ${row.job_id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error processing pending jobs:', error);
  }
};

const startWorker = async () => {
  try {
    console.log('Starting CareerOps worker...');

    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Process any pending jobs from database on startup
    await processPendingJobs();

    // Start consuming cover letter generation jobs from queue
    await consumeMessages<CoverLetterJobMessage>(
      QueueNames.COVER_LETTER_GENERATE,
      processCoverLetterJob,
      {
        prefetch: 1, // Process one job at a time
      }
    );

    console.log('Worker started successfully');
    console.log(`Consuming messages from queue: ${QueueNames.COVER_LETTER_GENERATE}`);

    // Periodically check for pending jobs (every 30 seconds) as a fallback
    setInterval(processPendingJobs, 30000);
    console.log('Started periodic check for pending jobs (every 30 seconds)');
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
