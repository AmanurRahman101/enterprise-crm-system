import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ClockIcon,
  TicketIcon,
  TagIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import ticketService from '../../services/ticketService';
import { Ticket, TICKET_STATUSES, TICKET_PRIORITIES } from '../../types/ticket';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'notes'>('overview');

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getTicket(id!);
      setTicket(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket');
      console.error('Error loading ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id, loadTicket]);

  const handleDelete = async () => {
    if (!ticket) return;
    
    if (!window.confirm(`Are you sure you want to delete ticket #${ticket.ticketNumber}?`)) {
      return;
    }

    try {
      await ticketService.deleteTicket(ticket.id);
      navigate('/tickets');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    return TICKET_STATUSES.find((s) => s.value === status) || TICKET_STATUSES[0];
  };

  const getPriorityConfig = (priority: string) => {
    return TICKET_PRIORITIES.find((p) => p.value === priority) || TICKET_PRIORITIES[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="alert-danger">
        <p>{error || 'Ticket not found'}</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <div>
      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl">
                <TicketIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-secondary-500">
                    Ticket #{ticket.ticketNumber}
                  </span>
                  <span className={`badge-${statusConfig.color}`}>{statusConfig.label}</span>
                  <span className={`badge-${priorityConfig.color}`}>
                    {priorityConfig.label} Priority
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-secondary-900 mt-1">{ticket.subject}</h1>
              </div>
            </div>
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-secondary-400" />
                {ticket.tags.map((tag, index) => (
                  <span key={index} className="badge-secondary text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/tickets')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
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
              {/* Ticket Description */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">Description</h2>
                </div>
                <div className="card-body">
                  <p className="text-secondary-900 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Contact & Assignee */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Ticket Information
                  </h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-secondary-500">Contact</div>
                        {ticket.contact && (
                          <button
                            onClick={() => navigate(`/contacts/${ticket.contact!.id}`)}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {ticket.contact.firstName} {ticket.contact.lastName}
                          </button>
                        )}
                        {ticket.contact?.email && (
                          <div className="text-sm text-secondary-500">{ticket.contact.email}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-secondary-500">Assignee</div>
                        {ticket.assignee ? (
                          <div className="text-secondary-900">
                            {ticket.assignee.firstName} {ticket.assignee.lastName}
                          </div>
                        ) : (
                          <span className="text-secondary-400">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {ticket.category && (
                      <div className="flex items-start gap-3">
                        <TagIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">Category</div>
                          <div className="text-secondary-900">{ticket.category}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <ClockIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-secondary-500">Source</div>
                        <div className="text-secondary-900">{ticket.source}</div>
                      </div>
                    </div>

                    {ticket.slaDeadline && (
                      <div className="flex items-start gap-3">
                        <ClockIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-secondary-500">SLA Deadline</div>
                          <div className="text-secondary-900">
                            {formatDate(ticket.slaDeadline)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary-900">
                          {ticket._count?.activities || 0}
                        </div>
                        <div className="text-sm text-secondary-500">Activities</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-success-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-success-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary-900">
                          {ticket._count?.notes || 0}
                        </div>
                        <div className="text-sm text-secondary-500">Notes</div>
                      </div>
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
                Ticket Timeline
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-sm text-secondary-500">Created</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-secondary-500">Last Updated</div>
                <div className="mt-1 text-sm text-secondary-900">
                  {formatDate(ticket.updatedAt)}
                </div>
              </div>
              {ticket.firstResponseAt && (
                <div>
                  <div className="text-sm text-secondary-500">First Response</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(ticket.firstResponseAt)}
                  </div>
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <div className="text-sm text-secondary-500">Resolved</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(ticket.resolvedAt)}
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <div className="text-sm text-secondary-500">Closed</div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(ticket.closedAt)}
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

export default TicketDetailPage;
