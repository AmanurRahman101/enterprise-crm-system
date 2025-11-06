import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface InviteFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: InviteFormData) => {
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/users/invite',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Invite Response:', response.data); // Debug log

      // Show the invitation link
      if (response.data.invitationLink) {
        setInvitationLink(response.data.invitationLink);
        setSuccessMessage(`✅ Invitation created for ${data.email}!`);
        reset();
      } else {
        setError('Failed to generate invitation link');
        console.error('No invitationLink in response:', response.data);
      }
      // Keep form open so they can see the invitation link
    } catch (err: any) {
      console.error('Invite Error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to invite team member');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage('Team member removed successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove team member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-primary-100 text-primary-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Team Members 👥</h1>
          <p className="text-lg text-gray-600">Manage your organization's users and roles</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="btn-accent"
        >
          {showInviteForm ? 'Cancel' : '+ Invite Team Member'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Invitation Link Display - Shows at top when generated */}
      {invitationLink && (
        <div className="mb-8 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4 mb-5">
            <div className="text-5xl">🎉</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-primary-900 mb-2">Invitation Link Generated!</h3>
              <p className="text-gray-700 text-sm">
                Copy this link and share it with the team member. They'll use it to set their password and join your organization.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border-2 border-primary-200">
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              Invitation Link (Click to Copy)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={invitationLink}
                readOnly
                onClick={(e) => {
                  e.currentTarget.select();
                  navigator.clipboard.writeText(invitationLink);
                  alert('✅ Link copied to clipboard!');
                }}
                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-mono text-sm cursor-pointer hover:bg-gray-100 transition-colors"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invitationLink);
                  alert('✅ Link copied to clipboard!');
                }}
                className="btn-accent whitespace-nowrap"
              >
                📋 Copy Link
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="text-amber-600">⏰</span>
            <p className="text-gray-600">
              <strong>Expires in 7 days</strong> • In production, this would be sent automatically via email.
            </p>
          </div>

          <button
            onClick={() => {
              setInvitationLink('');
              setSuccessMessage('');
              setShowInviteForm(false);
            }}
            className="mt-5 btn-secondary w-full"
          >
            ✓ Done - Close Invitation
          </button>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && !invitationLink && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Invite New Team Member</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                  {...register('firstName', { required: 'First name is required' })}
                />
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                  {...register('lastName', { required: 'Last name is required' })}
                />
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                📧 An invitation link will be generated for this email
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role *</label>
              <select
                className={`input-field ${errors.role ? 'border-red-500' : ''}`}
                {...register('role', { required: 'Please select a role' })}
              >
                <option value="">Select a role...</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                🔗 Generate Invitation Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInvitationLink('');
                  reset();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h2>

        {isLoading ? (
          <p className="text-gray-600 text-center py-8">Loading team members...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No team members yet. Invite someone to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Email</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Role</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Joined</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
