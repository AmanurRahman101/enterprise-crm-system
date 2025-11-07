import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import taskService from '../../services/taskService';
import { contactService } from '../../services/contactService';
import { dealService } from '../../services/dealService';
import { TaskFormData, TASK_STATUSES, TASK_PRIORITIES } from '../../types/task';
import { useAuth } from '../../context/AuthContext';

const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    contactId: '',
    dealId: '',
    assigneeId: user?.id || '',
  });

  // Load contacts, deals, and users for dropdowns
  const loadOptions = useCallback(async () => {
    try {
      const [contactsRes, dealsRes] = await Promise.all([
        contactService.getContacts(1, 100),
        dealService.getDeals(1, 100),
      ]);
      setContacts(contactsRes.contacts || []);
      setDeals(dealsRes.data || []);
      // In a real app, you'd have a userService to get users
      // For now, we'll just set the current user as an option
      if (user) {
        setUsers([user]);
      }
    } catch (err) {
      console.error('Error loading options:', err);
    }
  }, [user]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskService.getTask(id!);
      setFormData({
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate 
          ? new Date(data.dueDate).toISOString().slice(0, 16) 
          : '',
        contactId: data.contactId || '',
        dealId: data.dealId || '',
        assigneeId: data.assigneeId,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode && id) {
      loadTask();
    }
  }, [isEditMode, id, loadTask]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.assigneeId) {
      setError('Assignee is required');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data
      const submitData: TaskFormData = {
        ...formData,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        contactId: formData.contactId || undefined,
        dealId: formData.dealId || undefined,
      };

      if (isEditMode) {
        await taskService.updateTask(id!, submitData);
      } else {
        await taskService.createTask(submitData);
      }
      navigate('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.title) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading task...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditMode ? 'Edit Task' : 'Create Task'}
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            {isEditMode ? 'Update task information' : 'Create a new task'}
          </p>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Cancel
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-danger mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Task Details
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-secondary-700">
                  Title <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detailed description of the task..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-secondary-700">
                    Status <span className="text-danger-600">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-secondary-700">
                    Priority <span className="text-danger-600">*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    required
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Assignment
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-secondary-700">
                  Assign To <span className="text-danger-600">*</span>
                </label>
                <select
                  id="assigneeId"
                  name="assigneeId"
                  required
                  value={formData.assigneeId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Related Entities */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Related To (Optional)
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactId" className="block text-sm font-medium text-secondary-700">
                  Contact
                </label>
                <select
                  id="contactId"
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">No Contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email && ` (${contact.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dealId" className="block text-sm font-medium text-secondary-700">
                  Deal
                </label>
                <select
                  id="dealId"
                  name="dealId"
                  value={formData.dealId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">No Deal</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title} - ${deal.value.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Task'
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskFormPage;
