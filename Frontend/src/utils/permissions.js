// Role-based Permission Utilities for Frontend
// Mirrors Backend/utils/permissions.js

/**
 * Role Hierarchy (from highest to lowest):
 * - owner: Full access, can manage all members and settings
 * - admin: Can manage members and organization settings
 * - manager: Can manage deals, contacts, and issues
 * - agent: Can create and manage deals and contacts (assigned to them)
 * - viewer: Read-only access to organization data
 */

// Permission definitions (matching backend)
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
  CREATE_ACTIVITY: ['owner', 'admin', 'manager', 'agent'],
  
  // Files Management
  UPLOAD_FILE: ['owner', 'admin', 'manager', 'agent'],
  DELETE_FILE: ['owner', 'admin', 'manager'],
  VIEW_FILE: ['owner', 'admin', 'manager', 'agent', 'viewer'],
  
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
export const hasPermission = (role, permission) => {
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
 * Check if role can write (create/update/delete)
 * @param {string} role - User's role
 * @returns {boolean} - True if role can write
 */
export const canWrite = (role) => {
  return ['owner', 'admin', 'manager', 'agent'].includes(role);
};

/**
 * Check if role can only read (viewer)
 * @param {string} role - User's role
 * @returns {boolean} - True if role is read-only
 */
export const isReadOnly = (role) => {
  return role === 'viewer';
};

/**
 * Check if role can manage organization settings
 * @param {string} role - User's role
 * @returns {boolean} - True if role can manage organization
 */
export const canManageOrganization = (role) => {
  return hasPermission(role, 'MANAGE_ORGANIZATION');
};

/**
 * Check if role can manage team members
 * @param {string} role - User's role
 * @returns {boolean} - True if role can manage members
 */
export const canManageMembers = (role) => {
  return hasPermission(role, 'MANAGE_MEMBERS');
};

/**
 * Check if role can delete resources
 * @param {string} role - User's role
 * @returns {boolean} - True if role can delete
 */
export const canDelete = (role) => {
  return ['owner', 'admin', 'manager'].includes(role);
};

/**
 * Check if role can assign resources to others
 * @param {string} role - User's role
 * @returns {boolean} - True if role can assign
 */
export const canAssign = (role) => {
  return ['owner', 'admin', 'manager'].includes(role);
};

export default {
  hasPermission,
  canWrite,
  isReadOnly,
  canManageOrganization,
  canManageMembers,
  canDelete,
  canAssign,
  PERMISSIONS
};

