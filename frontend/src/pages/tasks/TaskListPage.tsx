import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import taskService from '../../services/taskService';
import { Task, TaskFilters, TASK_STATUSES, TASK_PRIORITIES, getDueDateStatus, isTaskOverdue } from '../../types/task';

const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchFilters: TaskFilters = { ...filters };
      
      const response = await taskService.getTasks(page, limit, searchFilters);
      // Handle backend response structure: { data, pagination }
      setTasks(response.data || response.tasks || []);
      setTotal(response.pagination?.total || response.total || 0);
      setTotalPages(response.pagination?.totalPages || response.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the task "${title}"?`)) {
      try {
        await taskService.deleteTask(id);
        loadTasks();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await taskService.updateTaskStatus(task.id, newStatus);
      loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const filteredTasks = searchQuery
    ? tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assignee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assignee.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return date.toLocaleDateString();
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Tasks</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Manage and track your tasks
          </p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(filters.status || filters.priority) && (
              <button
                onClick={clearFilters}
                className="text-sm text-secondary-600 hover:text-secondary-700"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  {TASK_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All Priorities</option>
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-danger mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Tasks Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-secondary-600">Loading tasks...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClockIcon className="h-16 w-16 text-secondary-400 mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No tasks found
              </h3>
              <p className="text-secondary-600 mb-4">
                {searchQuery || filters.status || filters.priority
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first task'}
              </p>
              {!searchQuery && !filters.status && !filters.priority && (
                <button
                  onClick={() => navigate('/tasks/new')}
                  className="btn-primary"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12"></th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Related To</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const dueDateStatus = getDueDateStatus(task);
                      const overdue = isTaskOverdue(task);

                      return (
                        <tr
                          key={task.id}
                          className="cursor-pointer hover:bg-secondary-50"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleComplete(task)}
                              className={`${
                                task.status === 'COMPLETED'
                                  ? 'text-success-600'
                                  : 'text-secondary-400 hover:text-primary-600'
                              }`}
                            >
                              <CheckCircleIcon
                                className={`h-6 w-6 ${
                                  task.status === 'COMPLETED' ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                          </td>
                          <td>
                            <div className="font-medium text-secondary-900">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-secondary-600 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge-${TASK_STATUSES.find((s) => s.value === task.status)?.color || 'secondary'}`}>
                              {TASK_STATUSES.find((s) => s.value === task.status)?.label}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-${TASK_PRIORITIES.find((p) => p.value === task.priority)?.color || 'secondary'}`}>
                              {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                            </span>
                          </td>
                          <td>
                            <div className="text-sm">
                              {task.assignee.firstName} {task.assignee.lastName}
                            </div>
                          </td>
                          <td>
                            {task.dueDate ? (
                              <div>
                                <span className={`badge-${overdue ? 'danger' : dueDateStatus.color}`}>
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-secondary-500">No due date</span>
                            )}
                          </td>
                          <td>
                            <div className="text-sm space-y-1">
                              {task.contact && (
                                <div className="text-secondary-600">
                                  Contact: {task.contact.firstName} {task.contact.lastName}
                                </div>
                              )}
                              {task.deal && (
                                <div className="text-secondary-600">
                                  Deal: {task.deal.title}
                                </div>
                              )}
                              {!task.contact && !task.deal && (
                                <span className="text-secondary-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id, task.title)}
                                className="text-danger-600 hover:text-danger-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-secondary-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-secondary-600">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} tasks
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListPage;
