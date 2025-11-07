import { useEffect, useState } from 'react';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

interface DashboardStats {
  contacts: { total: number; customers: number };
  companies: { total: number };
  deals: { total: number; value: number; wonCount: number };
  tasks: { total: number; pending: number; completed: number };
  tickets: { total: number; open: number; resolved: number };
  activities: { total: number; thisWeek: number };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Helper function to safely extract data from different response structures
      const extractData = (response: any) => {
        return response?.data?.data || response?.data || {};
      };

      // Fetch stats from each module
      const [contacts, companies, deals, tasks, tickets, activities] = await Promise.all([
        apiClient.get('/contacts/stats').catch(() => ({ data: { total: 0 } })),
        apiClient.get('/companies/stats').catch(() => ({ data: { total: 0 } })),
        apiClient.get('/deals/stats').catch(() => ({ data: { total: 0, totalValue: 0 } })),
        apiClient.get('/tasks/stats').catch(() => ({ data: { total: 0 } })),
        apiClient.get('/tickets/stats').catch(() => ({ data: { total: 0 } })),
        apiClient.get('/activities/stats').catch(() => ({ data: { total: 0 } })),
      ]);

      const contactsData = extractData(contacts);
      const companiesData = extractData(companies);
      const dealsData = extractData(deals);
      const tasksData = extractData(tasks);
      const ticketsData = extractData(tickets);
      const activitiesData = extractData(activities);

      setStats({
        contacts: {
          total: contactsData.total || 0,
          customers: contactsData.customers || 0,
        },
        companies: {
          total: companiesData.total || 0,
        },
        deals: {
          total: dealsData.total || 0,
          value: dealsData.totalValue || dealsData.value || 0,
          wonCount: dealsData.wonCount || dealsData.won || 0,
        },
        tasks: {
          total: tasksData.total || 0,
          pending: tasksData.pending || tasksData.todo || 0,
          completed: tasksData.completed || 0,
        },
        tickets: {
          total: ticketsData.total || 0,
          open: ticketsData.open || 0,
          resolved: ticketsData.resolved || 0,
        },
        activities: {
          total: activitiesData.total || 0,
          thisWeek: activitiesData.thisWeek || 0,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-danger">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, bgClass }) => (
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
            {subtitle && (
              <p className="text-sm text-secondary-600 mt-2">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`${bgClass} p-3 rounded-lg`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
          </div>
        </div>
      </div>
    </div>
  );

  const quickActions = [
    { label: 'Add Contact', icon: UsersIcon, path: '/contacts/new' },
    { label: 'Create Deal', icon: BanknotesIcon, path: '/deals/new' },
    { label: 'New Task', icon: ClipboardDocumentListIcon, path: '/tasks/new' },
    { label: 'Log Activity', icon: ChartBarIcon, path: '/activities/new' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-secondary-600">
          Here's what's happening with your CRM today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contacts */}
        <StatCard
          title="Total Contacts"
          value={stats?.contacts.total || 0}
          subtitle={`${stats?.contacts.customers || 0} customers`}
          icon={UsersIcon}
          colorClass="text-primary-600"
          bgClass="bg-primary-50"
        />

        {/* Companies */}
        <StatCard
          title="Companies"
          value={stats?.companies.total || 0}
          icon={BuildingOfficeIcon}
          colorClass="text-success-600"
          bgClass="bg-success-50"
        />

        {/* Deals */}
        <StatCard
          title="Active Deals"
          value={stats?.deals.total || 0}
          subtitle={`$${(stats?.deals.value || 0).toLocaleString()} total value`}
          icon={BanknotesIcon}
          colorClass="text-warning-600"
          bgClass="bg-warning-50"
        />

        {/* Tasks */}
        <StatCard
          title="Tasks"
          value={stats?.tasks.total || 0}
          subtitle={`${stats?.tasks.pending || 0} pending`}
          icon={ClipboardDocumentListIcon}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />

        {/* Tickets */}
        <StatCard
          title="Support Tickets"
          value={stats?.tickets.total || 0}
          subtitle={`${stats?.tickets.open || 0} open`}
          icon={TicketIcon}
          colorClass="text-danger-600"
          bgClass="bg-danger-50"
        />

        {/* Activities */}
        <StatCard
          title="Activities"
          value={stats?.activities.total || 0}
          subtitle={`${stats?.activities.thisWeek || 0} this week`}
          icon={ChartBarIcon}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => window.location.href = action.path}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 group-hover:text-primary-700">
                    {action.label}
                  </span>
                  <PlusIcon className="w-4 h-4 text-secondary-400 ml-auto group-hover:text-primary-600" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Section Placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Activity</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12 text-secondary-500">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
            <p className="text-sm">Activity tracking coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
