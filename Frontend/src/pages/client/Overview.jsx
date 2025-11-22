import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

const ClientOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ dealsCount: 0, issuesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => ApiService.getUser());

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    loadOverview();
  }, [navigate]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const response = await ApiService.request('/api/client/overview');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName || 'Client'}!
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          Here's your Client Portal overview.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-1">My Deals</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.dealsCount}</p>
                </div>
                <div className="p-2 md:p-3 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-1">My Issues</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.issuesCount}</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard/client/deals')}
                  className="w-full flex items-center p-3 md:p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-left"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 text-sm md:text-base">View My Deals</p>
                    <p className="text-xs md:text-sm text-gray-600">See all deals across organizations</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/client/issues')}
                  className="w-full flex items-center p-3 md:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 text-sm md:text-base">My Issues</p>
                    <p className="text-xs md:text-sm text-gray-600">View and track your issues</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 shrink-0"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">Full Name</p>
                    <p className="text-xs md:text-sm text-gray-600">{user?.fullName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 shrink-0"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">Email</p>
                    <p className="text-xs md:text-sm text-gray-600">{user?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 shrink-0"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">Phone</p>
                    <p className="text-xs md:text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientOverview;

