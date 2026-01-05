import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Get all applications for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, company_name, position_title, status, applied_date, notes, created_at, updated_at
       FROM job_applications
       WHERE user_id = $1
       ORDER BY applied_date DESC, created_at DESC`,
      [userId]
    );

    res.json({ applications: result.rows });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single application by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const applicationId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, company_name, position_title, status, applied_date, notes, created_at, updated_at
       FROM job_applications
       WHERE id = $1 AND user_id = $2`,
      [applicationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application: result.rows[0] });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new application
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { companyName, positionTitle, status, appliedDate, notes } = req.body;

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
      `INSERT INTO job_applications (user_id, company_name, position_title, status, applied_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_name, position_title, status, applied_date, notes, created_at, updated_at`,
      [userId, companyName, positionTitle, applicationStatus, appliedDate, notes || null]
    );

    res.status(201).json({ application: result.rows[0] });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an application
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const applicationId = parseInt(req.params.id);
    const { companyName, positionTitle, status, appliedDate, notes } = req.body;

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
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

