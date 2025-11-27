// Authentication Middleware
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');
const db = require('../db/connection');

// Verify JWT token and extract userId + currentOrganizationId
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'No token provided. Authentication required.'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Support legacy tokens that used "id" instead of "userId"
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token payload: missing user identifier.'
      });
    }

    // Extract required fields from JWT (userType removed - all users are unified)
    req.user = {
      userId,
      id: userId, // Backward compatibility for legacy controllers
      email: decoded.email,
      currentOrganizationId: decoded.currentOrganizationId || decoded.organizationId || null,
      userType: decoded.userType || decoded.type || 'internal', // Optional, kept for backward compatibility
      legacyCustomer: decoded.legacyCustomer || false
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message
    });
  }
};

// Validate organization membership (strict multi-tenant isolation)
// Note: All users can access client portal and create/join organizations
// Organization context is only required for organization-scoped routes
const validateOrganizationMembership = async (req, res, next) => {
  try {
    // All users can access organization management routes (create/list orgs)
    // BUT NOT contact organizations routes - those need role validation
    // All users can access client portal routes (no organization needed)
    const isOrganizationManagementRoute = req.path.startsWith('/api/organizations') && 
                                         (req.method === 'GET' || req.method === 'POST');
    const isClientPortalRoute = req.path.includes('/client') || req.path.includes('/my-');
    
    if (isOrganizationManagementRoute || isClientPortalRoute) {
      // Allow access to organization management and client portal routes without organization context
      req.user.organizationId = req.user.currentOrganizationId || null;
      return next();
    }

    // For organization-scoped routes, organization context is required
    if (!req.user || !req.user.currentOrganizationId) {
      return res.status(403).json({
        success: false,
        message: 'No organization context. Please select or create an organization.'
      });
    }

    // Debug logging
    console.log('Validating organization membership:', {
      userId: req.user.userId,
      currentOrganizationId: req.user.currentOrganizationId,
      path: req.path
    });

    // Ensure userId and organizationId are numbers for consistent query
    const userId = parseInt(req.user.userId);
    const organizationId = parseInt(req.user.currentOrganizationId);

    if (isNaN(userId) || isNaN(organizationId)) {
      console.error('Invalid user or organization ID:', {
        userId: req.user.userId,
        organizationId: req.user.currentOrganizationId
      });
      return res.status(403).json({
        success: false,
        message: 'Invalid user or organization ID.'
      });
    }

    // Query with explicit type casting and multiple fallbacks
    // Query with explicit type casting to ensure match
    const [memberships] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = CAST(? AS UNSIGNED) AND organization_id = CAST(? AS UNSIGNED)',
      [userId, organizationId]
    );

    console.log('Membership query result:', {
      userId: userId,
      organizationId: organizationId,
      queryParams: [userId, organizationId],
      queryParamsTypes: [typeof userId, typeof organizationId],
      found: memberships.length > 0,
      role: memberships.length > 0 ? memberships[0].role : 'not found',
      roleType: memberships.length > 0 ? typeof memberships[0].role : 'N/A',
      rawResult: memberships
    });

    if (memberships.length === 0) {
      console.error('User not found in organization:', {
        userId: userId,
        organizationId: organizationId
      });
      
      // Try to see if user exists in any organization
      const [allMemberships] = await db.query(
        'SELECT organization_id, role FROM user_organizations WHERE user_id = ?',
        [userId]
      );
      console.log('All user memberships:', allMemberships);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this organization. Please switch to an organization you belong to.'
      });
    }

    // Add user's role in current organization to req.user
    let role = memberships[0].role;
    
    // Handle NULL or missing role - fix in database and set default
    if (!role || role === null || role === '' || role === undefined) {
      console.error('⚠️ Role is NULL or missing in database for user:', {
        userId: userId,
        organizationId: organizationId,
        membershipRecord: memberships[0]
      });
      
      // Fix the role in the database
      // Default to 'owner' if this is the first member (likely creator), else 'agent'
      // Check how many members this organization has
      const [memberCount] = await db.query(
        'SELECT COUNT(*) as count FROM user_organizations WHERE organization_id = ?',
        [organizationId]
      );
      
      // If only one member (likely the creator), set to owner, otherwise agent
      const defaultRole = (memberCount[0].count <= 1) ? 'owner' : 'agent';
      
      console.log(`🔧 Fixing missing role in database: Setting role to '${defaultRole}' for user ${userId} in organization ${organizationId}`);
      console.log(`   Organization has ${memberCount[0].count} member(s)`);
      
      // Update the role in database
      try {
        await db.query(
          'UPDATE user_organizations SET role = ? WHERE user_id = ? AND organization_id = ?',
          [defaultRole, userId, organizationId]
        );
        role = defaultRole;
        console.log(`✅ Role fixed in database: ${role}`);
      } catch (updateError) {
        console.error('❌ Error updating role in database:', updateError);
        // Still set a default role so the request can proceed
        role = defaultRole;
        console.warn(`⚠️ Using default role '${role}' without updating database`);
      }
    }

    // Ensure role is set - double check before proceeding
    if (!role || role === null || role === '' || role === undefined) {
      console.error('❌ CRITICAL: Role is still undefined after fix attempt!', {
        userId: userId,
        organizationId: organizationId,
        membershipRecord: memberships[0]
      });
      
      // Last resort: set default role
      role = 'agent';
      console.warn(`⚠️ Using emergency fallback: Setting role to 'agent'`);
      
      // Try to update database one more time
      try {
        await db.query(
          'UPDATE user_organizations SET role = ? WHERE user_id = ? AND organization_id = ?',
          ['agent', userId, organizationId]
        );
      } catch (updateError) {
        console.error('Failed to update role even with fallback:', updateError);
      }
    }

    // Set role and organization ID
    req.user.role = role;
    req.user.organizationId = organizationId;
    
    // Final verification
    if (!req.user.role) {
      console.error('❌ FATAL: req.user.role is still undefined after setting!');
      return res.status(500).json({
        success: false,
        message: 'Server error: Unable to determine user role. Please contact support.'
      });
    }
    
    console.log('✅ Organization membership validated:', {
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      role: req.user.role,
      verified: !!req.user.role
    });
    
    next();
  } catch (error) {
    console.error('Organization membership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating organization membership.',
      error: error.message
    });
  }
};

// Require specific role(s) in current organization
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Role verification failed.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

// All users are unified - removed user type restrictions
// These middleware functions are kept for backward compatibility but always pass
// All users can access both client portal and organization features

// Verify if user is internal (always passes - all users are unified)
const isInternal = (req, res, next) => {
  // All users can access organization features
  next();
};

// Verify if user is client (always passes - all users are unified)
const isClient = (req, res, next) => {
  // All users can access client portal
  next();
};

// Combined middleware: verify token + validate organization membership
const authenticate = [verifyToken, validateOrganizationMembership];

// Legacy aliases for backward compatibility with old RPC routes
// Companies are internal users, customers are client users
const isCompany = isInternal;
const isCustomer = isClient;

module.exports = {
  verifyToken,
  validateOrganizationMembership,
  requireRole,
  isInternal,
  isClient,
  authenticate,
  // Legacy aliases for backward compatibility
  isCompany,
  isCustomer
};
