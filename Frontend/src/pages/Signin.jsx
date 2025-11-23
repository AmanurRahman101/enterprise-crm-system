import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = ApiService.getToken();
    const user = ApiService.getUser();
    
    if (token && user) {
      // User is already logged in - redirect to client portal
      navigate('/dashboard/client');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Call unified signin endpoint
      const response = await ApiService.signin(formData.email, formData.password);

      if (response.success && response.token) {
        toast.success('Signed in successfully!');

        // All users are unified - check if they have organizations
        const organizations = response.organizations || [];
        const currentOrganization = response.currentOrganization;

        if (currentOrganization) {
          // User has an organization - redirect to organization dashboard
          navigate('/dashboard/organization');
        } else if (organizations.length > 0) {
          // User has organizations but none selected, switch to first one
          try {
            await ApiService.switchOrganization(organizations[0].id);
            navigate('/dashboard/organization');
          } catch (error) {
            navigate('/dashboard/organization');
          }
        } else {
          // No organizations - user can access client portal OR create organization
          toast.success('Welcome! You can access your Client Portal or create an organization.');
          navigate('/dashboard/client'); // Redirect to client portal by default for new users
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Tawasol CRM</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Signin Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="john@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Create Account
              </Link>
            </p>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>✨ Unified Account:</strong> Sign in to access both Client Portal (your deals/issues) and Organizations (create/join teams).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;

