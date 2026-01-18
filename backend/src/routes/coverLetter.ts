import { Router, Response } from 'express';
import OpenAI from "openai";
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface CoverLetterRequest {
  jobDescription: string;
  cvText: string;
  tone?: "professional" | "friendly" | "concise";
}

/**
 * @swagger
 * /api/cover-letter:
 *   post:
 *     summary: Generate a cover letter using AI
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
 *       200:
 *         description: Cover letter generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coverLetter:
 *                   type: string
 *                   example: Dear Hiring Manager, I am writing to express my interest...
 *       400:
 *         description: Bad request - jobDescription and cvText are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate cover letter
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

    const coverLetter = await generateCoverLetter({
      jobDescription,
      cvText,
      tone
    });

    res.json({ coverLetter });
  } catch (error) {
    console.error('Generate cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

export default router;

// ================= AI logic =================

async function generateCoverLetter(req: CoverLetterRequest): Promise<string> {
  const tone = req.tone || "professional";

  const prompt = `
    You are a professional career coach.
    Generate a cover letter in a ${tone} tone.
    the cover letter need to be Short and precise for the job 
    4-5 lines
    A little information about the submitter 

    CV:
    ${req.cvText}

    Job Description:
    ${req.jobDescription}

    Cover Letter:
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  return response.choices[0].message?.content ?? '';
}
