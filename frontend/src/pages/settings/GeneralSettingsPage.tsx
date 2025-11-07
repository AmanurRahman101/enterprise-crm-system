import { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  PhotoIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface TenantSettings {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  logo: string | null;
  settings: {
    currency: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  } | null;
}

const GeneralSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    logo: null,
    settings: {
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/me');
      const userData = response.data.data || response.data;
      
      // Get tenant info from user data
      if (userData.tenant) {
        setSettings({
          name: userData.tenant.name || '',
          email: userData.tenant.email || '',
          phone: userData.tenant.phone || '',
          timezone: userData.tenant.timezone || 'UTC',
          logo: userData.tenant.logo || null,
          settings: userData.tenant.settings || {
            currency: 'USD',
            language: 'en',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
          },
        });
      }
    } catch (err: any) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.split('.')[1];
      setSettings(prev => ({
        ...prev,
        settings: {
          ...prev.settings!,
          [settingKey]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show the file name
      // In production, upload to server/CDN
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          logo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Note: This endpoint needs to be created in the backend
      // For now, this is a placeholder
      await apiClient.put('/settings/general', settings);
      
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
  ];

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-secondary-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          General Settings
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="alert-success flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert-danger">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Company Information
              </h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Company Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
                placeholder="Acme Corporation"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Company Email <span className="text-danger-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
                placeholder="contact@company.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Company Logo"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-secondary-200 dark:border-secondary-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center border-2 border-dashed border-secondary-300 dark:border-secondary-600">
                    <PhotoIcon className="w-8 h-8 text-secondary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 cursor-pointer transition-colors"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Upload Logo
                  </label>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    PNG, JPG or SVG. Max size 2MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Regional Settings
              </h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Timezone <span className="text-danger-500">*</span>
              </label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <div className="flex items-center gap-2">
                  <LanguageIcon className="w-4 h-4" />
                  Language
                </div>
              </label>
              <select
                id="language"
                value={settings.settings?.language || 'en'}
                onChange={(e) => handleChange('settings.language', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Date Format
              </label>
              <select
                id="dateFormat"
                value={settings.settings?.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => handleChange('settings.dateFormat', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              >
                {dateFormats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                Preview: {new Date().toLocaleDateString('en-US')}
              </p>
            </div>

            {/* Time Format */}
            <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Time Format
              </label>
              <select
                id="timeFormat"
                value={settings.settings?.timeFormat || '12h'}
                onChange={(e) => handleChange('settings.timeFormat', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              >
                <option value="12h">12-hour (2:30 PM)</option>
                <option value="24h">24-hour (14:30)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Currency Settings
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Default Currency <span className="text-danger-500">*</span>
              </label>
              <select
                id="currency"
                value={settings.settings?.currency || 'USD'}
                onChange={(e) => handleChange('settings.currency', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                This will be used for all deals and revenue calculations
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={fetchSettings}
            className="btn-secondary"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Info Notice */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="card-body">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Note:</strong> Changes to timezone and currency settings will affect how data is displayed throughout the system. Existing records will not be modified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
