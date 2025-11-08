import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ContactService } from '../services/ContactService';
import { CreateUserDTO, UpdateUserDTO, LoginDTO } from '../types';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';

const userService = new UserService();
const contactService = new ContactService();
const prisma = new PrismaClient();

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
      // Check if this is a customer registration
      const { isCustomer } = req.body;

      if (isCustomer) {
        // Customer registration doesn't require tenant
        return await AuthController.registerCustomer(req, res);
      }

      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required for business account'
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
   * Register a new customer (individual account)
   * POST /api/auth/register (with isCustomer: true)
   */
  static async registerCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, first name, and last name are required'
        });
        return;
      }

      const result = await userService.registerCustomer({
        email,
        password,
        firstName,
        lastName
      });

      // Auto-link any existing contacts with this email
      const linkedCount = await contactService.autoLinkContactByEmail(email, result.user.id);
      if (linkedCount > 0) {
        logger.info(`Auto-linked ${linkedCount} contact(s) to user ${result.user.id}`);
      }

      logger.info(`New customer registered: ${result.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Customer account created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Customer register error:', error);
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
      const { isCustomer } = req.body;

      // Customer login doesn't require tenant
      if (isCustomer) {
        return await AuthController.loginCustomer(req, res);
      }

      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required for business account'
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
   * Login customer (individual account)
   * POST /api/auth/login (with isCustomer: true)
   */
  static async loginCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const result = await userService.loginCustomer({
        email,
        password
      });

      logger.info(`Customer logged in: ${result.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Customer login error:', error);
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

/**
 * Get all tenants where the user has an account
 * GET /api/auth/my-tenants
 */
export const getMyTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userId = req.user.userId;

    // Get the user's profile to find all their tenant accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: {
          include: {
            tenantAccounts: {
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    logo: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.userProfile) {
      res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
      return;
    }

    const tenants = user.userProfile.tenantAccounts.map((account: any) => ({
      userId: account.id,
      tenantId: account.tenant.id,
      tenantName: account.tenant.name,
      subdomain: account.tenant.subdomain,
      logo: account.tenant.logo,
      role: account.role,
      isActive: account.tenant.isActive,
      isCurrentTenant: account.tenantId === req.user!.tenantId,
    }));

    res.status(200).json({
      success: true,
      data: {
        userProfileId: user.userProfile.id,
        email: user.userProfile.email,
        firstName: user.userProfile.firstName,
        lastName: user.userProfile.lastName,
        tenants,
      }
    });
  } catch (error) {
    logger.error('Get my tenants error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get tenants'
    });
  }
};

/**
 * Switch to a different tenant
 * POST /api/auth/switch-tenant
 */
export const switchTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { tenantId } = req.body;
    const currentUserId = req.user.userId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    // Get the user's profile to verify they have access to this tenant
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        userProfile: {
          include: {
            tenantAccounts: {
              where: { tenantId },
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });

    if (!currentUser || !currentUser.userProfile) {
      res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
      return;
    }

    // Check if user has access to the requested tenant
    if (currentUser.userProfile.tenantAccounts.length === 0) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this tenant'
      });
      return;
    }

    const targetAccount = currentUser.userProfile.tenantAccounts[0];

    // Check if tenant exists and is active
    if (!targetAccount.tenant) {
      res.status(403).json({
        success: false,
        message: 'Target tenant not found'
      });
      return;
    }

    if (!targetAccount.tenant.isActive) {
      res.status(403).json({
        success: false,
        message: 'Target tenant is inactive'
      });
      return;
    }

    // Generate new tokens for the target tenant
    const tokens = AuthUtils.generateTokens({
      userId: targetAccount.id,
      tenantId: targetAccount.tenantId || null,
      email: targetAccount.email,
      role: targetAccount.role,
    });

    logger.info(`User ${currentUser.userProfile.email} switched to tenant: ${targetAccount.tenant.name}`);

    res.status(200).json({
      success: true,
      message: 'Switched tenant successfully',
      data: {
        tenant: {
          id: targetAccount.tenant.id,
          name: targetAccount.tenant.name,
          subdomain: targetAccount.tenant.subdomain,
        },
        user: {
          id: targetAccount.id,
          email: targetAccount.email,
          firstName: targetAccount.firstName,
          lastName: targetAccount.lastName,
          role: targetAccount.role,
        },
        ...tokens,
      }
    });
  } catch (error) {
    logger.error('Switch tenant error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to switch tenant'
    });
  }
};
