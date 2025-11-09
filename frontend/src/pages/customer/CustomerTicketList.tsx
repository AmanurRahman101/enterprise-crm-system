import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { customerTicketService, CustomerTicket } from '../../services/customerTicketService';

const CustomerTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusFilter = filter === 'all' ? undefined : 
                          filter === 'open' ? 'OPEN' : 'RESOLVED';
      
      const response = await customerTicketService.getMyTickets({ status: statusFilter });
      
      if (response.success) {
        setTickets(response.data.tickets);
      } else {
        setError(response.error || 'Failed to fetch tickets');
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <TicketIcon className="h-5 w-5 text-primary-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'RESOLVED':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'CLOSED':
        return <XCircleIcon className="h-5 w-5 text-secondary-500" />;
      default:
        return <TicketIcon className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      IN_PROGRESS: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      RESOLVED: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
      CLOSED: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    };
    return styles[status as keyof typeof styles] || styles.OPEN;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300',
      MEDIUM: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      HIGH: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      URGENT: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
    };
    return styles[priority as keyof typeof styles] || styles.MEDIUM;
  };

  const filteredTickets = tickets;  // Filtering now done by API

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <XCircleIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">My Tickets</h1>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
            View and manage your support tickets
          </p>
        </div>
        <Link
          to="/customer/tickets/new"
          className="btn-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          New Ticket
        </Link>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              }`}
            >
              All Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'open'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              }`}
            >
              Open ({tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'resolved'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              }`}
            >
              Resolved ({tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <TicketIcon className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">No tickets</h3>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              {filter === 'all'
                ? "You haven't created any tickets yet."
                : `No ${filter} tickets found.`}
            </p>
            <div className="mt-6">
              <Link
                to="/customer/tickets/new"
                className="btn-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create New Ticket
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/customer/tickets/${ticket.id}`}
                  className="block hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {ticket.subject}
                          </p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Created {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerTicketList;
