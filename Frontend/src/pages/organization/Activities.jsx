import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

// Activity Icon Component
const ActivityIcon = ({ entityType, actionType }) => {
  const iconConfig = {
    deal: { icon: '💼', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    contact_person: { icon: '👤', bg: 'bg-blue-100', text: 'text-blue-600' },
    contact_org: { icon: '🏢', bg: 'bg-purple-100', text: 'text-purple-600' },
    issue: { icon: '🐛', bg: 'bg-red-100', text: 'text-red-600' },
    file: { icon: '📎', bg: 'bg-green-100', text: 'text-green-600' },
    call: { icon: '📞', bg: 'bg-yellow-100', text: 'text-yellow-600' }
  };

  const config = iconConfig[entityType] || { icon: '📝', bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center text-lg`}>
      {config.icon}
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ activity }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getActionLabel = (entityType, actionType) => {
    const labels = {
      deal_created: 'created a deal',
      deal_updated: 'updated a deal',
      deal_stage_changed: 'moved a deal',
      deal_deleted: 'deleted a deal',
      contact_created: 'added a contact',
      contact_updated: 'updated a contact',
      contact_deleted: 'removed a contact',
      issue_created: 'created an issue',
      issue_updated: 'updated an issue',
      issue_status_changed: 'changed issue status',
      issue_deleted: 'closed an issue',
      file_uploaded: 'uploaded a file',
      file_deleted: 'deleted a file',
      call_started: 'started a call',
      call_ended: 'ended a call'
    };

    return labels[actionType] || actionType.replace(/_/g, ' ');
  };

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <ActivityIcon entityType={activity.entity_type} actionType={activity.action_type} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{activity.user?.name || 'Unknown User'}</span>
              {' '}
              <span className="text-gray-600">{getActionLabel(activity.entity_type, activity.action_type)}</span>
            </p>
            
            {activity.description && (
              <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
            )}

            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                {activity.metadata.oldValue && activity.metadata.newValue && (
                  <span>
                    Changed from <strong>{activity.metadata.oldValue}</strong> to <strong>{activity.metadata.newValue}</strong>
                  </span>
                )}
                {activity.metadata.duration && (
                  <span>Duration: {Math.floor(activity.metadata.duration / 60)} minutes</span>
                )}
                {activity.metadata.fileName && (
                  <span>File: {activity.metadata.fileName}</span>
                )}
              </div>
            )}
          </div>
          
          <time className="text-xs text-gray-500 whitespace-nowrap ml-4">
            {formatDate(activity.created_at)}
          </time>
        </div>
      </div>
    </div>
  );
};

// Filter Chip Component
const FilterChip = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-full transition-colors
        ${active 
          ? 'bg-indigo-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {label}
    </button>
  );
};

// Main Activities Component
const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState('all');
  const [filterUserId, setFilterUserId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month
  const [user] = useState(() => ApiService.getUser());

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    loadData();
  }, [navigate, filterEntityType, filterUserId, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filterEntityType !== 'all') params.append('entityType', filterEntityType);
      if (filterUserId !== 'all') params.append('userId', filterUserId);
      if (dateRange !== 'all') params.append('dateRange', dateRange);

      const queryString = params.toString();
      const endpoint = `/api/activities${queryString ? `?${queryString}` : ''}`;
      
      const response = await ApiService.request(endpoint);

      if (response.success) {
        setActivities(response.activities || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const entityTypeFilters = [
    { value: 'all', label: 'All Types', icon: '📋' },
    { value: 'deal', label: 'Deals', icon: '💼' },
    { value: 'contact_person', label: 'People', icon: '👤' },
    { value: 'contact_org', label: 'Organizations', icon: '🏢' },
    { value: 'issue', label: 'Issues', icon: '🐛' },
    { value: 'file', label: 'Files', icon: '📎' },
    { value: 'call', label: 'Calls', icon: '📞' }
  ];

  const dateRangeFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchQuery === '' ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action_type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getActivityStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: activities.length,
      today: activities.filter(a => new Date(a.created_at) >= today).length,
      deals: activities.filter(a => a.entity_type === 'deal').length,
      contacts: activities.filter(a => a.entity_type === 'contact_person' || a.entity_type === 'contact_org').length,
      calls: activities.filter(a => a.entity_type === 'call').length
    };
  };

  const stats = getActivityStats();

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Track all activities across your organization
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 p-4">
            <div className="text-2xl font-bold text-indigo-900">{stats.today}</div>
            <div className="text-sm text-indigo-700">Today</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-900">{stats.deals}</div>
            <div className="text-sm text-blue-700">Deal Activities</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
            <div className="text-2xl font-bold text-purple-900">{stats.contacts}</div>
            <div className="text-sm text-purple-700">Contact Activities</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <div className="text-2xl font-bold text-yellow-900">{stats.calls}</div>
            <div className="text-sm text-yellow-700">Calls</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Entity Type Filters */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Filter by Type:</div>
          <div className="flex flex-wrap gap-2">
            {entityTypeFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={`${filter.icon} ${filter.label}`}
                active={filterEntityType === filter.value}
                onClick={() => setFilterEntityType(filter.value)}
              />
            ))}
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Filter by Date:</div>
          <div className="flex flex-wrap gap-2">
            {dateRangeFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                active={dateRange === filter.value}
                onClick={() => setDateRange(filter.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || filterEntityType !== 'all' || dateRange !== 'all'
              ? 'No activities found matching your filters'
              : 'No activities yet. Start working and activities will appear here!'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button (if needed) */}
      {filteredActivities.length > 0 && filteredActivities.length >= 50 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default Activities;

