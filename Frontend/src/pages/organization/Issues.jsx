import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Open' },
    in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' }
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Low' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Medium' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Issue Card Component
const IssueCard = ({ issue, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">{issue.title}</h3>
        <div className="flex flex-col space-y-1">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      {issue.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {issue.assignedTo && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{issue.assignedTo.name}</span>
            </div>
          )}
          {issue.jira_ticket_id && (
            <div className="flex items-center text-indigo-600">
              <span className="font-mono">{issue.jira_ticket_id}</span>
            </div>
          )}
        </div>
        <div>
          {new Date(issue.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

// Issue Modal Component
const IssueModal = ({ issue, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    status: issue?.status || 'open',
    priority: issue?.priority || 'medium',
    jira_project_key: issue?.jira_project_key || '',
    jira_ticket_id: issue?.jira_ticket_id || '',
    jira_url: issue?.jira_url || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {issue ? 'Edit Issue' : 'Create Issue'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Jira Integration (Optional)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jira Project Key
                </label>
                <input
                  type="text"
                  value={formData.jira_project_key}
                  onChange={(e) => setFormData({ ...formData, jira_project_key: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., PROJ"
                />
                <p className="text-xs text-gray-500 mt-1">The project key in Jira</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jira Ticket ID
                </label>
                <input
                  type="text"
                  value={formData.jira_ticket_id}
                  onChange={(e) => setFormData({ ...formData, jira_ticket_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., PROJ-123"
                />
                <p className="text-xs text-gray-500 mt-1">The full ticket ID from Jira</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jira URL
                </label>
                <input
                  type="url"
                  value={formData.jira_url}
                  onChange={(e) => setFormData({ ...formData, jira_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://your-domain.atlassian.net/browse/PROJ-123"
                />
                <p className="text-xs text-gray-500 mt-1">Direct link to the Jira ticket</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Issue
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {issue ? 'Update Issue' : 'Create Issue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Issues Component
const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg, setCurrentOrg] = useState(() => ApiService.getCurrentOrganization());

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    loadData();
  }, [navigate, currentOrg?.id]);

  // Listen for organization changes
  useEffect(() => {
    const handleOrganizationChange = (event) => {
      const newOrg = event.detail || ApiService.getCurrentOrganization();
      setCurrentOrg(newOrg);
      loadData(); // Refresh data when organization changes
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);
    window.addEventListener('organizationRefresh', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
      window.removeEventListener('organizationRefresh', handleOrganizationChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.request('/api/issues');

      if (response.success) {
        setIssues(response.issues || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = () => {
    setEditingIssue(null);
    setShowModal(true);
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setShowModal(true);
  };

  const handleSaveIssue = async (issueData) => {
    try {
      if (editingIssue) {
        await ApiService.request(`/api/issues/${editingIssue.id}`, {
          method: 'PUT',
          body: issueData
        });
        toast.success('Issue updated successfully');
      } else {
        await ApiService.request('/api/issues', {
          method: 'POST',
          body: issueData
        });
        toast.success('Issue created successfully');
      }
      setShowModal(false);
      setEditingIssue(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save issue');
    }
  };

  const handleDeleteIssue = async () => {
    if (!editingIssue || !confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      await ApiService.request(`/api/issues/${editingIssue.id}`, {
        method: 'DELETE'
      });
      toast.success('Issue deleted successfully');
      setShowModal(false);
      setEditingIssue(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete issue');
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || issue.priority === filterPriority;
    const matchesSearch = searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.jira_ticket_id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusCounts = () => {
    return {
      all: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      in_progress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Issues</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Track and manage issues with Jira integration
            </p>
          </div>
          <button
            onClick={handleCreateIssue}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Issue
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-900">{statusCounts.open}</div>
            <div className="text-sm text-blue-700">Open</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <div className="text-2xl font-bold text-yellow-900">{statusCounts.in_progress}</div>
            <div className="text-sm text-yellow-700">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-900">{statusCounts.resolved}</div>
            <div className="text-sm text-green-700">Resolved</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.closed}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'No issues found matching your filters'
              : 'No issues yet. Create your first issue!'}
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => handleEditIssue(issue)}
            />
          ))
        )}
      </div>

      {showModal && (
        <IssueModal
          issue={editingIssue}
          onClose={() => {
            setShowModal(false);
            setEditingIssue(null);
          }}
          onSave={handleSaveIssue}
          onDelete={editingIssue ? handleDeleteIssue : null}
        />
      )}
    </div>
  );
};

export default Issues;

