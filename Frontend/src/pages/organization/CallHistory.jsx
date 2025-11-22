import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

const CallHistory = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg] = useState(() => ApiService.getCurrentOrganization());

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    if (!currentOrg) {
      toast.error('Please select an organization');
      navigate('/dashboard/organization');
      return;
    }

    loadCallHistory();
    loadStatistics();
  }, [navigate, user, currentOrg]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const response = await ApiService.request('/api/calls/history');

      if (response.success) {
        setCalls(response.calls || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await ApiService.request('/api/calls/statistics');
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatCallDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      rejected: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-gray-100 text-gray-800',
      calling: 'bg-blue-100 text-blue-800'
    };

    return badges[status] || badges.failed;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Call History</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          View all voice calls in your organization
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_calls || 0}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics.completed_calls || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Missed</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{statistics.missed_calls || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatDuration(Math.floor(statistics.avg_duration || 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call History List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
        </div>

        {calls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>No call history yet</p>
            <p className="text-sm mt-2">Make your first call from the Contacts page</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {calls.map((call) => (
              <div key={call.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-900">{call.receiverName || 'Unknown'}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(call.status)}`}>
                          {call.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Called by {call.callerName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{formatCallDate(call.startedAt)}</span>
                        {call.durationSeconds && (
                          <>
                            <span>•</span>
                            <span>Duration: {formatDuration(call.durationSeconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {call.receiverType === 'person' && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      Person
                    </div>
                  )}
                  {call.receiverType === 'organization' && (
                    <div className="text-xs px-2 py-1 bg-blue-100 rounded text-blue-600">
                      Organization
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;

