import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  subdomain: string | null;
  createdAt: string;
}

interface DomainFormData {
  subdomain: string;
  domain: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DomainFormData>();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/organization', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const org = response.data.organization;
      setOrganization(org);
      
      // Set form values
      if (org.subdomain) setValue('subdomain', org.subdomain);
      if (org.domain) setValue('domain', org.domain);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: DomainFormData) => {
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3000/api/organization/domain',
        {
          subdomain: data.subdomain || null,
          domain: data.domain || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Domain settings updated successfully! 🎉');
      fetchOrganization();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update domain settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="card text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access organization settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Organization Settings ⚙️</h1>
        <p className="text-lg text-gray-600">Manage your organization's domain and branding</p>
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

      {/* Organization Info */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Organization Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Organization Name</label>
            <p className="text-lg font-semibold text-gray-800">{organization?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Organization ID</label>
            <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              {organization?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Domain Settings */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Custom Domain Settings 🌐</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subdomain */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Subdomain (Free)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="your-company"
                className={`input-field flex-1 ${errors.subdomain ? 'border-red-500' : ''}`}
                {...register('subdomain', {
                  pattern: {
                    value: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
                    message: 'Only lowercase letters, numbers, and hyphens allowed',
                  },
                })}
              />
              <span className="text-gray-600 font-semibold">.tawasol.app</span>
            </div>
            {errors.subdomain && (
              <p className="mt-2 text-sm text-red-600">{errors.subdomain.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              📍 Your CRM will be accessible at: <strong>{organization?.subdomain || 'your-company'}.tawasol.app</strong>
            </p>
          </div>

          {/* Custom Domain */}
          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Custom Domain (Optional)
            </label>
            <input
              type="text"
              placeholder="crm.yourcompany.com"
              className={`input-field ${errors.domain ? 'border-red-500' : ''}`}
              {...register('domain', {
                pattern: {
                  value: /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
                  message: 'Invalid domain format',
                },
              })}
            />
            {errors.domain && (
              <p className="mt-2 text-sm text-red-600">{errors.domain.message}</p>
            )}
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-2">📝 Custom Domain Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                <li>Add a <strong>CNAME record</strong> in your DNS settings</li>
                <li>Point it to: <code className="bg-blue-100 px-2 py-1 rounded">tawasol.app</code></li>
                <li>Wait for DNS propagation (5-30 minutes)</li>
                <li>Enter your domain above and save</li>
              </ol>
              <p className="text-xs text-blue-700 mt-3">
                Example: If your domain is <strong>crm.company.com</strong>, create a CNAME record pointing to <strong>tawasol.app</strong>
              </p>
            </div>
          </div>

          {/* Current Access URLs */}
          {(organization?.subdomain || organization?.domain) && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3">🔗 Your Access URLs:</h3>
              <div className="space-y-2">
                {organization.subdomain && (
                  <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <a
                      href={`http://${organization.subdomain}.tawasol.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 font-semibold hover:underline"
                    >
                      {organization.subdomain}.tawasol.app
                    </a>
                  </div>
                )}
                {organization.domain && (
                  <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <a
                      href={`http://${organization.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 font-semibold hover:underline"
                    >
                      {organization.domain}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : '💾 Save Domain Settings'}
          </button>
        </form>
      </div>

      {/* Help Section */}
      <div className="card bg-gradient-to-br from-primary-50 to-gray-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Need Help?</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Subdomain:</strong> Free and instant! Your team can access the CRM at yourcompany.tawasol.app
          </p>
          <p>
            <strong>Custom Domain:</strong> Use your own domain (e.g., crm.yourcompany.com) for a professional look
          </p>
          <p>
            <strong>DNS Setup:</strong> Contact your IT team or domain registrar (GoDaddy, Namecheap, etc.) to add the CNAME record
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
