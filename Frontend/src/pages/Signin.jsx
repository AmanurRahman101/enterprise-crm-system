import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
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

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.email || !EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg mb-2">Tawassul CRM</h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>

        {/* Signin Form */}
        <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-2xl shadow-2xl shadow-teal-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.email ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="john@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password *
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
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
                className={`w-full px-4 py-3 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.password ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:shadow-2xl hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
            <p className="text-xs text-teal-300">
              <strong>✨ Unified Account:</strong> Sign in to access both Client Portal (your deals/issues) and Organizations (create/join teams).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
