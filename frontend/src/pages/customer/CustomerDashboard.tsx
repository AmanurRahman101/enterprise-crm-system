import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TicketIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    openTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    totalTickets: 0,
  });

  useEffect(() => {
    // TODO: Fetch customer stats from API
    // For now, using mock data
    setStats({
      openTickets: 2,
      resolvedTickets: 5,
      pendingTickets: 1,
      totalTickets: 8,
    });
  }, []);

  interface StatCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, bgClass }) => (
    <div className="card group hover:shadow-lg transition-shadow duration-200">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
              {title}
            </p>
            <p className={`text-3xl font-bold ${colorClass} mb-1`}>
              {value}
            </p>
          </div>
          <div className={`${bgClass} p-3 rounded-lg`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
          </div>
        </div>
      </div>
    </div>
  );

  const quickActions = [
    { label: 'Create New Ticket', icon: TicketIcon, path: '/customer/tickets/new' },
    { label: 'Update Profile', icon: UserCircleIcon, path: '/customer/profile' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Here's an overview of your support tickets and activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          icon={TicketIcon}
          colorClass="text-primary-600"
          bgClass="bg-primary-50"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingTickets}
          icon={ClockIcon}
          colorClass="text-warning-600"
          bgClass="bg-warning-50"
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedTickets}
          icon={CheckCircleIcon}
          colorClass="text-success-600"
          bgClass="bg-success-50"
        />
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={TicketIcon}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Recent Activity</h2>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
            Your latest support ticket updates
          </p>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-mb-8">
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-success-500 flex items-center justify-center ring-8 ring-white dark:ring-secondary-800">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Ticket <span className="font-medium text-secondary-900 dark:text-secondary-100">#1234</span> was resolved
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-secondary-500 dark:text-secondary-400">
                      2h ago
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white dark:ring-secondary-800">
                      <TicketIcon className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        New ticket <span className="font-medium text-secondary-900 dark:text-secondary-100">#1235</span> created
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-secondary-500 dark:text-secondary-400">
                      1d ago
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => window.location.href = action.path}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-secondary-200 dark:border-secondary-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">
                    {action.label}
                  </span>
                  <PlusIcon className="w-4 h-4 text-secondary-400 ml-auto group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
