import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UsersIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import companyService from '../../services/companyService';
import { Company } from '../../types/company';

const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'activity'>(
    'overview'
  );

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getCompany(id!);
      setCompany(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load company');
      console.error('Error loading company:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCompany();
    }
  }, [id, loadCompany]);

  const handleDelete = async () => {
    if (!company) return;
    
    if (!window.confirm(`Are you sure you want to delete ${company.name}?`)) {
      return;
    }

    try {
      await companyService.deleteCompany(company.id);
      navigate('/companies');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading company...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="alert-danger">
        <p>{error || 'Company not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="h-24 w-24 rounded-xl object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
                {getInitials(company.name)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">{company.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                {company.industry && (
                  <span className="badge-primary">{company.industry}</span>
                )}
                {company.size && (
                  <span className="badge-secondary">{company.size} employees</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/companies')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={() => navigate(`/companies/${company.id}/edit`)}
              className="btn-primary flex items-center gap-2"
            >
              <PencilIcon className="h-5 w-5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'contacts', label: 'Contacts' },
            { key: 'deals', label: 'Deals' },
            { key: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Company Information */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Company Information
                  </h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.website && (
                      <div className="flex items-start gap-3">
                        <GlobeAltIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Website</div>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-start gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Email</div>
                          <a
                            href={`mailto:${company.email}`}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {company.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {company.phone && (
                      <div className="flex items-start gap-3">
                        <PhoneIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Phone</div>
                          <a
                            href={`tel:${company.phone}`}
                            className="text-secondary-900 hover:text-primary-600"
                          >
                            {company.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {(company.address || company.city || company.country) && (
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Address</div>
                          <div className="text-secondary-900">
                            {company.address && <div>{company.address}</div>}
                            <div>
                              {[company.city, company.country]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <div className="mt-6 pt-6 border-t border-secondary-200">
                      <div className="text-sm text-secondary-500 mb-2">Description</div>
                      <p className="text-secondary-900">{company.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <UsersIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary-900">
                          {company._count?.contacts || 0}
                        </div>
                        <div className="text-sm text-secondary-500">Contacts</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-success-100 rounded-lg">
                        <BanknotesIcon className="h-6 w-6 text-success-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary-900">
                          {company._count?.deals || 0}
                        </div>
                        <div className="text-sm text-secondary-500">Deals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Contacts</h2>
              </div>
              <div className="card-body">
                {company.contacts && company.contacts.length > 0 ? (
                  <div className="space-y-3">
                    {company.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-medium text-secondary-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.jobTitle && (
                            <div className="text-sm text-secondary-500">
                              {contact.jobTitle}
                            </div>
                          )}
                          {contact.email && (
                            <div className="text-sm text-secondary-500">{contact.email}</div>
                          )}
                        </div>
                        <button className="text-primary-600 hover:text-primary-700">
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-secondary-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                    <p>No contacts associated with this company yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Deals</h2>
              </div>
              <div className="card-body">
                {company.deals && company.deals.length > 0 ? (
                  <div className="space-y-3">
                    {company.deals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-medium text-secondary-900">{deal.title}</div>
                          <div className="text-sm text-secondary-500">
                            ${deal.value.toLocaleString()} • {deal.status}
                          </div>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700">
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-secondary-500">
                    <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                    <p>No deals associated with this company yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">
                  Recent Activity
                </h2>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-secondary-500">
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                  <p>Activity tracking coming soon</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-secondary-900 uppercase">
                Company Details
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-sm text-secondary-500">Created</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(company.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-secondary-500">Last Updated</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(company.updatedAt)}
                </div>
              </div>
              {company.industry && (
                <div>
                  <div className="text-sm text-secondary-500">Industry</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {company.industry}
                  </div>
                </div>
              )}
              {company.size && (
                <div>
                  <div className="text-sm text-secondary-500">Company Size</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {company.size} employees
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
