import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalApplications:
 *                       type: integer
 *                     interviews:
 *                       type: integer
 *                     offers:
 *                       type: integer
 *                     rejections:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// Get user dashboard data
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user statistics from job_applications
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'applied') as total_applications,
        COUNT(*) FILTER (WHERE status = 'interview') as interviews,
        COUNT(*) FILTER (WHERE status = 'offer') as offers,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejections,
        COUNT(*) as total
       FROM job_applications
       WHERE user_id = $1`,
      [userId]
    );

    const stats = {
      totalApplications: parseInt(statsResult.rows[0].total_applications) || 0,
      interviews: parseInt(statsResult.rows[0].interviews) || 0,
      offers: parseInt(statsResult.rows[0].offers) || 0,
      rejections: parseInt(statsResult.rows[0].rejections) || 0,
      total: parseInt(statsResult.rows[0].total) || 0,
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
      },
      stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

