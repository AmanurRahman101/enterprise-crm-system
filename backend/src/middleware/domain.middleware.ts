import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export interface DomainRequest extends Request {
  organization?: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
  };
}

/**
 * Middleware to identify the organization based on:
 * 1. Custom domain (e.g., crm.companyA.com)
 * 2. Subdomain (e.g., companyA.tawasol.app)
 * 3. Header (X-Organization-Id for API clients)
 */
export const identifyOrganization = async (
  req: DomainRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const orgHeader = req.get('x-organization-id');
    
    console.log('🌐 Domain Middleware - Host:', host);
    
    let organization = null;

    // Method 1: Check if custom domain matches
    if (host && !host.includes('localhost')) {
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { domain: host },
            { domain: host.split(':')[0] }, // Remove port if exists
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          subdomain: true,
        },
      });
      
      if (organization) {
        console.log('✅ Organization found by custom domain:', organization.name);
      }
    }

    // Method 2: Check subdomain (e.g., companyA.tawasol.app)
    if (!organization && host) {
      const subdomain = host.split('.')[0];
      
      // Skip if it's localhost or www
      if (subdomain && subdomain !== 'localhost' && subdomain !== 'www' && !host.includes('localhost')) {
        organization = await prisma.organization.findFirst({
          where: { subdomain },
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            subdomain: true,
          },
        });
        
        if (organization) {
          console.log('✅ Organization found by subdomain:', organization.name);
        }
      }
    }

    // Method 3: Check X-Organization-Id header
    if (!organization && orgHeader) {
      organization = await prisma.organization.findUnique({
        where: { id: orgHeader },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          subdomain: true,
        },
      });
      
      if (organization) {
        console.log('✅ Organization found by header:', organization.name);
      }
    }

    // Attach organization to request if found
    if (organization) {
      req.organization = organization;
    }

    next();
  } catch (error) {
    console.error('💥 Error in domain middleware:', error);
    next(error);
  }
};

/**
 * Middleware to require organization context
 * Use this after identifyOrganization for routes that MUST have an org
 */
export const requireOrganization = (
  req: DomainRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.organization) {
    res.status(400).json({ 
      error: 'Organization context required. Please access via custom domain or provide X-Organization-Id header.' 
    });
    return;
  }
  next();
};
