import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Activity, ActivityType } from '../../types';
import api from '../../services/api';

const ActivityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, typeFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const response = await api.get(`/activities?${params.toString()}`);
      setActivities(response.data.data || response.data.activities || []);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await api.delete(`/activities/${id}`);
      fetchActivities();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete activity');
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return <PhoneIcon className="h-5 w-5" />;
      case ActivityType.EMAIL:
        return <EnvelopeIcon className="h-5 w-5" />;
      case ActivityType.MEETING:
        return <CalendarIcon className="h-5 w-5" />;
      case ActivityType.NOTE:
        return <DocumentTextIcon className="h-5 w-5" />;
      case ActivityType.TASK:
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case ActivityType.EMAIL:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case ActivityType.MEETING:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case ActivityType.NOTE:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case ActivityType.TASK:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return 'N/A';
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track calls, emails, meetings, notes, and tasks
            </p>
          </div>
          <Link
            to="/activities/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Log Activity
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value={ActivityType.CALL}>Calls</option>
          <option value={ActivityType.EMAIL}>Emails</option>
          <option value={ActivityType.MEETING}>Meetings</option>
          <option value={ActivityType.NOTE}>Notes</option>
          <option value={ActivityType.TASK}>Tasks</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by logging your first activity.
          </p>
          <div className="mt-6">
            <Link
              to="/activities/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Log Activity
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Activities List */}
          <div className="space-y-4">
            {Array.isArray(activities) && activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Activity Icon */}
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(
                            activity.type
                          )}`}
                        >
                          {activity.type}
                        </span>
                        {activity.duration && (
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {activity.subject}
                      </h3>

                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Linked Entities */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {activity.contact && (
                          <Link
                            to={`/contacts/${activity.contactId}`}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                          >
                            <UserCircleIcon className="h-3 w-3 mr-1" />
                            {activity.contact.firstName} {activity.contact.lastName}
                          </Link>
                        )}
                        {activity.deal && (
                          <Link
                            to={`/deals/${activity.dealId}`}
                            className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                          >
                            Deal: {activity.deal.title}
                          </Link>
                        )}
                        {activity.ticket && (
                          <Link
                            to={`/tickets/${activity.ticketId}`}
                            className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                          >
                            Ticket: {activity.ticket.subject}
                          </Link>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                        <span>{formatDate(activity.occurredAt)}</span>
                        {activity.user && (
                          <span>
                            By {activity.user.firstName} {activity.user.lastName}
                          </span>
                        )}
                        {activity.outcome && <span>Outcome: {activity.outcome}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/activities/${activity.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="View Details"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/activities/${activity.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityListPage;
