import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import dealService from '../../services/dealService';
import { Deal, DEAL_PRIORITIES } from '../../types/deal';

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'tasks' | 'notes'>(
    'overview'
  );

  const loadDeal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dealService.getDeal(id!);
      setDeal(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deal');
      console.error('Error loading deal:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadDeal();
    }
  }, [id, loadDeal]);

  const handleDelete = async () => {
    if (!deal) return;
    
    if (!window.confirm(`Are you sure you want to delete "${deal.title}"?`)) {
      return;
    }

    try {
      await dealService.deleteDeal(deal.id);
      navigate('/deals');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getPriorityConfig = (priority: string) => {
    return DEAL_PRIORITIES.find((p) => p.value === priority) || DEAL_PRIORITIES[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="alert-danger">
        <p>{error || 'Deal not found'}</p>
      </div>
    );
  }

  const priorityConfig = getPriorityConfig(deal.priority);

  return (
    <div>
      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-success-500 to-success-700 rounded-xl">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-secondary-900">{deal.title}</h1>
                <div className="mt-1 text-2xl font-bold text-success-600">
                  {formatCurrency(deal.value, deal.currency)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge-${getStageColorFromHex(deal.stage.color)}`}>
                {deal.stage.name}
              </span>
              <span className={`badge-${priorityConfig.color}`}>
                {priorityConfig.label} Priority
              </span>
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <ChartBarIcon className="h-4 w-4" />
                {deal.probability}% Win Probability
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/deals')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={() => navigate(`/deals/${deal.id}/edit`)}
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
            { key: 'activity', label: 'Activity' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'notes', label: 'Notes' },
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
              {/* Deal Information */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Deal Information
                  </h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-secondary-500">Contact</div>
                        {deal.contact && (
                          <button
                            onClick={() => navigate(`/contacts/${deal.contact!.id}`)}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {deal.contact.firstName} {deal.contact.lastName}
                          </button>
                        )}
                      </div>
                    </div>

                    {deal.company && (
                      <div className="flex items-start gap-3">
                        <BuildingOfficeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Company</div>
                          <button
                            onClick={() => navigate(`/companies/${deal.company!.id}`)}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {deal.company.name}
                          </button>
                        </div>
                      </div>
                    )}

                    {deal.expectedCloseDate && (
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Expected Close Date</div>
                          <div className="text-secondary-900">
                            {formatDate(deal.expectedCloseDate)}
                          </div>
                        </div>
                      </div>
                    )}

                    {deal.source && (
                      <div className="flex items-start gap-3">
                        <BellAlertIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Source</div>
                          <div className="text-secondary-900">{deal.source}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {deal.description && (
                    <div className="mt-6 pt-6 border-t border-secondary-200">
                      <div className="text-sm text-secondary-500 mb-2">Description</div>
                      <p className="text-secondary-900">{deal.description}</p>
                    </div>
                  )}

                  {deal.stage.isLost && deal.lostReason && (
                    <div className="mt-6 pt-6 border-t border-secondary-200">
                      <div className="text-sm text-secondary-500 mb-2">Lost Reason</div>
                      <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-danger-900">{deal.lostReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Deal Progress
                  </h2>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-secondary-600">Win Probability</span>
                      <span className="font-medium text-secondary-900">{deal.probability}%</span>
                    </div>
                    <div className="bg-secondary-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary-600 h-full transition-all duration-300"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-secondary-50 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">
                        {deal._count?.tasks || 0}
                      </div>
                      <div className="text-sm text-secondary-600">Tasks</div>
                    </div>
                    <div className="text-center p-4 bg-secondary-50 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">
                        {deal._count?.activities || 0}
                      </div>
                      <div className="text-sm text-secondary-600">Activities</div>
                    </div>
                    <div className="text-center p-4 bg-secondary-50 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">
                        {deal._count?.notes || 0}
                      </div>
                      <div className="text-sm text-secondary-600">Notes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Activity Timeline</h2>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-secondary-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                  <p>Activity tracking coming soon</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Tasks</h2>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-secondary-500">
                  <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                  <p>Task management coming soon</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Notes</h2>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-secondary-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                  <p>Notes coming soon</p>
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
                Deal Details
              </h3>
            </div>
            <div className="card-body space-y-4">
              {deal.owner && (
                <div>
                  <div className="text-sm text-secondary-500">Created by</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {deal.owner.firstName} {deal.owner.lastName}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-secondary-500">Created</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(deal.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-secondary-500">Last Updated</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(deal.updatedAt)}
                </div>
              </div>
              {deal.closedAt && (
                <div>
                  <div className="text-sm text-secondary-500">Closed At</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(deal.closedAt)}
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

export default DealDetailPage;
