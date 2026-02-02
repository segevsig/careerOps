import dotenv from 'dotenv';

dotenv.config();

import { initDatabase } from './config/database';
import pool from './config/database';
import { consumeMessages } from './services/queue/consumer';
import { processCoverLetterJob } from './services/workers/coverLetterWorker';
import { QueueNames } from './types/queue.types';
import { CoverLetterJobMessage } from './types/queue.types';
import { logger } from './utils/logger';

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
      logger.info('Processing pending jobs from database', { count: result.rows.length });

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

          await processCoverLetterJob(message);
          logger.info('Processed pending job from database', { jobId: row.job_id });
        } catch (error) {
          logger.error('Pending job processing failed', { jobId: row.job_id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }
  } catch (error) {
    logger.error('Process pending jobs failed', error instanceof Error ? error : undefined);
  }
};

const startWorker = async () => {
  try {
    logger.info('Starting CareerOps worker');

    await initDatabase();
    logger.info('Database initialized');

    await processPendingJobs();

    await consumeMessages<CoverLetterJobMessage>(
      QueueNames.COVER_LETTER_GENERATE,
      processCoverLetterJob,
      { prefetch: 1 }
    );

    logger.info('Worker started', { queue: QueueNames.COVER_LETTER_GENERATE });

    setInterval(processPendingJobs, 30000);
    logger.info('Periodic pending jobs check started', { intervalSeconds: 30 });
  } catch (error) {
    logger.error('Failed to start worker', error instanceof Error ? error : undefined);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down');
  process.exit(0);
});

startWorker();
