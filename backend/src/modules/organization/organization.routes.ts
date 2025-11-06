import { Router, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/organization - Get current organization details
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.user!;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        subdomain: true,
        createdAt: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.json({ organization });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/organization/domain - Update custom domain (ADMIN only)
router.put('/domain', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, role } = req.user!;
    const { domain, subdomain } = req.body;

    // Only ADMIN can update domain settings
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update domain settings' });
    }

    // Validate domain format if provided
    if (domain) {
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
      }

      // Check if domain is already taken
      const existingOrg = await prisma.organization.findFirst({
        where: {
          domain,
          id: { not: organizationId },
        },
      });

      if (existingOrg) {
        return res.status(400).json({ error: 'This domain is already in use by another organization' });
      }
    }

    // Validate subdomain format if provided
    if (subdomain) {
      const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
      if (!subdomainRegex.test(subdomain)) {
        return res.status(400).json({ 
          error: 'Invalid subdomain format. Use only letters, numbers, and hyphens.' 
        });
      }

      // Check if subdomain is already taken
      const existingOrg = await prisma.organization.findFirst({
        where: {
          subdomain,
          id: { not: organizationId },
        },
      });

      if (existingOrg) {
        return res.status(400).json({ error: 'This subdomain is already in use by another organization' });
      }
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        domain: domain || null,
        subdomain: subdomain || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        subdomain: true,
      },
    });

    return res.json({
      message: 'Domain settings updated successfully',
      organization: updatedOrg,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/organization/check-domain/:domain - Check if domain is available
router.get('/check-domain/:domain', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { domain } = req.params;
    const { organizationId } = req.user!;

    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { domain },
          { subdomain: domain },
        ],
        id: { not: organizationId },
      },
    });

    return res.json({
      available: !existingOrg,
      domain,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
