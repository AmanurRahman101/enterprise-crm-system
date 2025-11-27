import React, { useMemo, useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router'
import toast from 'react-hot-toast'
import OrganizationSwitcher from '../components/OrganizationSwitcher'
import DashboardNavbar from '../components/DashboardNavbar'
import Chatbot, { ChatbotToggle } from '../components/Chatbot'
import CallInterface from '../components/CallInterface'
import ApiService from '../services/api'
import SocketService from '../services/socketService'

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // Sidebar collapsed state (for desktop) - false = expanded, true = collapsed
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // Sidebar open state (for mobile) - false = closed, true = open
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [user, setUser] = useState(() => ApiService.getUser())
  const [currentOrg, setCurrentOrg] = useState(() => ApiService.getCurrentOrganization())
  
  // Handle window resize to adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      // On mobile, close sidebar if open
      if (window.innerWidth < 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);
  
  // Sync user and org from localStorage on mount and when location changes
  useEffect(() => {
    const updateAuth = () => {
      setUser(ApiService.getUser())
      setCurrentOrg(ApiService.getCurrentOrganization())
    }
    
    updateAuth()
    
    // Listen for storage changes (when switching organizations across tabs)
    const handleStorageChange = () => {
      updateAuth()
    }
    
    // Listen for organization changes from OrganizationSwitcher (same tab)
    const handleOrganizationChange = (event) => {
      updateAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('organizationChanged', handleOrganizationChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('organizationChanged', handleOrganizationChange)
    }
  }, [location.pathname])

  // Initialize WebSocket connection
  useEffect(() => {
    const token = ApiService.getToken()
    if (token && user && currentOrg) {
      SocketService.connect()
      
      // Listen for notifications
      const unsubscribe = SocketService.on('notification', (data) => {
        toast.success(data.message || 'New notification')
      })

      return () => {
        unsubscribe()
        SocketService.disconnect()
      }
    }
  }, [user, currentOrg?.id])

  // Reconnect WebSocket when organization changes
  useEffect(() => {
    const handleOrganizationChange = () => {
      // Disconnect and reconnect with new organization context
      SocketService.disconnect()
      const token = ApiService.getToken()
      const user = ApiService.getUser()
      const currentOrg = ApiService.getCurrentOrganization()
      if (token && user && currentOrg) {
        // Wait a bit before reconnecting to ensure clean disconnect
        setTimeout(() => {
          if (!SocketService.isConnected()) {
            SocketService.connect()
          }
        }, 1000)
      }
    }

    window.addEventListener('organizationRefresh', handleOrganizationChange)

    return () => {
      window.removeEventListener('organizationRefresh', handleOrganizationChange)
    }
  }, [])

  const handleLogout = () => {
    SocketService.disconnect()
    ApiService.clearAuth()
    toast.success('Logged out successfully')
    navigate('/')
  }

  // Organization Dashboard Navigation (Internal Users)
  const organizationNavItems = [
    { path: '/dashboard/organization', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/dashboard/organization/deals', label: 'Deals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/dashboard/organization/contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/dashboard/organization/issues', label: 'Issues', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { path: '/dashboard/organization/calls', label: 'Call History', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { path: '/dashboard/organization/activities', label: 'Activities', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/dashboard/organization/team', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: '/dashboard/organization/settings/telegram', label: 'Telegram Link', icon: 'M11 11V7a1 1 0 012 0v4a1 1 0 001 1h4a1 1 0 010 2h-4a1 1 0 00-1 1v4a1 1 0 01-2 0v-4a1 1 0 00-1-1H7a1 1 0 010-2h4a1 1 0 001-1z' },
  ]

  // Client Portal Navigation (Client Users)
  const clientNavItems = [
    { path: '/dashboard/client', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/dashboard/client/deals', label: 'My Deals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/dashboard/client/issues', label: 'My Issues', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { path: '/dashboard/client/settings/telegram', label: 'Telegram Link', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  ]

  // Legacy Company navigation items (for backward compatibility)
  const companyNavItems = [
    { path: '/dashboard/company', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/dashboard/company/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/dashboard/company/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/dashboard/company/leads', label: 'Leads', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { path: '/dashboard/company/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { path: '/dashboard/company/email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { path: '/dashboard/company/support', label: 'Customer Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  ]

  // Legacy Customer navigation items (for backward compatibility)
  const customerNavItems = [
    { path: '/dashboard/customer', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/dashboard/customer/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/dashboard/customer/companies', label: 'My Companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/dashboard/customer/tickets', label: 'My Tickets', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { path: '/dashboard/customer/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ]

  // Determine which navigation to show based on route
  // All users can access both organization and client portal navigation
  const getNavItems = () => {
    if (location.pathname.startsWith('/dashboard/organization')) {
      return organizationNavItems
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return clientNavItems
    } else if (location.pathname.startsWith('/dashboard/company')) {
      return companyNavItems
    } else if (location.pathname.startsWith('/dashboard/customer')) {
      return customerNavItems
    }
    // Default to organization navigation for all users
    return organizationNavItems
  }

  const navItems = getNavItems()
  const isActive = (path) => {
    // Exact match for root paths
    if (path === '/dashboard/organization' || path === '/dashboard/client') {
      return location.pathname === path
    }
    // Sub-path matching for all other routes
    return location.pathname.startsWith(path)
  }

  // Get dashboard title
  const getDashboardTitle = () => {
    if (location.pathname.startsWith('/dashboard/organization')) {
      return 'Organization Dashboard'
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return 'Client Portal'
    } else if (location.pathname.startsWith('/dashboard/company')) {
      return 'Company Dashboard'
    } else if (location.pathname.startsWith('/dashboard/customer')) {
      return 'Customer Dashboard'
    }
    return 'Dashboard'
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Top Navbar - Full Width */}
      <DashboardNavbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Overlay - Only show on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={`
          fixed top-14 left-0 bottom-0 z-40
          ${isSidebarCollapsed ? 'lg:w-16' : 'w-64 sm:w-72 lg:w-64'}
          bg-gradient-to-b from-white to-gray-50 shadow-xl flex flex-col
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>

        {/* User Profile Section - Clickable to Client Portal */}
        <div className={`p-3 border-b border-gray-200 bg-white ${isSidebarCollapsed ? 'lg:px-2' : ''}`}>
          <Link
            to="/dashboard/client"
            onClick={() => {
              // Only auto-close on mobile
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className={`flex items-center mb-2 cursor-pointer hover:opacity-80 transition-opacity group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg p-1 -m-1 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
            title="Go to Client Portal"
            aria-label="Go to Client Portal"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-base">
                {user?.fullName?.[0]?.toUpperCase() || currentOrg?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <>
                <div className="ml-2 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {user?.fullName || currentOrg?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate group-hover:text-indigo-500 transition-colors">{user?.email}</p>
                </div>
                <svg 
                  className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors ml-1.5 shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Link>
          
          {/* Organizations Link */}
          <Link
            to="/dashboard/organization"
            onClick={() => {
              // Only auto-close on mobile
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className={`flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              location.pathname.startsWith('/dashboard/organization')
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            } ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title="Go to Organizations"
            aria-label="Go to Organizations"
          >
            <svg className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {!isSidebarCollapsed && <span>Organizations</span>}
          </Link>
        </div>

        {/* Organization Switcher (show when in organization mode and has org) */}
        {location.pathname.startsWith('/dashboard/organization') && currentOrg && !isSidebarCollapsed && (
          <div className="px-3 py-2 border-b border-gray-200 bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5 px-1">Current Organization</p>
            <OrganizationSwitcher />
          </div>
        )}

        {/* Navigation Section - Only show if user has organization when on organization routes */}
        {!(location.pathname.startsWith('/dashboard/organization') && !currentOrg) && (
          <nav className={`flex-1 overflow-y-auto py-3 ${isSidebarCollapsed ? 'lg:px-2' : 'px-3'}`}>
            {!isSidebarCollapsed && (
              <div className="mb-2 px-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {location.pathname.startsWith('/dashboard/organization') ? 'CRM Modules' : 
                   location.pathname.startsWith('/dashboard/client') ? 'My Portal' : 'Navigation'}
                </p>
              </div>
            )}
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      // Only auto-close on mobile
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center py-2.5 rounded-lg text-sm font-medium transition-all group relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'px-3'
                    } ${
                      isActive(item.path)
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.label}
                  >
                    <svg
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isSidebarCollapsed ? '' : 'mr-3'
                      } ${
                        isActive(item.path) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {isActive(item.path) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Bottom Actions */}
        <div className={`border-t border-gray-200 bg-white ${isSidebarCollapsed ? 'lg:p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center bg-gray-50 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all group ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'justify-center px-4 py-2.5'
            }`}
            title="Logout"
          >
            <svg className={`w-5 h-5 shrink-0 group-hover:text-red-600 ${isSidebarCollapsed ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
        </aside>

        {/* Main Content */}
        <main 
          className={`flex-1 overflow-y-auto w-full focus:outline-none bg-gray-50 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
          tabIndex={-1}
          id="main-content"
          aria-label="Main content"
        >
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chatbot Toggle Button & Chatbot Component */}
      {user && (
        <>
          <ChatbotToggle onClick={() => setChatbotOpen(!chatbotOpen)} />
          <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
          <CallInterface />
        </>
      )}
    </div>
  )
}

export default DashboardLayout
