// Role-based Permission System
// Defines what each role can do in the organization

/**
 * Role Hierarchy (from highest to lowest):
 * - owner: Full access, can manage all members and settings
 * - admin: Can manage members and organization settings
 * - manager: Can manage deals, contacts, and issues
 * - agent: Can create and manage deals and contacts (assigned to them)
 * - viewer: Read-only access to organization data
 */

// Permission definitions
const PERMISSIONS = {
  // Organization Management
  MANAGE_ORGANIZATION: ['owner', 'admin'],
  MANAGE_MEMBERS: ['owner', 'admin'],
  VIEW_MEMBERS: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  
  // Deals Management
  CREATE_DEAL: ['owner', 'admin', 'manager', 'agent'],
  UPDATE_DEAL: ['owner', 'admin', 'manager', 'agent'],
  DELETE_DEAL: ['owner', 'admin', 'manager'],
  VIEW_DEAL: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  ASSIGN_DEAL: ['owner', 'admin', 'manager'],
  
  // Contacts Management
  CREATE_CONTACT: ['owner', 'admin', 'manager', 'agent'],
  UPDATE_CONTACT: ['owner', 'admin', 'manager', 'agent'],
  DELETE_CONTACT: ['owner', 'admin', 'manager'],
  VIEW_CONTACT: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  
  // Issues Management
  CREATE_ISSUE: ['owner', 'admin', 'manager', 'agent'],
  UPDATE_ISSUE: ['owner', 'admin', 'manager', 'agent'],
  DELETE_ISSUE: ['owner', 'admin', 'manager'],
  VIEW_ISSUE: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  ASSIGN_ISSUE: ['owner', 'admin', 'manager'],
  
  // Activities Management
  VIEW_ACTIVITIES: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  CREATE_ACTIVITY: ['owner', 'admin', 'manager', 'agent'], // System-generated
  
  // Files Management
  UPLOAD_FILE: ['owner', 'admin', 'manager', 'agent'],
  DELETE_FILE: ['owner', 'admin', 'manager'],
  VIEW_FILE: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  
  // Calls Management
  MAKE_CALL: ['owner', 'admin', 'manager', 'agent'], // Viewer cannot make calls
  ANSWER_CALL: ['owner', 'admin', 'manager', 'agent'], // Viewer cannot answer calls
  VIEW_CALL_HISTORY: ['owner', 'admin', 'manager', 'agent', 'viewer'], // Viewer can view call history
  
  // Team/User Management
  VIEW_TEAM: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  ADD_TEAM_MEMBER: ['owner', 'admin'],
  UPDATE_TEAM_MEMBER_ROLE: ['owner', 'admin'],
  REMOVE_TEAM_MEMBER: ['owner', 'admin'],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
const hasPermission = (role, permission) => {
  if (!role || !permission) {
    return false;
  }
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false; // Unknown permission
  }
  
  return allowedRoles.includes(role);
};

/**
 * Check if a role can perform an action on a resource
 * Agents can only modify resources they own/created
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @param {number} resourceUserId - User ID who created/owns the resource
 * @param {number} currentUserId - Current user's ID
 * @returns {boolean} - True if role can perform action
 */
const canPerformAction = (role, permission, resourceUserId, currentUserId) => {
  // Check base permission
  if (!hasPermission(role, permission)) {
    return false;
  }
  
  // Agents can only modify their own resources
  if (role === 'agent') {
    // Check write permissions that need ownership check
    const writePermissions = [
      'UPDATE_DEAL',
      'DELETE_DEAL',
      'UPDATE_CONTACT',
      'DELETE_CONTACT',
      'UPDATE_ISSUE',
      'DELETE_ISSUE',
      'DELETE_FILE'
    ];
    
    if (writePermissions.includes(permission)) {
      return resourceUserId === currentUserId;
    }
  }
  
  // All other roles with permission can perform action
  return true;
};

/**
 * Get all permissions for a role
 * @param {string} role - User's role
 * @returns {Array<string>} - Array of permission names
 */
const getRolePermissions = (role) => {
  if (!role) {
    return [];
  }
  
  const permissions = [];
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(role)) {
      permissions.push(permission);
    }
  }
  
  return permissions;
};

/**
 * Check if role can write (create/update/delete)
 * @param {string} role - User's role
 * @returns {boolean} - True if role can write
 */
const canWrite = (role) => {
  return ['owner', 'admin', 'manager', 'agent'].includes(role);
};

/**
 * Check if role can only read (viewer)
 * @param {string} role - User's role
 * @returns {boolean} - True if role is read-only
 */
const isReadOnly = (role) => {
  return role === 'viewer';
};

/**
 * Check if role can manage organization settings
 * @param {string} role - User's role
 * @returns {boolean} - True if role can manage organization
 */
const canManageOrganization = (role) => {
  return hasPermission(role, 'MANAGE_ORGANIZATION');
};

/**
 * Check if role can manage team members
 * @param {string} role - User's role
 * @returns {boolean} - True if role can manage members
 */
const canManageMembers = (role) => {
  return hasPermission(role, 'MANAGE_MEMBERS');
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  canPerformAction,
  getRolePermissions,
  canWrite,
  isReadOnly,
  canManageOrganization,
  canManageMembers
};

