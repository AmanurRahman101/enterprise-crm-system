import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const tenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Ensure the user is authenticated and has an organizationId
  if (!req.user?.organizationId) {
    res.status(401).json({ error: 'Organization context required' });
    return;
  }

  // The organizationId is available in req.user.organizationId
  // Services should use this to filter data
  next();
};
