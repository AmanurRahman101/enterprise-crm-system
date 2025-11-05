import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Business,
  AttachMoney,
  Assignment,
  ConfirmationNumber,
  TrendingUp,
} from '@mui/icons-material';
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
      
      // Fetch stats from each module
      const [contacts, companies, deals, tasks, tickets, activities] = await Promise.all([
        apiClient.get('/contacts/stats').catch(() => ({ data: { data: { total: 0 } } })),
        apiClient.get('/companies/stats').catch(() => ({ data: { data: { total: 0 } } })),
        apiClient.get('/deals/stats').catch(() => ({ data: { data: { total: 0, totalValue: 0 } } })),
        apiClient.get('/tasks/stats').catch(() => ({ data: { data: { total: 0 } } })),
        apiClient.get('/tickets/stats').catch(() => ({ data: { data: { total: 0 } } })),
        apiClient.get('/activities/stats').catch(() => ({ data: { data: { total: 0 } } })),
      ]);

      setStats({
        contacts: {
          total: contacts.data.data.total || 0,
          customers: contacts.data.data.customers || 0,
        },
        companies: {
          total: companies.data.data.total || 0,
        },
        deals: {
          total: deals.data.data.total || 0,
          value: deals.data.data.totalValue || 0,
          wonCount: deals.data.data.wonCount || 0,
        },
        tasks: {
          total: tasks.data.data.total || 0,
          pending: tasks.data.data.pending || 0,
          completed: tasks.data.data.completed || 0,
        },
        tickets: {
          total: tickets.data.data.total || 0,
          open: tickets.data.data.open || 0,
          resolved: tickets.data.data.resolved || 0,
        },
        activities: {
          total: activities.data.data.total || 0,
          thisWeek: activities.data.data.thisWeek || 0,
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your CRM today.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Contacts */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Contacts"
            value={stats?.contacts.total || 0}
            subtitle={`${stats?.contacts.customers || 0} customers`}
            icon={<People sx={{ fontSize: 60 }} />}
            color="#1976d2"
          />
        </Grid>

        {/* Companies */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Companies"
            value={stats?.companies.total || 0}
            icon={<Business sx={{ fontSize: 60 }} />}
            color="#2e7d32"
          />
        </Grid>

        {/* Deals */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Deals"
            value={stats?.deals.total || 0}
            subtitle={`$${(stats?.deals.value || 0).toLocaleString()} total value`}
            icon={<AttachMoney sx={{ fontSize: 60 }} />}
            color="#ed6c02"
          />
        </Grid>

        {/* Tasks */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tasks"
            value={stats?.tasks.total || 0}
            subtitle={`${stats?.tasks.pending || 0} pending`}
            icon={<Assignment sx={{ fontSize: 60 }} />}
            color="#9c27b0"
          />
        </Grid>

        {/* Tickets */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Support Tickets"
            value={stats?.tickets.total || 0}
            subtitle={`${stats?.tickets.open || 0} open`}
            icon={<ConfirmationNumber sx={{ fontSize: 60 }} />}
            color="#d32f2f"
          />
        </Grid>

        {/* Activities */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Activities"
            value={stats?.activities.total || 0}
            subtitle={`${stats?.activities.thisWeek || 0} this week`}
            icon={<TrendingUp sx={{ fontSize: 60 }} />}
            color="#0288d1"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              • Add New Contact
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              • Create Deal
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              • Log Activity
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              • Create Task
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DashboardPage;
