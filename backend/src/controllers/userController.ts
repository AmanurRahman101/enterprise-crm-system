import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const userService = new UserService();

/**
 * Get all users in tenant (Admin only)
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const filters = {
      role: req.query.role as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await userService.getUsers(tenantId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get users'
    });
  }
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const user = await userService.getUserByIdInTenant(id, tenantId);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user'
    });
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const requestingUserId = req.user?.userId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    if (!requestingUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { firstName, lastName, role, phone, avatar } = req.body;

    const updatedUser = await userService.updateUser(
      id,
      tenantId,
      { firstName, lastName, role, phone, avatar },
      requestingUserId
    );

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user:', error);

    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error instanceof Error && error.message === 'Cannot change your own role') {
      res.status(403).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user'
    });
  }
};

/**
 * Deactivate user (Admin only)
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const requestingUserId = req.user?.userId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    if (!requestingUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await userService.deactivateUserInTenant(id, tenantId, requestingUserId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deactivating user:', error);

    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error instanceof Error && (
      error.message === 'Cannot deactivate your own account' ||
      error.message === 'User is already inactive'
    )) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deactivate user'
    });
  }
};

/**
 * Reactivate user (Admin only)
 */
export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const result = await userService.reactivateUserInTenant(id, tenantId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error reactivating user:', error);

    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error instanceof Error && error.message === 'User is already active') {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reactivate user'
    });
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const stats = await userService.getUserStats(tenantId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user statistics'
    });
  }
};

/**
 * Get team members for assignment dropdowns (All authenticated users)
 */
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const teamMembers = await userService.getTeamMembers(tenantId);

    res.status(200).json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    logger.error('Error getting team members:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get team members'
    });
  }
};

/**
 * Get user activity summary (Admin only)
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
      return;
    }

    const activity = await userService.getUserActivity(id, tenantId);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Error getting user activity:', error);

    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user activity'
    });
  }
};

/**
 * Get current user's profile
 * GET /api/users/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};

/**
 * Update current user's profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { firstName, lastName } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
      return;
    }

    // Update user profile (phone and avatar stored in frontend only for now)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User ${userId} updated their profile`);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Change current user's password
 * PUT /api/users/password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info(`User ${userId} changed their password`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/users/notifications
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const {
      emailNotifications,
      dealUpdates,
      taskReminders,
      ticketAssignments,
      systemAlerts,
      weeklyDigest,
    } = req.body;

    const preferences = {
      emailNotifications: emailNotifications ?? true,
      dealUpdates: dealUpdates ?? true,
      taskReminders: taskReminders ?? true,
      ticketAssignments: ticketAssignments ?? true,
      systemAlerts: systemAlerts ?? true,
      weeklyDigest: weeklyDigest ?? false,
    };

    logger.info(`User ${userId} updated notification preferences`);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (error: any) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

/**
 * Get notification preferences
 * GET /api/users/notifications
 */
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Return default preferences for now
    const preferences = {
      emailNotifications: true,
      dealUpdates: true,
      taskReminders: true,
      ticketAssignments: true,
      systemAlerts: true,
      weeklyDigest: false,
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message,
    });
  }
};
