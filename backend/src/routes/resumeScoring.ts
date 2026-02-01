import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateResumeScoring } from '../services/ai/resumeScoring';

const router = Router();

/**
 * @swagger
 * /api/resume-scoring:
 *   post:
 *     summary: Analyze resume against a job description and return a match score
 *     tags: [Resume Scoring]
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
 *               cvText:
 *                 type: string
 *                 description: The applicant's CV/resume text
 *     responses:
 *       200:
 *         description: Resume scoring result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                 strengths:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                 gaps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request - jobDescription and cvText are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to score resume
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { jobDescription, cvText } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!jobDescription || !cvText) {
      return res.status(400).json({
        error: 'jobDescription and cvText are required',
      });
    }

    const result = await generateResumeScoring(cvText, jobDescription);

    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error during resume scoring';
    console.error('Resume scoring error:', error);
    res.status(500).json({ error: 'Failed to score resume', details: message });
  }
});

export default router;

