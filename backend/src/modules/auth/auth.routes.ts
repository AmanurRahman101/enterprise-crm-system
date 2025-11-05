import { Router } from 'express';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new organization and admin user
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { organizationName, firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!organizationName || !firstName || !lastName || !email || !password) {
      throw new AppError('All fields are required', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const jwtExpiry = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        organizationId: result.user.organizationId,
        role: result.user.role,
      } as jwt.JwtPayload,
      jwtSecret,
      { expiresIn: jwtExpiry } as jwt.SignOptions
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const jwtExpiry = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      } as jwt.JwtPayload,
      jwtSecret,
      { expiresIn: jwtExpiry } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
