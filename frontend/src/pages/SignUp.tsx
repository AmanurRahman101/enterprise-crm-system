import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface SignUpFormData {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Call the register endpoint
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        organizationName: data.organizationName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      // Save token and user data
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/dashboard');
      window.location.reload(); // Refresh to update auth context
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl shadow-2xl">
        <div className="text-center mb-10">
          <img 
            src="/logo.png" 
            alt="Tawasol CRM Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Create Your Account</h1>
          <p className="text-lg text-gray-600">Start managing your customer relationships today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label htmlFor="organizationName" className="block text-sm font-bold text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              id="organizationName"
              type="text"
              className={`input-field ${errors.organizationName ? 'border-red-500' : ''}`}
              placeholder="Acme Corporation"
              {...register('organizationName', {
                required: 'Company name is required',
                minLength: {
                  value: 2,
                  message: 'Company name must be at least 2 characters',
                },
              })}
            />
            {errors.organizationName && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.organizationName.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="John"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Doe"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              placeholder="john@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Password *
              </label>
              <input
                id="password"
                type="password"
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Min. 6 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl text-sm shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 hover:text-primary-800 font-bold transition-colors">
              Sign in now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
