import OpenAI from 'openai';
import pool from '../../config/database';
import { CoverLetterJobMessage } from '../../types/queue.types';
import { ConsumeMessage } from 'amqplib';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate cover letter using OpenAI
 */
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

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message?.content ?? '';
}

/**
 * Update job status in database
 */
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

/**
 * Process cover letter generation job
 */
export const processCoverLetterJob = async (
  message: CoverLetterJobMessage,
  rawMessage: ConsumeMessage
): Promise<void> => {
  const { jobId, userId, jobDescription, cvText, tone } = message;

  console.log(`Processing cover letter job: ${jobId} for user: ${userId}`);

  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing');

    // Generate cover letter
    const coverLetter = await generateCoverLetter(
      jobDescription,
      cvText,
      tone || 'professional'
    );

    // Update status to completed
    await updateJobStatus(jobId, 'completed', coverLetter);

    console.log(`Cover letter job completed: ${jobId}`);
  } catch (error) {
    console.error(`Error processing cover letter job ${jobId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'failed', undefined, errorMessage);

    // Re-throw to trigger nack/requeue if needed
    throw error;
  }
};
