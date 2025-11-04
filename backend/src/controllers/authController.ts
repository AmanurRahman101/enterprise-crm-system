import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserDTO, UpdateUserDTO, LoginDTO } from '../types';
import logger from '../utils/logger';

const userService = new UserService();

/**
 * AuthController - Handles authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required'
        });
        return;
      }

      const data: CreateUserDTO = req.body;

      // Validate required fields
      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, first name, and last name are required'
        });
        return;
      }

      const result = await userService.register({
        ...data,
        tenantId: req.tenant.id
      });

      logger.info(`New user registered: ${result.user.email} (Tenant: ${req.tenant.name})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required'
        });
        return;
      }

      const data: LoginDTO = req.body;

      // Validate required fields
      if (!data.email || !data.password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const result = await userService.login({
        ...data,
        tenantId: req.tenant.id
      });

      logger.info(`User logged in: ${result.user.email} (Tenant: ${req.tenant.name})`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // User payload attached by validateRefreshToken middleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      const tokens = await userService.refreshToken(req.user.userId, req.user.tenantId);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await userService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  }

  /**
   * Update current user profile
   * PUT /api/auth/me
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const data: UpdateUserDTO = req.body;

      // Don't allow role changes through this endpoint
      if (data.role) {
        delete data.role;
      }

      const user = await userService.updateProfile(req.user.userId, data);

      logger.info(`User profile updated: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  }

  /**
   * Logout (client-side only, invalidates token on client)
   * POST /api/auth/logout
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    // In a stateless JWT system, logout is handled on the client
    // by removing the tokens from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      // Verify current password by attempting login
      const loginResult = await userService.login({
        email: req.user.email,
        password: currentPassword,
        tenantId: req.user.tenantId
      });

      if (!loginResult) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      await userService.updateProfile(req.user.userId, {
        password: newPassword
      });

      logger.info(`Password changed for user: ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    }
  }
}
