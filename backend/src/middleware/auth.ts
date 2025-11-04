import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
      id: string;
      email: string;
      role: string;
    };

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token has expired', 401));
    } else {
      next(error);
    }
  }
};

// Authorization middleware (role-based)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
