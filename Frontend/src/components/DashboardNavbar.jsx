import React from 'react';
import { useLocation, Link } from 'react-router';
import ApiService from '../services/api';

const DashboardNavbar = ({ onToggleSidebar, isSidebarOpen, onToggleCollapse, isSidebarCollapsed }) => {
  const location = useLocation();
  const user = ApiService.getUser();
  const currentOrg = ApiService.getCurrentOrganization();

  // Determine navbar title based on context
  const getNavbarTitle = () => {
    if (location.pathname.startsWith('/dashboard/organization')) {
      return currentOrg?.name || 'Organization';
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return user?.fullName || 'User';
    } else if (location.pathname.startsWith('/dashboard/company')) {
      return 'Company Dashboard';
    } else if (location.pathname.startsWith('/dashboard/customer')) {
      return 'Customer Portal';
    }
    return 'Dashboard';
  };

  const getNavbarSubtitle = () => {
    if (location.pathname.startsWith('/dashboard/organization')) {
      return 'Organization Dashboard';
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return 'Client Portal';
    } else if (location.pathname.startsWith('/dashboard/company')) {
      return 'Company Dashboard';
    } else if (location.pathname.startsWith('/dashboard/customer')) {
      return 'Customer Portal';
    }
    return 'Dashboard';
  };

  // Get user role from current organization
  const getUserRole = () => {
    if (location.pathname.startsWith('/dashboard/organization') && currentOrg?.role) {
      return currentOrg.role;
    }
    return null;
  };

  const userRole = getUserRole();

  // Format role for display
  const formatRole = (role) => {
    if (!role) return null;
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Get role badge color (Dark mode)
  const getRoleBadgeColor = (role) => {
    if (!role) return 'bg-gray-700/50 text-gray-300 border border-slate-600';
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'owner':
        return 'bg-purple-900/30 text-purple-300 border border-purple-500/30';
      case 'admin':
        return 'bg-red-900/30 text-red-300 border border-red-500/30';
      case 'manager':
        return 'bg-blue-900/30 text-blue-300 border border-blue-500/30';
      case 'agent':
        return 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30';
      case 'viewer':
        return 'bg-gray-700/50 text-gray-300 border border-slate-600';
      default:
        return 'bg-gray-700/50 text-gray-300 border border-slate-600';
    }
  };

  return (
    <nav className="bg-gray-950/95 backdrop-blur-xl shadow-2xl border-b border-teal-500/20 w-full z-50">
      <div className="w-full px-3 sm:pr-4 md:pr-6 lg:pr-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Sidebar Toggle (Mobile) + Collapse Toggle (Desktop) + CRM Logo & Title */}
          <div className="flex items-center min-w-0 flex-1">
            {/* Sidebar Toggle Button - Only on Mobile */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden mr-2 sm:mr-3 p-2 text-gray-300 hover:text-teal-400 hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={isSidebarOpen}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Collapse/Expand Toggle Button - Only on Desktop */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex mr-2 p-2 text-gray-300 hover:text-teal-400 hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* CRM Logo - Hidden on mobile, visible on md and up */}
            <Link to="/dashboard/organization" className="hidden md:flex items-center shrink-0 px-2 sm:px-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 shadow-lg shadow-teal-500/50 animate-glow-pulse">
                <span className="text-white font-bold text-sm sm:text-base">T</span>
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">Tawassul</span>
                <span className="text-base sm:text-lg font-light text-gray-400 ml-0.5 sm:ml-1 whitespace-nowrap">CRM</span>
              </div>
            </Link>

            {/* Title (Organization Name or User Name) */}
            {getNavbarTitle() && (
              <>
                <div className="hidden md:block w-px h-6 bg-gray-700 mx-2 lg:mx-4 shrink-0"></div>
                <div className="flex items-baseline space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-100 truncate leading-tight min-w-0">
                    {getNavbarTitle()}
                  </h1>
                  <p className="hidden lg:block text-xs text-gray-400 font-medium uppercase tracking-wider whitespace-nowrap shrink-0">
                    {getNavbarSubtitle()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right: User Role Badge */}
          {userRole && (
            <div className="flex items-center ml-2 sm:ml-4 shrink-0">
              <span className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full ${getRoleBadgeColor(userRole)}`}>
                {formatRole(userRole)}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;

