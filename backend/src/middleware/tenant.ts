import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/TenantService';
import { AuthUtils } from '../utils/auth';

const tenantService = new TenantService();

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
      };
    }
  }
}

/**
 * Tenant middleware - Extract tenant from subdomain or header
 * 
 * Supports multiple ways to identify tenant:
 * 1. X-Tenant-ID header (for API clients)
 * 2. X-Tenant-Subdomain header
 * 3. Host subdomain (e.g., acme.tawasol.com)
 * 
 * Also validates user has access to requested tenant (multi-tenant security)
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let tenantId: string | undefined;
    let subdomain: string | undefined;

    // Method 1: Check for X-Tenant-ID header (direct tenant ID)
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdHeader) {
      tenantId = tenantIdHeader;
    }

    // Method 2: Check for X-Tenant-Subdomain header
    const subdomainHeader = req.headers['x-tenant-subdomain'] as string;
    if (subdomainHeader) {
      subdomain = subdomainHeader;
    }

    // Method 3: Extract from host/domain (e.g., acme.tawasol.com)
    if (!subdomain && !tenantId) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      
      // If host has subdomain (more than 2 parts, or 3+ for localhost)
      if (parts.length > 2 || (parts.length === 3 && parts[0] !== 'www')) {
        subdomain = parts[0];
      }
    }

    // Get tenant by subdomain or ID
    let tenant: any = null;
    if (subdomain) {
      tenant = await tenantService.getTenantBySubdomain(subdomain);
      req.tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      };
    } else if (tenantId) {
      tenant = await tenantService.getTenantById(tenantId);
      req.tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      };
    } else {
      // No tenant identified - this is okay for some routes
      // Individual routes can enforce tenant requirement
      return next();
    }

    // SECURITY: Validate user has access to this tenant (if authenticated)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = AuthUtils.extractToken(authHeader);
      if (token) {
        try {
          const decoded = AuthUtils.verifyAccessToken(token);
          
          // Check if user has access to this tenant
          const requestedSubdomain = tenant.subdomain;
          const hasAccess = 
            decoded.tenantId === tenant.id || // Primary tenant matches
            decoded.accessibleTenants?.some(t => t.subdomain === requestedSubdomain); // Or in accessible list

          if (!hasAccess) {
            console.error(
              `🚨 [SECURITY] User ${decoded.userId} (${decoded.email}) attempted to access tenant "${requestedSubdomain}" ` +
              `but only has access to: ${decoded.accessibleTenants?.map(t => t.subdomain).join(', ') || decoded.tenantId}`
            );
            res.status(403).json({
              success: false,
              message: 'Access denied: You do not have permission to access this tenant',
              accessibleTenants: decoded.accessibleTenants?.map(t => t.subdomain) || []
            });
            return;
          }
          
          console.log(`✅ [SECURITY] User ${decoded.userId} verified for tenant ${requestedSubdomain}`);
        } catch (error) {
          // Invalid token - let auth middleware handle it
          console.warn('⚠️ [SECURITY] Invalid token in tenant middleware:', error);
        }
      }
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid tenant',
    });
  }
};

/**
 * Require tenant middleware - Ensures tenant is present
 */
export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenant) {
    res.status(400).json({
      success: false,
      message: 'Tenant identification required. Please provide X-Tenant-Subdomain header (e.g., acme) or use tenant subdomain.',
    });
    return;
  }
  next();
};
