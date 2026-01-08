import React from 'react';
import { Link, useLocation } from 'react-router';

const Breadcrumbs = ({ customItems = null, className = '' }) => {
  const location = useLocation();

  // Icon mapping for different paths
  const iconMap = {
    organization: '🏢',
    client: '🏠',
    deals: '💼',
    contacts: '👥',
    activities: '📋',
    issues: '🎫',
    team: '👥',
    calls: '📞',
    telegram: '✈️',
    dashboard: '🏠'
  };

  // Name mapping for better display
  const nameMap = {
    organization: 'Organization',
    client: 'Client Portal',
    deals: 'Deals',
    contacts: 'Contacts',
    activities: 'Activities',
    issues: 'Issues',
    team: 'Team',
    calls: 'Call History',
    telegram: 'Telegram',
    dashboard: 'Dashboard'
  };

  const generateBreadcrumbs = () => {
    if (customItems) return customItems;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the root 'dashboard' from display but keep it in path
      if (segment === 'dashboard') return;

      breadcrumbs.push({
        label: nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        icon: iconMap[segment],
        isLast: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link 
        to="/dashboard" 
        className="flex items-center text-gray-400 hover:text-teal-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {/* Separator */}
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>

          {/* Breadcrumb Item */}
          {item.isLast ? (
            <span className="flex items-center text-white font-medium">
              {item.icon && <span className="mr-1.5">{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="flex items-center text-gray-400 hover:text-teal-400 transition-colors"
            >
              {item.icon && <span className="mr-1.5">{item.icon}</span>}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;

