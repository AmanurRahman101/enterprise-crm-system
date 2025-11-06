import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface InvitationData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationName: string;
  expiresAt: string;
}

interface AcceptFormData {
  password: string;
  confirmPassword: string;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptFormData>();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/users/invitation/${token}`);
      setInvitation(response.data.invitation);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AcceptFormData) => {
    setError('');
    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:3000/api/users/accept-invitation', {
        token,
        password: data.password,
      });

      alert('Account created successfully! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-primary-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-primary-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-primary-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-10 py-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="Tawasol CRM Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">Welcome to Tawasol CRM! 👋</h1>
            <p className="text-center text-primary-100">
              You've been invited to join <strong>{invitation?.organizationName}</strong>
            </p>
          </div>

          {/* Form */}
          <div className="px-10 py-8">
            <div className="bg-primary-50 rounded-xl p-6 mb-8">
              <h2 className="font-bold text-primary-800 mb-3">Invitation Details</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-gray-700">Name:</span>{' '}
                  <span className="text-gray-800">
                    {invitation?.firstName} {invitation?.lastName}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Email:</span>{' '}
                  <span className="text-gray-800">{invitation?.email}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Role:</span>{' '}
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold text-xs">
                    {invitation?.role}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Expires:</span>{' '}
                  <span className="text-gray-800">
                    {invitation?.expiresAt
                      ? new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  Create Password *
                </label>
                <input
                  id="password"
                  type="password"
                  className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-600">
                  Choose a strong password with at least 8 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : '🚀 Accept Invitation & Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-primary-700 font-bold hover:text-primary-800">
                Log in here
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
