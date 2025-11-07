import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BanknotesIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import dealService from '../../services/dealService';
import { dealStageService, DealStage } from '../../services/dealStageService';
import { Deal, DealFilters, DEAL_PRIORITIES } from '../../types/deal';

const DealListPage: React.FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DealFilters>({});

  const limit = 10;

  // Load stages from API
  const loadStages = useCallback(async () => {
    try {
      const response = await dealStageService.getStages();
      const stagesData = response.data || [];
      stagesData.sort((a, b) => a.order - b.order);
      setStages(stagesData);
    } catch (err) {
      console.error('Error loading stages:', err);
    }
  }, []);

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dealService.getDeals(page, limit, filters);
      setDeals(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deals');
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await dealService.deleteDeal(id);
      loadDeals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete deal');
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getStageColorFromHex = (hexColor: string) => {
    const colorMap: Record<string, string> = {
      '#1976d2': 'primary',
      '#9c27b0': 'secondary',
      '#2e7d32': 'success',
      '#ed6c02': 'warning',
      '#d32f2f': 'danger',
      '#0288d1': 'info',
      '#616161': 'secondary',
    };
    return colorMap[hexColor.toLowerCase()] || 'secondary';
  };

  const getPriorityColor = (priority: string) => {
    const config = DEAL_PRIORITIES.find((p) => p.value === priority);
    return config?.color || 'secondary';
  };

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error && deals.length === 0) {
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
          <h1 className="text-2xl font-bold text-secondary-900">Deals</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Manage your sales pipeline ({total} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex items-center gap-2 bg-primary-50 text-primary-700 border-primary-200"
            title="List View (Active)"
          >
            <ListBulletIcon className="h-5 w-5" />
            List
          </button>
          <button
            onClick={() => navigate('/deals/kanban')}
            className="btn-secondary flex items-center gap-2"
            title="Kanban View"
          >
            <Squares2X2Icon className="h-5 w-5" />
            Kanban
          </button>
          <button
            onClick={() => navigate('/deals/new')}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Deal
          </button>
        </div>
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
                placeholder="Search deals by title, contact, or company..."
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Stage
                </label>
                <select
                  value={filters.stageId || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, stageId: e.target.value || undefined });
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Stages</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, priority: e.target.value as any || undefined });
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Priorities</option>
                  {DEAL_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  value={filters.minValue || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, minValue: e.target.value ? Number(e.target.value) : undefined });
                    setPage(1);
                  }}
                  placeholder="0"
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  value={filters.maxValue || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, maxValue: e.target.value ? Number(e.target.value) : undefined });
                    setPage(1);
                  }}
                  placeholder="1000000"
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                  setPage(1);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deals Table */}
      {deals.length === 0 ? (
        <div className="card text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-semibold text-secondary-900">No deals</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Get started by creating your first deal.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/deals/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Deal
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Contact</th>
                  <th>Value</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Probability</th>
                  <th>Expected Close</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(deals) && deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="cursor-pointer hover:bg-secondary-50"
                  >
                    <td>
                      <div className="font-medium text-secondary-900">{deal.title}</div>
                      {deal.company && (
                        <div className="text-sm text-secondary-500">{deal.company.name}</div>
                      )}
                    </td>
                    <td>
                      {deal.contact && (
                        <div>
                          <div className="text-sm text-secondary-900">
                            {deal.contact.firstName} {deal.contact.lastName}
                          </div>
                          {deal.contact.email && (
                            <div className="text-sm text-secondary-500">{deal.contact.email}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-medium text-secondary-900">
                        {formatCurrency(deal.value, deal.currency)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-${getStageColorFromHex(deal.stage.color)}`}>
                        {deal.stage.name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-${getPriorityColor(deal.priority)}`}>
                        {deal.priority}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary-600 h-full"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-sm text-secondary-600 w-10">{deal.probability}%</span>
                      </div>
                    </td>
                    <td>
                      {deal.expectedCloseDate ? (
                        <span className="text-sm text-secondary-600">
                          {new Date(deal.expectedCloseDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary-400">Not set</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deals/${deal.id}/edit`);
                          }}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.id, deal.title);
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
                {total} deals
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

export default DealListPage;
