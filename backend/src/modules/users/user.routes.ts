import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();

// GET /api/users - Get all users in the organization
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, role } = req.user!;

    // Only ADMIN can view all users
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can view team members' });
    }

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users/invite - Send invitation to a new team member
router.post('/invite', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, role, id } = req.user!;
    const { firstName, lastName, email, role: inviteRole } = req.body;

    // Only ADMIN can invite users
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can invite team members' });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !inviteRole) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['MANAGER', 'EMPLOYEE'].includes(inviteRole)) {
      return res.status(400).json({ error: 'Role must be MANAGER or EMPLOYEE' });
    }

    // Check if email already exists as a user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'An invitation has already been sent to this email' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        role: inviteRole,
        token,
        organizationId,
        invitedBy: id,
        expiresAt,
      },
    });

    // TODO: Send email with invitation link
    // For now, return the invitation link in the response
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${token}`;

    return res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      invitationLink, // In production, this would be sent via email
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users/accept-invitation - Accept an invitation and create account
router.post('/accept-invitation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    // Check if already accepted
    if (invitation.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'This invitation has already been accepted' });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user account
    const newUser = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        organizationId: invitation.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return res.status(201).json({
      message: 'Account created successfully! You can now log in.',
      user: newUser,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users/invitation/:token - Get invitation details
router.get('/invitation/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    console.log('🔍 Looking for invitation with token:', token);

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('📧 Invitation found:', invitation ? 'Yes' : 'No');

    if (!invitation) {
      console.log('❌ No invitation found with this token');
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.status === 'ACCEPTED') {
      console.log('⚠️ Invitation already accepted');
      return res.status(400).json({ error: 'This invitation has already been accepted' });
    }

    if (new Date() > invitation.expiresAt) {
      console.log('⏰ Invitation expired');
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    console.log('✅ Returning valid invitation data');
    return res.json({
      invitation: {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('💥 Error in GET /invitation/:token:', error);
    return next(error);
  }
});

// DELETE /api/users/:id - Remove a team member
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id: currentUserId, role } = req.user!;
    const { id } = req.params;

    // Only ADMIN can remove users
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can remove team members' });
    }

    // Cannot delete yourself
    if (id === currentUserId) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }

    // Check if user exists and belongs to the same organization
    const userToDelete = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    return res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    return next(error);
  }
});

export default router;
