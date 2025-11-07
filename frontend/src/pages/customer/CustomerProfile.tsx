import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const CustomerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // TODO: Call API to update profile
      // await profileService.updateProfile(formData);
      
      // Mock update for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Profile</h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Manage your personal information
        </p>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <UserCircleIcon className="h-20 w-20 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-primary-100">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-800/50 text-primary-100 mt-2 backdrop-blur-sm">
                Customer Account
              </span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="card-body">
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-400 border border-success-200 dark:border-success-800'
                  : 'bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-400 border border-danger-200 dark:border-danger-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                disabled
                className="input opacity-50 cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Account Information
          </h3>
        </div>
        <div className="card-body">
          <dl className="space-y-4">
            <div className="flex justify-between items-start">
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Account Type</dt>
              <dd className="text-sm text-secondary-900 dark:text-secondary-100 font-medium">Customer</dd>
            </div>
            <div className="flex justify-between items-start border-t border-secondary-200 dark:border-secondary-700 pt-4">
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Member Since</dt>
              <dd className="text-sm text-secondary-900 dark:text-secondary-100">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </dd>
            </div>
            <div className="flex justify-between items-start border-t border-secondary-200 dark:border-secondary-700 pt-4">
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">User ID</dt>
              <dd className="text-sm text-secondary-900 dark:text-secondary-100 font-mono">{user?.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
