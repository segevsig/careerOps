import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all job applications for the authenticated user
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       company_name:
 *                         type: string
 *                       position_title:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [applied, interview, offer, rejected]
 *                       applied_date:
 *                         type: string
 *                         format: date
 *                       notes:
 *                         type: string
 *                       applied_from:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
// Get all applications for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, company_name, position_title, status, applied_date, notes, created_at, updated_at,applied_from
       FROM job_applications
       WHERE user_id = $1
       ORDER BY applied_date DESC, created_at DESC`,
      [userId]
    );

    res.json({ applications: result.rows });
  } catch (error) {
    logger.error('Get applications failed', error instanceof Error ? error : undefined);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get a single job application by ID
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     company_name:
 *                       type: string
 *                     position_title:
 *                       type: string
 *                     status:
 *                       type: string
 *                     applied_date:
 *                       type: string
 *                       format: date
 *                     notes:
 *                       type: string
 *                     applied_from:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 */
// Get a single application by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const applicationId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, company_name, position_title, status, applied_date, notes, created_at, updated_at ,applied_from
       FROM job_applications
       WHERE id = $1 AND user_id = $2`,
      [applicationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Get application failed', error instanceof Error ? error : undefined);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create a new job application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - positionTitle
 *               - appliedDate
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Tech Corp
 *               positionTitle:
 *                 type: string
 *                 example: Senior Developer
 *               status:
 *                 type: string
 *                 enum: [applied, interview, offer, rejected]
 *                 default: applied
 *                 example: applied
 *               appliedDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               notes:
 *                 type: string
 *                 example: Great opportunity
 *               appliedfrom:
 *                 type: string
 *                 example: LinkedIn
 *     responses:
 *       201:
 *         description: Application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields or invalid status
 *       401:
 *         description: Unauthorized
 */
// Create a new application
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { companyName, positionTitle, status, appliedDate, notes, appliedfrom } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!companyName || !positionTitle || !appliedDate) {
      return res.status(400).json({ error: 'Company name, position title, and applied date are required' });
    }

    // Validate status
    const validStatuses = ['applied', 'interview', 'offer', 'rejected'];
    const applicationStatus = status || 'applied';
    if (!validStatuses.includes(applicationStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: applied, interview, offer, rejected' });
    }

    const result = await pool.query(
      `INSERT INTO job_applications (user_id, company_name, position_title, status, applied_date, notes ,applied_from)
       VALUES ($1, $2, $3, $4, $5, $6 ,$7)
       RETURNING id, company_name, position_title, status, applied_date, notes, created_at, updated_at ,applied_from `,
      [userId, companyName, positionTitle, applicationStatus, appliedDate, notes || null , appliedfrom || 'unknown' ]
    );

    logger.info('Application created', { userId, applicationId: result.rows[0].id });
    res.status(201).json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Create application failed', error instanceof Error ? error : undefined);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update a job application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               positionTitle:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [applied, interview, offer, rejected]
 *               appliedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               appliedfrom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *       400:
 *         description: Bad request - invalid status or no fields to update
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 */
// Update an application
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const applicationId = parseInt(req.params.id);
    const { companyName, positionTitle, status, appliedDate, notes ,appliedfrom} = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['applied', 'interview', 'offer', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: applied, interview, offer, rejected' });
      }
    }

    // Check if application exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM job_applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (companyName !== undefined) {
      updates.push(`company_name = $${paramCount++}`);
      values.push(companyName);
    }
    if (positionTitle !== undefined) {
      updates.push(`position_title = $${paramCount++}`);
      values.push(positionTitle);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (appliedDate !== undefined) {
      updates.push(`applied_date = $${paramCount++}`);
      values.push(appliedDate);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (appliedfrom !== undefined) {
      updates.push(`applied_from = $${paramCount++}`);
      values.push(appliedfrom);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(applicationId, userId);

    const result = await pool.query(
      `UPDATE job_applications
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, company_name, position_title, status, applied_date, notes, created_at, updated_at`,
      values
    );

    res.json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Update application failed', error instanceof Error ? error : undefined);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete a job application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Application deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 */
// Delete an application
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const applicationId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id',
      [applicationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    logger.error('Delete application failed', error instanceof Error ? error : undefined);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


