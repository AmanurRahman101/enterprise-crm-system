import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

/**
 * @route   GET /api/tenants/public
 * @desc    Get all active tenants for registration (PUBLIC - no auth needed)
 * @access  Public
 */
router.get('/public', async (_req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
});

export default router;
