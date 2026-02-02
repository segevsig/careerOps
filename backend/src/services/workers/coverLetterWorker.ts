import pool from '../../config/database';
import { CoverLetterJobMessage } from '../../types/queue.types';
import { ConsumeMessage } from 'amqplib';
import { logger } from '../../utils/logger';
import { askAi } from '../ai/client';

async function generateCoverLetter(
  jobDescription: string,
  cvText: string,
  tone: 'professional' | 'friendly' | 'concise' = 'professional'
): Promise<string> {
  const prompt = `
    You are a professional career coach.
    Generate a cover letter in a ${tone} tone.
    the cover letter need to be Short and precise for the job 
    4-5 lines
    A little information about the submitter 

    CV:
    ${cvText}

    Job Description:
    ${jobDescription}

    Cover Letter:
  `;

  const answer = await askAi(prompt);
  return answer ?? '';
}

async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  coverLetter?: string,
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();

  if (status === 'completed' && coverLetter) {
    await pool.query(
      `UPDATE cover_letter_jobs 
       SET status = $1, cover_letter = $2, updated_at = $3, completed_at = $3
       WHERE job_id = $4`,
      [status, coverLetter, now, jobId]
    );
  } else if (status === 'failed' && errorMessage) {
    await pool.query(
      `UPDATE cover_letter_jobs 
       SET status = $1, error_message = $2, updated_at = $3
       WHERE job_id = $4`,
      [status, errorMessage, now, jobId]
    );
  } else {
    await pool.query(
      `UPDATE cover_letter_jobs 
       SET status = $1, updated_at = $2
       WHERE job_id = $3`,
      [status, now, jobId]
    );
  }
}

export const processCoverLetterJob = async (
  message: CoverLetterJobMessage,
  _rawMessage?: ConsumeMessage
): Promise<void> => {
  const { jobId, userId, jobDescription, cvText, tone } = message;

  logger.info('Processing cover letter job', { jobId, userId });

  try {
    await updateJobStatus(jobId, 'processing');

    const coverLetter = await generateCoverLetter(
      jobDescription,
      cvText,
      tone || 'professional'
    );

    await updateJobStatus(jobId, 'completed', coverLetter);

    logger.info('Cover letter job completed', { jobId });
  } catch (error) {
    logger.error('Cover letter job failed', error instanceof Error ? error : undefined);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'failed', undefined, errorMessage);

    throw error;
  }
};
