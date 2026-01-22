import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { publishCoverLetterJob } from '../services/queue/publisher';

const router = Router();

/**
 * @swagger
 * /api/cover-letter:
 *   post:
 *     summary: Generate a cover letter using AI (async)
 *     tags: [Cover Letter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *               - cvText
 *             properties:
 *               jobDescription:
 *                 type: string
 *                 description: The job description for the position
 *                 example: We are looking for a Senior Developer with 5+ years of experience...
 *               cvText:
 *                 type: string
 *                 description: The applicant's CV/resume text
 *                 example: John Doe, Senior Developer with 7 years of experience...
 *               tone:
 *                 type: string
 *                 enum: [professional, friendly, concise]
 *                 default: professional
 *                 example: professional
 *     responses:
 *       202:
 *         description: Cover letter generation job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *                 status:
 *                   type: string
 *                   example: pending
 *                 message:
 *                   type: string
 *                   example: Cover letter generation started
 *       400:
 *         description: Bad request - jobDescription and cvText are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create cover letter job
 */
// POST /api/cover-letter
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { jobDescription, cvText, tone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!jobDescription || !cvText) {
      return res.status(400).json({
        error: 'jobDescription and cvText are required'
      });
    }

    // Generate unique job ID
    const jobId = uuidv4();
    const createdAt = new Date().toISOString();

    // Store job in database
    await pool.query(
      `INSERT INTO cover_letter_jobs (user_id, job_id, status, job_description, cv_text, tone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, jobId, 'pending', jobDescription, cvText, tone || 'professional', createdAt]
    );

    // Publish job to queue (non-blocking - job is already in DB)
    publishCoverLetterJob({
      jobId,
      userId,
      jobDescription,
      cvText,
      tone: tone || 'professional',
      createdAt,
    }).catch((error) => {
      console.error('Failed to publish job to queue (job saved in DB):', error);
      // Job is already in DB, worker can pick it up later or we can retry
    });

    // Return immediately with job ID
    res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Cover letter generation started',
    });
  } catch (error) {
    console.error('Create cover letter job error:', error);
    res.status(500).json({ error: 'Failed to create cover letter job' });
  }
});

/**
 * @swagger
 * /api/cover-letter/status/{jobId}:
 *   get:
 *     summary: Get cover letter generation job status
 *     tags: [Cover Letter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed]
 *                 coverLetter:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 completedAt:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
// GET /api/cover-letter/status/:jobId
router.get('/status/:jobId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { jobId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get job from database
    const result = await pool.query(
      `SELECT job_id, status, cover_letter, error_message, created_at, updated_at, completed_at
       FROM cover_letter_jobs
       WHERE job_id = $1 AND user_id = $2`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    res.json({
      jobId: job.job_id,
      status: job.status,
      coverLetter: job.cover_letter || undefined,
      errorMessage: job.error_message || undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at || undefined,
    });
  } catch (error) {
    console.error('Get cover letter status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/cover-letter/jobs:
 *   get:
 *     summary: Get all cover letter jobs for the authenticated user
 *     tags: [Cover Letter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       jobId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       completedAt:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
// GET /api/cover-letter/jobs
router.get('/jobs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all jobs for user
    const result = await pool.query(
      `SELECT job_id, status, created_at, updated_at, completed_at
       FROM cover_letter_jobs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      jobs: result.rows.map((row) => ({
        jobId: row.job_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at || undefined,
      })),
    });
  } catch (error) {
    console.error('Get cover letter jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
