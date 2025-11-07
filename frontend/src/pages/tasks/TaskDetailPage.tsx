import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import taskService from '../../services/taskService';
import { Task, TASK_STATUSES, TASK_PRIORITIES, getDueDateStatus, isTaskOverdue } from '../../types/task';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'>('overview');

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTask(id!);
      setTask(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id, loadTask]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the task "${task?.title}"?`)) {
      try {
        await taskService.deleteTask(id!);
        navigate('/tasks');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await taskService.updateTaskStatus(task.id, newStatus);
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="alert-danger">
        <p>{error || 'Task not found'}</p>
      </div>
    );
  }

  const statusConfig = TASK_STATUSES.find((s) => s.value === task.status);
  const priorityConfig = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const dueDateStatus = getDueDateStatus(task);
  const overdue = isTaskOverdue(task);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Tasks
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleToggleComplete}
            className={`btn-${task.status === 'COMPLETED' ? 'secondary' : 'success'} flex items-center gap-2`}
          >
            <CheckCircleIcon className="h-5 w-5" />
            {task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button
            onClick={() => navigate(`/tasks/${id}/edit`)}
            className="btn-primary flex items-center gap-2"
          >
            <PencilIcon className="h-5 w-5" />
            Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-danger mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-secondary-900">
                      {task.title}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge-${statusConfig?.color}`}>
                  {statusConfig?.label}
                </span>
                <span className={`badge-${priorityConfig?.color}`}>
                  {priorityConfig?.label} Priority
                </span>
                {task.dueDate && (
                  <span className={`badge-${overdue ? 'danger' : dueDateStatus.color}`}>
                    {dueDateStatus.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-secondary-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
                  }`}
                >
                  Overview
                </button>
              </nav>
            </div>

            <div className="card-body">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Description */}
                  {task.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                        Description
                      </h3>
                      <div className="card bg-secondary-50">
                        <div className="card-body">
                          <p className="text-secondary-700 whitespace-pre-wrap">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                      Task Information
                    </h3>
                    <div className="card bg-secondary-50">
                      <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Assignee */}
                          <div className="flex items-start gap-3">
                            <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-secondary-600">
                                Assigned To
                              </div>
                              <div className="mt-1 text-secondary-900">
                                {task.assignee.firstName} {task.assignee.lastName}
                              </div>
                              <div className="text-sm text-secondary-600">
                                {task.assignee.email}
                              </div>
                            </div>
                          </div>

                          {/* Creator */}
                          <div className="flex items-start gap-3">
                            <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-secondary-600">
                                Created By
                              </div>
                              <div className="mt-1 text-secondary-900">
                                {task.creator.firstName} {task.creator.lastName}
                              </div>
                              <div className="text-sm text-secondary-600">
                                {task.creator.email}
                              </div>
                            </div>
                          </div>

                          {/* Due Date */}
                          <div className="flex items-start gap-3">
                            <ClockIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-secondary-600">
                                Due Date
                              </div>
                              <div className="mt-1 text-secondary-900">
                                {formatDateOnly(task.dueDate)}
                              </div>
                            </div>
                          </div>

                          {/* Completed At */}
                          {task.completedAt && (
                            <div className="flex items-start gap-3">
                              <CheckCircleIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-secondary-600">
                                  Completed At
                                </div>
                                <div className="mt-1 text-secondary-900">
                                  {formatDate(task.completedAt)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Entities */}
                  {(task.contact || task.deal) && (
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                        Related To
                      </h3>
                      <div className="card bg-secondary-50">
                        <div className="card-body space-y-4">
                          {/* Contact */}
                          {task.contact && (
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-secondary-600">
                                  Contact
                                </div>
                                <Link
                                  to={`/contacts/${task.contact.id}`}
                                  className="mt-1 text-primary-600 hover:text-primary-900 font-medium"
                                >
                                  {task.contact.firstName} {task.contact.lastName}
                                </Link>
                                {task.contact.email && (
                                  <div className="text-sm text-secondary-600">
                                    {task.contact.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Deal */}
                          {task.deal && (
                            <div className="flex items-start gap-3">
                              <BriefcaseIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-secondary-600">
                                  Deal
                                </div>
                                <Link
                                  to={`/deals/${task.deal.id}`}
                                  className="mt-1 text-primary-600 hover:text-primary-900 font-medium"
                                >
                                  {task.deal.title}
                                </Link>
                                <div className="text-sm text-secondary-600">
                                  ${task.deal.value.toLocaleString()} • {task.deal.stage}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">
                Task Timeline
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-secondary-600">
                    Created
                  </div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(task.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-600">
                    Last Updated
                  </div>
                  <div className="mt-1 text-sm text-secondary-900">
                    {formatDate(task.updatedAt)}
                  </div>
                </div>
                {task.completedAt && (
                  <div>
                    <div className="text-sm font-medium text-secondary-600">
                      Completed
                    </div>
                    <div className="mt-1 text-sm text-secondary-900">
                      {formatDate(task.completedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
