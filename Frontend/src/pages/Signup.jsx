import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^[0-9+\-() ]{7,20}$/;

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
    // userType removed - all users are unified and can access both client portal and organizations
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
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters.';
    }
    if (!formData.email || !EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!PASSWORD_REGEX.test(formData.password)) {
      nextErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
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
      // Call unified signup endpoint (userType removed - all users are unified)
      const response = await ApiService.signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone || null
      );

      if (response.success) {
        toast.success('Account created successfully! Please sign in.');
        navigate('/auth/signin');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create account');
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
          <p className="text-gray-300">Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-2xl shadow-2xl shadow-teal-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Banner */}
            <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-teal-300">
                <strong>✨ Unified Account:</strong> Create an account to access both Client Portal (view your deals/issues) and Organizations (create/join teams).
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.fullName ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="John Doe"
                autoComplete="name"
                aria-invalid={errors.fullName ? 'true' : 'false'}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
            </div>

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
                className={`w-full px-4 py-2 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.email ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="john@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.phone ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="+1234567890"
                autoComplete="tel"
                aria-invalid={errors.phone ? 'true' : 'false'}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.password ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-900/80 border text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                  errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700'
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:shadow-2xl hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/auth/signin" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
