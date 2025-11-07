import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ClockIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { User, UserRole } from '../../types';
import api from '../../services/api';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchUser(id);
      fetchUserActivity(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data.data || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}/activity`);
      setStats(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      const endpoint = user.isActive ? 'deactivate' : 'reactivate';
      await api.post(`/users/${id}/${endpoint}`);
      if (id) fetchUser(id);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${user.isActive ? 'deactivate' : 'activate'} user`);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case UserRole.MANAGER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case UserRole.SALES:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case UserRole.SUPPORT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <ShieldCheckIcon className="h-5 w-5" />;
      case UserRole.MANAGER:
      case UserRole.SALES:
      case UserRole.SUPPORT:
        return <UserGroupIcon className="h-5 w-5" />;
      default:
        return <UserCircleIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error || 'User not found'}
        </div>
        <button
          onClick={() => navigate('/users')}
          className="mt-4 inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Users
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {user.avatar ? (
              <img
                className="h-20 w-20 rounded-full"
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium text-2xl">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{user.role}</span>
                </span>
                {user.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    <XMarkIcon className="h-3 w-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/users/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                user.isActive
                  ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              {user.isActive ? (
                <>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <dl className="space-y-4">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</dd>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.phone}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Activity Statistics */}
          {stats && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Activity Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Activities</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.totalActivities || 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">This Week</p>
                  <p className="mt-2 text-3xl font-bold text-green-900 dark:text-green-300">
                    {stats.activitiesThisWeek || 0}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">This Month</p>
                  <p className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.activitiesThisMonth || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Last Login</p>
                  <p className="mt-2 text-sm font-medium text-yellow-900 dark:text-yellow-300">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assignments */}
          {user._count && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Assigned Items
              </h2>
              <div className="space-y-3">
                <Link
                  to={`/contacts?assignee=${id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Contacts</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {user._count.assignedContacts || 0}
                  </span>
                </Link>
                <Link
                  to={`/deals?assignee=${id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Deals</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {user._count.assignedDeals || 0}
                  </span>
                </Link>
                <Link
                  to={`/tasks?assignee=${id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Tasks</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {user._count.assignedTasks || 0}
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  {user.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      Inactive
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(user.lastLoginAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(user.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
