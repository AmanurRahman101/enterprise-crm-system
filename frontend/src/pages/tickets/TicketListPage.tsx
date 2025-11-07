import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TicketIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import ticketService from '../../services/ticketService';
import { Ticket, TicketFilters, TICKET_STATUSES, TICKET_PRIORITIES } from '../../types/ticket';

const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});

  const limit = 10;

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getTickets(page, limit, filters);
      setTickets(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tickets');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
    setPage(1);
  };

  const handleDelete = async (id: string, subject: string) => {
    if (!window.confirm(`Are you sure you want to delete ticket "${subject}"?`)) {
      return;
    }

    try {
      await ticketService.deleteTicket(id);
      loadTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const getStatusColor = (status: string) => {
    const config = TICKET_STATUSES.find((s) => s.value === status);
    return config?.color || 'secondary';
  };

  const getPriorityColor = (priority: string) => {
    const config = TICKET_PRIORITIES.find((p) => p.value === priority);
    return config?.color || 'secondary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
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
          <h1 className="text-2xl font-bold text-secondary-900">Tickets</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Manage support tickets and customer issues ({total} total)
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Ticket
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
                placeholder="Search tickets by subject, contact, or ticket number..."
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
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value as any || undefined });
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  {TICKET_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
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
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
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

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="card text-center py-12">
          <TicketIcon className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-semibold text-secondary-900">No tickets</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Get started by creating your first support ticket.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/tickets/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Ticket
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tickets) && tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer hover:bg-secondary-50"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <TicketIcon className="h-4 w-4 text-secondary-400" />
                        <span className="font-mono font-medium text-secondary-900">
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-secondary-900 max-w-xs truncate">
                        {ticket.subject}
                      </div>
                    </td>
                    <td>
                      {ticket.contact && (
                        <div>
                          <div className="text-sm text-secondary-900">
                            {ticket.contact.firstName} {ticket.contact.lastName}
                          </div>
                          {ticket.contact.email && (
                            <div className="text-sm text-secondary-500">{ticket.contact.email}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-${getStatusColor(ticket.status)}`}>
                        {TICKET_STATUSES.find((s) => s.value === ticket.status)?.label || ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      {ticket.category && (
                        <span className="text-sm text-secondary-600">{ticket.category}</span>
                      )}
                    </td>
                    <td>
                      {ticket.assignee ? (
                        <div className="text-sm text-secondary-900">
                          {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-400">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-secondary-600">
                        <ClockIcon className="h-4 w-4" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tickets/${ticket.id}/edit`);
                          }}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ticket.id, ticket.subject);
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
                {total} tickets
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

export default TicketListPage;
