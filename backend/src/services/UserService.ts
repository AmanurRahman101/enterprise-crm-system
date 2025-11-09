import { prisma } from '../config/database';
import { AuthUtils, TokenResponse } from '../utils/auth';
import { CreateUserDTO, UpdateUserDTO, LoginDTO } from '../types';

/**
 * UserService - Business logic for user management
 * Follows OOP principles with clear separation of concerns
 */
export class UserService {
  /**
   * Register a new user
   */
  async register(data: CreateUserDTO & { tenantId: string }): Promise<{
    user: {
      id: string;
      tenantId: string | null;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tokens: TokenResponse;
  }> {
    // Validate password strength
    const passwordValidation = AuthUtils.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { 
        tenantId: data.tenantId,
        email: data.email 
      }
    });

    if (existingUser) {
      throw new Error('User with this email already exists in this organization');
    }

    // Check if a user profile exists with this email
    let userProfile = await prisma.userProfile.findUnique({
      where: { email: data.email }
    });

    // If no profile exists, create one
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Determine status: APPROVED for role explicitly set (like ADMIN from new org creation), PENDING for regular signups
    const userStatus = data.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    // Create user linked to the profile
    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        userProfileId: userProfile.id,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: (data.role || 'SALES') as any,
        status: userStatus as any
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    });

    return { user, tokens };
  }

  /**
   * Register a new customer (individual account without tenant)
   */
  async registerCustomer(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isCustomer: boolean;
    };
    tokens: TokenResponse;
  }> {
    // Validate password strength
    const passwordValidation = AuthUtils.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Check if customer already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: data.email,
        isCustomer: true
      }
    });

    if (existingUser) {
      throw new Error('Customer with this email already exists');
    }

    // Check if a user profile exists with this email
    let userProfile = await prisma.userProfile.findUnique({
      where: { email: data.email }
    });

    // If no profile exists, create one
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create customer user without tenant (customers are auto-approved)
    const user = await prisma.user.create({
      data: {
        userProfileId: userProfile.id,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'CUSTOMER',
        isCustomer: true,
        status: 'APPROVED' as any // Customers don't need approval
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isCustomer: true
      }
    });

    // Generate tokens (no tenantId for customers)
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      tenantId: null as any,
      email: user.email,
      role: user.role,
      isCustomer: true
    });

    return { user, tokens };
  }

  /**
   * Login customer (individual account)
   */
  async loginCustomer(data: {
    email: string;
    password: string;
  }): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isCustomer: boolean;
    };
    tokens: TokenResponse;
  }> {
    // Find customer by email
    const user = await prisma.user.findFirst({
      where: { 
        email: data.email,
        isCustomer: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens (no tenantId for customers)
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      tenantId: null as any,
      email: user.email,
      role: user.role,
      isCustomer: true
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isCustomer: user.isCustomer
      },
      tokens
    };
  }

  /**
   * Login user with multi-tenant support
   */
  async login(data: LoginDTO & { tenantId: string | null }): Promise<{
    user: {
      id: string;
      tenantId: string | null;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      accessibleTenants?: Array<{
        id: string;
        subdomain: string;
        name: string;
        isPrimary: boolean;
      }>;
    };
    tokens: TokenResponse;
  }> {
    // Build where clause based on whether tenantId is provided
    const whereClause: any = { 
      email: data.email
    };
    
    if (data.tenantId !== null) {
      whereClause.tenantId = data.tenantId;
    }
    
    // Find user by email and optionally tenantId with profile and tenant relationships
    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        userProfile: {
          include: {
            userTenants: {
              include: {
                tenant: true
              }
            }
          }
        },
        tenant: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check if user is approved (only for business users, not customers)
    if (!user.isCustomer && user.status === 'PENDING') {
      throw new Error('Your account is pending approval by an administrator');
    }

    if (!user.isCustomer && user.status === 'REJECTED') {
      throw new Error('Your account has been rejected. Please contact the administrator');
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Build list of accessible tenants
    const accessibleTenants: Array<{
      id: string;
      subdomain: string;
      name: string;
      isPrimary: boolean;
    }> = [];

    // Add primary tenant if exists
    if (user.tenant) {
      accessibleTenants.push({
        id: user.tenant.id,
        subdomain: user.tenant.subdomain,
        name: user.tenant.name,
        isPrimary: true
      });
    }

    // Add additional tenants from UserTenant relationships
    if (user.userProfile && user.userProfile.userTenants) {
      for (const ut of user.userProfile.userTenants) {
        // Don't duplicate primary tenant
        if (ut.tenantId !== user.tenantId) {
          accessibleTenants.push({
            id: ut.tenant.id,
            subdomain: ut.tenant.subdomain,
            name: ut.tenant.name,
            isPrimary: false
          });
        }
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens with accessible tenants
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      accessibleTenants: accessibleTenants.map(t => ({ id: t.id, subdomain: t.subdomain }))
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accessibleTenants
      },
      tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string, tenantId: string | null): Promise<TokenResponse> {
    // Verify user still exists and is active
    const whereClause: any = { 
      id: userId
    };
    
    // Only add tenantId filter if it's not null
    if (tenantId !== null) {
      whereClause.tenantId = tenantId;
    }
    
    const user = await prisma.user.findFirst({
      where: whereClause
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    return AuthUtils.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    });
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
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
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserDTO) {
    // If password is being updated, validate and hash it
    if (data.password) {
      const passwordValidation = AuthUtils.validatePassword(data.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }
      data.password = await AuthUtils.hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: data as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return user;
  }

  /**
   * Get user by ID (for admin)
   */
  async getUserById(userId: string) {
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
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * List all users (for admin)
   */
  async listUsers(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return users;
  }

  /**
   * Deactivate user (for admin)
   */
  async deactivateUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true
      }
    });

    return user;
  }

  /**
   * Activate user (for admin)
   */
  async activateUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true
      }
    });

    return user;
  }

  /**
   * Get users with pagination and tenant filtering (for admin)
   */
  async getUsers(tenantId: string, filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      role,
      isActive,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters || {};

    const where: any = { tenantId };

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
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
        userProfile: {
          select: {
            phone: true,
            avatar: true
          }
        },
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
            assignedTasks: true,
            assignedTickets: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      users: users.map(user => ({
        ...user,
        phone: user.userProfile?.phone || null,
        avatar: user.userProfile?.avatar || null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed user by ID with tenant filtering (for admin)
   */
  async getUserByIdInTenant(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        tenantId
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
        userProfile: {
          select: {
            phone: true,
            avatar: true
          }
        },
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
            assignedTasks: true,
            createdTasks: true,
            assignedTickets: true,
            activities: true,
            notes: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      phone: user.userProfile?.phone || null,
      avatar: user.userProfile?.avatar || null
    };
  }

  /**
   * Update user (for admin)
   */
  async updateUser(
    userId: string,
    tenantId: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: string;
      phone?: string;
      avatar?: string;
    },
    requestingUserId: string
  ) {
    // Verify user exists in tenant
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { userProfile: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent users from changing their own role to prevent admin lockout
    if (userId === requestingUserId && data.role) {
      throw new Error('Cannot change your own role');
    }

    // Update user data
    const userUpdateData: any = {};
    if (data.firstName) userUpdateData.firstName = data.firstName;
    if (data.lastName) userUpdateData.lastName = data.lastName;
    if (data.role) userUpdateData.role = data.role;

    // Update profile data
    const profileUpdateData: any = {};
    if (data.phone !== undefined) profileUpdateData.phone = data.phone;
    if (data.avatar !== undefined) profileUpdateData.avatar = data.avatar;

    // Perform updates in transaction
    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData
        });
      }

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.userProfile.update({
          where: { id: user.userProfileId },
          data: profileUpdateData
        });
      }
    });

    // Return updated user
    return this.getUserByIdInTenant(userId, tenantId);
  }

  /**
   * Deactivate user with tenant check (for admin)
   */
  async deactivateUserInTenant(userId: string, tenantId: string, requestingUserId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent self-deactivation
    if (userId === requestingUserId) {
      throw new Error('Cannot deactivate your own account');
    }

    if (!user.isActive) {
      throw new Error('User is already inactive');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Reactivate user with tenant check (for admin)
   */
  async reactivateUserInTenant(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isActive) {
      throw new Error('User is already active');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    return { message: 'User reactivated successfully' };
  }

  /**
   * Get user statistics for tenant (for admin)
   */
  async getUserStats(tenantId: string) {
    const total = await prisma.user.count({ where: { tenantId } });
    const active = await prisma.user.count({ where: { tenantId, isActive: true } });
    const inactive = await prisma.user.count({ where: { tenantId, isActive: false } });

    // Get counts by role
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      where: { tenantId },
      _count: true
    });

    const byRole = roleStats.map(stat => ({
      role: stat.role,
      count: stat._count
    }));

    // Get recently active users
    const recentlyActive = await prisma.user.findMany({
      where: { tenantId, lastLoginAt: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lastLoginAt: true,
        role: true
      },
      orderBy: { lastLoginAt: 'desc' },
      take: 10
    });

    return {
      total,
      active,
      inactive,
      byRole,
      recentlyActive
    };
  }

  /**
   * Get team members for assignment (active users only)
   */
  async getTeamMembers(tenantId: string) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: ['ADMIN', 'MANAGER', 'SALES', 'SUPPORT'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userProfile: {
          select: { avatar: true }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return users.map(user => ({
      ...user,
      avatar: user.userProfile?.avatar || null
    }));
  }

  /**
   * Get user activity summary (for admin)
   */
  async getUserActivity(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [
      contactsOwned,
      dealsOwned,
      tasksAssigned,
      tasksCreated,
      ticketsAssigned,
      activitiesLogged,
      notesCreated
    ] = await Promise.all([
      prisma.contact.count({ where: { ownerId: userId, tenantId } }),
      prisma.deal.count({ where: { ownerId: userId, tenantId } }),
      prisma.task.count({ where: { assigneeId: userId, tenantId } }),
      prisma.task.count({ where: { creatorId: userId, tenantId } }),
      prisma.ticket.count({ where: { assigneeId: userId, tenantId } }),
      prisma.activity.count({ where: { userId, tenantId } }),
      prisma.note.count({ where: { authorId: userId, tenantId } })
    ]);

    const recentActivities = await prisma.activity.findMany({
      where: { userId, tenantId },
      select: {
        id: true,
        type: true,
        subject: true,
        occurredAt: true,
        contact: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { occurredAt: 'desc' },
      take: 5
    });

    return {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      summary: {
        contactsOwned,
        dealsOwned,
        tasksAssigned,
        tasksCreated,
        ticketsAssigned,
        activitiesLogged,
        notesCreated
      },
      recentActivities
    };
  }
}
