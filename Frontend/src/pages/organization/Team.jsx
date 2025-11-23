import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

// Click outside to close dropdown
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

// Role Badge Component
const RoleBadge = ({ role }) => {
  const roleColors = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-red-100 text-red-800 border-red-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    agent: 'bg-green-100 text-green-800 border-green-200',
    viewer: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${roleColors[role] || roleColors.viewer}`}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
};

// Member Card Component
const MemberCard = ({ member, currentUserId, onEditRole, onRemove, canManage }) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);
  useClickOutside(actionsRef, () => setShowActions(false));

  const isCurrentUser = parseInt(member.userId) === parseInt(currentUserId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-bold text-lg">
                {member.fullName?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.fullName || member.email}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </h3>
              <p className="text-sm text-gray-600 truncate">{member.email}</p>
              {member.phone && (
                <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-3">
            <RoleBadge role={member.role} />
            <span className="text-xs text-gray-500">
              Joined {new Date(member.joinedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {canManage && !isCurrentUser && (
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    onEditRole(member);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Role
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${member.fullName || member.email} from this organization?`)) {
                      onRemove(member.userId);
                    }
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Member
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add Member Modal
const AddMemberModal = ({ isOpen, onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'owner', label: 'Owner', description: 'Full access, can manage all members' },
    { value: 'admin', label: 'Admin', description: 'Can manage members and organization settings' },
    { value: 'manager', label: 'Manager', description: 'Can manage deals, contacts, and issues' },
    { value: 'agent', label: 'Agent', description: 'Can create and manage deals and contacts' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to organization data' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      await onAdd(email.trim(), role);
      setEmail('');
      setRole('agent');
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              The user must have an account in the system. They will be invited to join this organization.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} - {r.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Role Modal
const EditRoleModal = ({ isOpen, onClose, member, onUpdate }) => {
  const [role, setRole] = useState(member?.role || 'agent');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'owner', label: 'Owner', description: 'Full access, can manage all members' },
    { value: 'admin', label: 'Admin', description: 'Can manage members and organization settings' },
    { value: 'manager', label: 'Manager', description: 'Can manage deals, contacts, and issues' },
    { value: 'agent', label: 'Agent', description: 'Can create and manage deals and contacts' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to organization data' }
  ];

  useEffect(() => {
    if (member) {
      setRole(member.role || 'agent');
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(member.userId, role);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Role - {member.fullName || member.email}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} - {r.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Team = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg, setCurrentOrg] = useState(() => ApiService.getCurrentOrganization());
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user || !currentOrg) {
      toast.error('Please sign in and select an organization');
      navigate('/dashboard/organization');
      return;
    }

    // Check if user has permission to manage members (owner/admin)
    const userRole = currentOrg.role;
    setCanManage(['owner', 'admin'].includes(userRole));

    loadMembers();
  }, [navigate, user, currentOrg?.id]);

  // Listen for organization changes
  useEffect(() => {
    const handleOrganizationChange = (event) => {
      const newOrg = event.detail || ApiService.getCurrentOrganization();
      if (newOrg) {
        setCurrentOrg(newOrg);
      }
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);
    window.addEventListener('organizationRefresh', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
      window.removeEventListener('organizationRefresh', handleOrganizationChange);
    };
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getOrganizationMembers(currentOrg.id);
      if (response.success) {
        setMembers(response.members || []);
      } else {
        toast.error(response.message || 'Failed to load team members');
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error(error.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (email, role) => {
    try {
      const response = await ApiService.addMemberToOrganization(currentOrg.id, email, role);
      if (response.success) {
        toast.success(`User ${email} added to organization successfully`);
        loadMembers();
      } else {
        toast.error(response.message || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      const response = await ApiService.updateMemberRole(currentOrg.id, userId, role);
      if (response.success) {
        toast.success('Member role updated successfully');
        loadMembers();
      } else {
        toast.error(response.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const response = await ApiService.removeMemberFromOrganization(currentOrg.id, userId);
      if (response.success) {
        toast.success('Member removed successfully');
        loadMembers();
      } else {
        toast.error(response.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  // Group members by role for better organization
  const membersByRole = {
    owner: members.filter(m => m.role === 'owner'),
    admin: members.filter(m => m.role === 'admin'),
    manager: members.filter(m => m.role === 'manager'),
    agent: members.filter(m => m.role === 'agent'),
    viewer: members.filter(m => m.role === 'viewer')
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your organization's team members and their access levels
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Members List */}
            {members.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-600 mb-4">Start by adding members to your organization</p>
                {canManage && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Owners */}
                {membersByRole.owner.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Owners</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersByRole.owner.map((member) => (
                        <MemberCard
                          key={member.userId}
                          member={member}
                          currentUserId={user.id}
                          onEditRole={setEditingMember}
                          onRemove={handleRemoveMember}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Admins */}
                {membersByRole.admin.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Admins</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersByRole.admin.map((member) => (
                        <MemberCard
                          key={member.userId}
                          member={member}
                          currentUserId={user.id}
                          onEditRole={setEditingMember}
                          onRemove={handleRemoveMember}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Managers */}
                {membersByRole.manager.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Managers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersByRole.manager.map((member) => (
                        <MemberCard
                          key={member.userId}
                          member={member}
                          currentUserId={user.id}
                          onEditRole={setEditingMember}
                          onRemove={handleRemoveMember}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Agents */}
                {membersByRole.agent.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Agents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersByRole.agent.map((member) => (
                        <MemberCard
                          key={member.userId}
                          member={member}
                          currentUserId={user.id}
                          onEditRole={setEditingMember}
                          onRemove={handleRemoveMember}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Viewers */}
                {membersByRole.viewer.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Viewers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersByRole.viewer.map((member) => (
                        <MemberCard
                          key={member.userId}
                          member={member}
                          currentUserId={user.id}
                          onEditRole={setEditingMember}
                          onRemove={handleRemoveMember}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMember}
      />
      <EditRoleModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onUpdate={handleUpdateRole}
      />
    </div>
  );
};

export default Team;

