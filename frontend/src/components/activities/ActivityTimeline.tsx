import React from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Activity, ActivityType } from '../../types';

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
  showEntityLinks?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading = false,
  showEntityLinks = true,
}) => {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return <PhoneIcon className="h-4 w-4" />;
      case ActivityType.EMAIL:
        return <EnvelopeIcon className="h-4 w-4" />;
      case ActivityType.MEETING:
        return <CalendarIcon className="h-4 w-4" />;
      case ActivityType.NOTE:
        return <DocumentTextIcon className="h-4 w-4" />;
      case ActivityType.TASK:
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return 'bg-blue-500';
      case ActivityType.EMAIL:
        return 'bg-purple-500';
      case ActivityType.MEETING:
        return 'bg-green-500';
      case ActivityType.NOTE:
        return 'bg-yellow-500';
      case ActivityType.TASK:
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return null;
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.occurredAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <p className="mt-2 text-sm">No activities recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="mb-8">
          {/* Date Header */}
          <div className="relative pb-8">
            <span className="text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 pr-3">
              {date}
            </span>
            <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700 -z-10"></div>
          </div>

          {/* Activities for this date */}
          <ul className="space-y-6">
            {dateActivities.map((activity, activityIdx) => (
              <li key={activity.id} className="relative flex gap-x-4">
                {/* Timeline Line */}
                {activityIdx !== dateActivities.length - 1 && (
                  <div className="absolute left-0 top-0 flex w-8 justify-center -bottom-6">
                    <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                )}

                {/* Activity Icon */}
                <div className="relative flex h-8 w-8 flex-none items-center justify-center">
                  <div className={`h-2 w-2 rounded-full ${getActivityColor(activity.type)} ring-1 ring-white dark:ring-gray-900`}></div>
                  <div className={`absolute h-8 w-8 rounded-full ${getActivityColor(activity.type)} opacity-20 flex items-center justify-center text-white`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {/* Activity Content */}
                <div className="flex-auto">
                  <div className="flex items-start justify-between gap-x-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/activities/${activity.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {activity.subject}
                      </Link>
                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getActivityColor(activity.type)} bg-opacity-20 text-gray-700 dark:text-gray-300`}>
                          {activity.type}
                        </span>
                        {activity.duration && (
                          <span className="inline-flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                        {activity.outcome && <span>• {activity.outcome}</span>}
                        {activity.user && (
                          <span>
                            • {activity.user.firstName} {activity.user.lastName}
                          </span>
                        )}
                      </div>

                      {/* Linked Entities */}
                      {showEntityLinks && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activity.contact && (
                            <Link
                              to={`/contacts/${activity.contactId}`}
                              className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              {activity.contact.firstName} {activity.contact.lastName}
                            </Link>
                          )}
                          {activity.deal && (
                            <Link
                              to={`/deals/${activity.dealId}`}
                              className="inline-flex items-center text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              {activity.deal.title}
                            </Link>
                          )}
                          {activity.ticket && (
                            <Link
                              to={`/tickets/${activity.ticketId}`}
                              className="inline-flex items-center text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            >
                              {activity.ticket.subject}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <time className="flex-none text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.occurredAt)}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
