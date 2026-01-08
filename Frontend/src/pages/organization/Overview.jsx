import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import CreateOrganizationModal from '../../components/CreateOrganizationModal';
import { CardSkeleton } from '../../components/SkeletonLoader';

const OrgOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    dealsCount: 0,
    contactsCount: 0,
    issuesCount: 0,
    activitiesCount: 0,
    dealsByStage: {}
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => ApiService.getUser());
  const [currentOrg, setCurrentOrg] = useState(() => ApiService.getCurrentOrganization());
  const [showCreateModal, setShowCreateModal] = useState(false);


  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load stats from multiple endpoints
      const [dealsRes, contactsRes, issuesRes, activitiesRes] = await Promise.all([
        ApiService.request('/api/deals').catch(() => ({ success: false, deals: [] })),
        ApiService.request('/api/contacts').catch(() => ({ success: false, people: [], organizations: [] })),
        ApiService.request('/api/issues').catch(() => ({ success: false, issues: [] })),
        ApiService.request('/api/activities?dateRange=today').catch(() => ({ success: false, activities: [] }))
      ]);

      const deals = dealsRes.success ? (dealsRes.deals || []) : [];
      const people = contactsRes.success ? (contactsRes.people || []) : [];
      const organizations = contactsRes.success ? (contactsRes.organizations || []) : [];
      const issues = issuesRes.success ? (issuesRes.issues || []) : [];
      const activities = activitiesRes.success ? (activitiesRes.activities || []) : [];

      // Calculate deals by stage
      const dealsByStage = {};
      deals.forEach(deal => {
        const stageName = deal.stage?.name || 'Unknown';
        dealsByStage[stageName] = (dealsByStage[stageName] || 0) + 1;
      });

      setStats({
        dealsCount: deals.length,
        contactsCount: people.length + organizations.length,
        issuesCount: issues.length,
        activitiesCount: activities.length,
        dealsByStage
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync user and org from localStorage
  useEffect(() => {
    const updateAuth = () => {
      setUser(ApiService.getUser());
      setCurrentOrg(ApiService.getCurrentOrganization());
    };
    updateAuth();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateAuth();
    };
    
    // Listen for organization changes from OrganizationSwitcher
    const handleOrganizationChange = (event) => {
      updateAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('organizationChanged', handleOrganizationChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, []);
  
  // Reload overview when organization ID changes
  useEffect(() => {
    if (currentOrg?.id) {
      loadOverview();
    }
  }, [currentOrg?.id, loadOverview]);

  // Initial load and authentication check
  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    // User doesn't have an organization yet - show prompt to create one
    if (!currentOrg) {
      setLoading(false);
    }
  }, [navigate, user]);

  // Show organization creation prompt if user has no organizations
  if (!currentOrg && !loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-2xl w-full text-center">
          <div className="glass-card rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-100 mb-2">
                {user?.fullName || 'User'}
              </h1>
              <p className="text-gray-300 mb-6">
                You need to create or join an organization to get started.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-emerald-600 transition-colors flex items-center justify-center shadow-lg shadow-teal-500/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Organization
              </button>

              <p className="text-sm text-gray-400">
                Or ask an administrator to invite you to an existing organization.
              </p>
            </div>
            
            {showCreateModal && (
              <CreateOrganizationModal
                onClose={() => setShowCreateModal(false)}
                onSuccess={(response) => {
                  // If new token is returned, update it
                  if (response.token) {
                    const user = ApiService.getUser();
                    ApiService.setAuth(
                      response.token,
                      user,
                      response.currentOrganization,
                      [response.currentOrganization]
                    );
                    
                    // Update local state
                    setCurrentOrg(response.currentOrganization);
                    setUser(ApiService.getUser());
                    
                    // Dispatch event to notify other components
                    window.dispatchEvent(new CustomEvent('organizationChanged', {
                      detail: response.currentOrganization
                    }));
                  }
                  
                  // Trigger reload of overview data
                  loadOverview();
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <CardSkeleton count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <CardSkeleton count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <Link to="/dashboard/organization/deals" className="glass-card rounded-xl p-4 sm:p-5 md:p-6 transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Total Deals</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">{stats.dealsCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500/80 to-emerald-500/80 rounded-lg flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-teal-500/30 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl">💼</span>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/organization/contacts" className="glass-card rounded-xl p-4 sm:p-5 md:p-6 transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Total Contacts</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stats.contactsCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/80 to-blue-500/80 rounded-lg flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-cyan-500/30 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/organization/issues" className="glass-card rounded-xl p-4 sm:p-5 md:p-6 transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Active Issues</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stats.issuesCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/80 to-orange-500/80 rounded-lg flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-amber-500/30 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl">🐛</span>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/organization/activities" className="glass-card rounded-xl p-4 sm:p-5 md:p-6 transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Today's Activities</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">{stats.activitiesCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/80 to-green-500/80 rounded-lg flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-emerald-500/30 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Organization Info and Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {/* Organization Information Card */}
        {currentOrg && (
          <div className="glass-card rounded-xl shadow-xl p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4">Organization Information</h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full mt-2 mr-3 shrink-0 shadow-md shadow-teal-500/50"></div>
                <div>
                  <p className="text-sm md:text-base font-medium text-gray-300">Organization Name</p>
                  <p className="text-xs md:text-sm text-gray-400">{currentOrg.name || 'N/A'}</p>
                </div>
              </div>
              {currentOrg.email && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mt-2 mr-3 shrink-0 shadow-md shadow-cyan-500/50"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-300">Email</p>
                    <p className="text-xs md:text-sm text-gray-400">{currentOrg.email}</p>
                  </div>
                </div>
              )}
              {currentOrg.phone && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mt-2 mr-3 shrink-0 shadow-md shadow-purple-500/50"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-300">Phone</p>
                    <p className="text-xs md:text-sm text-gray-400">{currentOrg.phone}</p>
                  </div>
                </div>
              )}
              {currentOrg.address && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full mt-2 mr-3 shrink-0 shadow-md shadow-emerald-500/50"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-300">Address</p>
                    <p className="text-xs md:text-sm text-gray-400">{currentOrg.address}</p>
                  </div>
                </div>
              )}
              {currentOrg.role && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mt-2 mr-3 shrink-0 shadow-md shadow-amber-500/50"></div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-300">Your Role</p>
                    <p className="text-xs md:text-sm text-gray-400 capitalize">{currentOrg.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card rounded-xl shadow-xl p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/organization/deals')}
              className="w-full flex items-center p-3 md:p-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 hover:border-teal-500/40 rounded-lg transition-all text-left backdrop-blur-sm"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <div>
                <p className="font-medium text-white text-sm md:text-base">View Deals</p>
                <p className="text-xs md:text-sm text-gray-400">Manage and track all deals</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/organization/contacts')}
              className="w-full flex items-center p-3 md:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/40 rounded-lg transition-all text-left backdrop-blur-sm"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="font-medium text-white text-sm md:text-base">Manage Contacts</p>
                <p className="text-xs md:text-sm text-gray-400">People and organizations</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/organization/issues')}
              className="w-full flex items-center p-3 md:p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/40 rounded-lg transition-all text-left backdrop-blur-sm"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-white text-sm md:text-base">Track Issues</p>
                <p className="text-xs md:text-sm text-gray-400">View and manage issues</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/organization/activities')}
              className="w-full flex items-center p-3 md:p-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/40 rounded-lg transition-all text-left backdrop-blur-sm"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-white text-sm md:text-base">View Activities</p>
                <p className="text-xs md:text-sm text-gray-400">See all activities</p>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrgOverview;

