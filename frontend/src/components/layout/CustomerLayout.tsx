import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  TicketIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: HomeIcon, path: '/customer' },
    { text: 'My Tickets', icon: TicketIcon, path: '/customer/tickets' },
    { text: 'Profile', icon: UserCircleIcon, path: '/customer/profile' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/customer') {
      return location.pathname === '/customer';
    }
    return location.pathname.startsWith(path);
  };

  const NavigationItem: React.FC<{ item: MenuItem }> = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
          transition-all duration-200 group
          ${active
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-r-2 border-primary-600'
            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 hover:text-secondary-900 dark:hover:text-secondary-100'
          }
        `}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500 dark:text-secondary-400 group-hover:text-secondary-700 dark:group-hover:text-secondary-300'}`} />
        <span>{item.text}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h1 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">Customer Portal</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {menuItems.map((item) => (
              <NavigationItem key={item.path} item={item} />
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-secondary-200 dark:border-secondary-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{user?.email}</p>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-secondary-400 dark:text-secondary-500 transition-transform ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1">
                  <button
                    onClick={() => {
                      navigate('/customer/profile');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  >
                    <UserCircleIcon className="w-4 h-4" />
                    Profile
                  </button>
                  <div className="border-t border-secondary-200 dark:border-secondary-700 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 h-16">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 hidden lg:block">
                Customer Portal
              </h2>
              
              {/* Desktop User Info */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{user?.email}</p>
                </div>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-secondary-200 dark:border-secondary-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
