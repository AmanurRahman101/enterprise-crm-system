import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState<'business' | 'customer'>('business');
  const [formData, setFormData] = useState({
    tenant: 'acme',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(
        {
          email: formData.email,
          password: formData.password,
          isCustomer: mode === 'customer',
        },
        mode === 'business' ? formData.tenant : undefined
      );
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            تواصل <span className="text-primary-600 dark:text-primary-400">CRM</span>
          </h1>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Intelligent System of Action</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
          <div className="px-8 py-10">
            <h2 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
              Sign in to your account
            </h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex rounded-lg border border-secondary-300 dark:border-secondary-600 p-1 bg-secondary-50 dark:bg-secondary-900">
                <button
                  type="button"
                  onClick={() => setMode('business')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === 'business'
                      ? 'bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Business
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('customer')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === 'customer'
                      ? 'bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer
                  </div>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert-danger mb-6">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-danger-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tenant Field - Only for Business Mode */}
              {mode === 'business' && (
                <div className="input-group">
                  <label htmlFor="tenant">
                    Organization / Tenant
                  </label>
                  <input
                    id="tenant"
                    name="tenant"
                    type="text"
                    required
                    value={formData.tenant}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors dark:bg-secondary-800 dark:text-secondary-100"
                    placeholder="Enter your organization name"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="input-group">
                <label htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors dark:bg-secondary-800 dark:text-secondary-100"
                  placeholder="your.email@company.com"
                />
              </div>

              {/* Password Field */}
              <div className="input-group">
                <label htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 pr-10 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors dark:bg-secondary-800 dark:text-secondary-100"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300 mb-0">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials - Only for Business Mode */}
          {mode === 'business' && (
            <div className="px-8 py-5 bg-secondary-50 dark:bg-secondary-900/50 border-t border-secondary-200 dark:border-secondary-700 rounded-b-lg">
              <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-2 font-medium">Demo Credentials:</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center">
                  <span className="text-secondary-500 dark:text-secondary-400 w-24">Tenant:</span>
                  <code className="bg-white dark:bg-secondary-800 px-2 py-1 rounded border border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 font-mono">acme</code>
                </div>
                <div className="flex items-center">
                  <span className="text-secondary-500 dark:text-secondary-400 w-24">Email:</span>
                  <code className="bg-white dark:bg-secondary-800 px-2 py-1 rounded border border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 font-mono">john.sales@tawasol.com</code>
                </div>
                <div className="flex items-center">
                  <span className="text-secondary-500 dark:text-secondary-400 w-24">Password:</span>
                  <code className="bg-white dark:bg-secondary-800 px-2 py-1 rounded border border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 font-mono">Password123!</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
