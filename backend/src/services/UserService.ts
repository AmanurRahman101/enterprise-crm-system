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
      tenantId: string;
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

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: (data.role || 'USER') as any
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
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
   * Login user
   */
  async login(data: LoginDTO & { tenantId: string }): Promise<{
    user: {
      id: string;
      tenantId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tokens: TokenResponse;
  }> {
    // Find user by email and tenantId
    const user = await prisma.user.findFirst({
      where: { 
        email: data.email,
        tenantId: data.tenantId
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

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string, tenantId: string): Promise<TokenResponse> {
    // Verify user still exists and is active
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        tenantId: tenantId
      }
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
}
