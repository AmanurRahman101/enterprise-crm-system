import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import companyService from '../../services/companyService';
import { Company, CompanyFilters } from '../../types/company';

const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CompanyFilters>({});

  const limit = 10;

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companyService.getCompanies(page, limit, filters);
      setCompanies(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load companies');
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
    setPage(1);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await companyService.deleteCompany(id);
      loadCompanies();
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

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error && companies.length === 0) {
    return (
      <div className="alert-danger">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Companies</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Manage your company database ({total} total)
          </p>
        </div>
        <button
          onClick={() => navigate('/companies/new')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Company
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies by name, industry, or location..."
                className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? 'bg-secondary-100' : ''
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Industry
                </label>
                <select
                  value={filters.industry || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, industry: e.target.value || undefined });
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Services">Services</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company Size
                </label>
                <select
                  value={filters.size || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, size: e.target.value || undefined });
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Sizes</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Companies Table */}
      {companies.length === 0 ? (
        <div className="card text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-semibold text-secondary-900">No companies</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Get started by creating your first company.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/companies/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Company
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Location</th>
                  <th>Contacts</th>
                  <th>Deals</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => navigate(`/companies/${company.id}`)}
                    className="cursor-pointer hover:bg-secondary-50"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(company.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-secondary-900">
                            {company.name}
                          </div>
                          {company.website && (
                            <div className="text-sm text-secondary-500">
                              {company.website}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {company.industry && (
                        <span className="badge-primary">{company.industry}</span>
                      )}
                    </td>
                    <td>
                      {company.size && (
                        <span className="text-sm text-secondary-600">
                          {company.size} employees
                        </span>
                      )}
                    </td>
                    <td>
                      {(company.city || company.country) && (
                        <span className="text-sm text-secondary-600">
                          {[company.city, company.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm font-medium text-secondary-900">
                        {company._count?.contacts || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-secondary-900">
                        {company._count?.deals || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies/${company.id}/edit`);
                          }}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id, company.name);
                          }}
                          className="p-2 text-secondary-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-secondary-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
                {total} companies
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompanyListPage;
