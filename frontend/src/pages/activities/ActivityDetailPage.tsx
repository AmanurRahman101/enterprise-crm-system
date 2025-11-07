import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { Activity, ActivityType } from '../../types';
import api from '../../services/api';

const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchActivity(id);
    }
  }, [id]);

  const fetchActivity = async (activityId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/activities/${activityId}`);
      setActivity(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await api.delete(`/activities/${id}`);
      navigate('/activities');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete activity');
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return <PhoneIcon className="h-6 w-6" />;
      case ActivityType.EMAIL:
        return <EnvelopeIcon className="h-6 w-6" />;
      case ActivityType.MEETING:
        return <CalendarIcon className="h-6 w-6" />;
      case ActivityType.NOTE:
        return <DocumentTextIcon className="h-6 w-6" />;
      case ActivityType.TASK:
        return <CheckCircleIcon className="h-6 w-6" />;
      default:
        return <DocumentTextIcon className="h-6 w-6" />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return 'N/A';
    if (duration < 60) return `${duration} minutes`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error || 'Activity not found'}
        </div>
        <button
          onClick={() => navigate('/activities')}
          className="mt-4 inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Activities
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/activities')}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Activities
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {activity.type}
                </span>
                {activity.outcome && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {activity.outcome}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activity.subject}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(activity.occurredAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/activities/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Activity
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {activity.description && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          )}

          {/* Linked Entities */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Linked Entities
            </h2>
            <div className="space-y-3">
              {/* Contact */}
              {activity.contact && (
                <Link
                  to={`/contacts/${activity.contactId}`}
                  className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <UserCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Contact</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.contact.firstName} {activity.contact.lastName}
                    </p>
                    {activity.contact.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {activity.contact.email}
                      </p>
                    )}
                  </div>
                </Link>
              )}

              {/* Deal */}
              {activity.deal && (
                <Link
                  to={`/deals/${activity.dealId}`}
                  className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <BuildingOfficeIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Deal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.deal.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Value: ${activity.deal.value}
                    </p>
                  </div>
                </Link>
              )}

              {/* Ticket */}
              {activity.ticket && (
                <Link
                  to={`/tickets/${activity.ticketId}`}
                  className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <TicketIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Ticket</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.ticket.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Status: {activity.ticket.status}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Activity Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDuration(activity.duration)}
                </dd>
              </div>

              {activity.user && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Logged By
                  </dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                    <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {activity.user.firstName} {activity.user.lastName}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(activity.createdAt)}
                </dd>
              </div>

              {activity.recordingUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recording</dt>
                  <dd className="mt-1">
                    <a
                      href={activity.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Recording
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailPage;
