import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ticketService from '../../services/ticketService';
import { contactService } from '../../services/contactService';
import { TicketFormData, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_SOURCES, TICKET_CATEGORIES } from '../../types/ticket';
import { useAuth } from '../../context/AuthContext';

const TicketFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: '',
    source: 'EMAIL',
    tags: [],
    slaDeadline: '',
    contactId: '',
    assigneeId: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Load contacts for dropdown
  const loadOptions = useCallback(async () => {
    try {
      const contactsRes = await contactService.getContacts(1, 100);
      setContacts(contactsRes.contacts || []);
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

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicket(id!);
      setFormData({
        subject: data.subject,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category || '',
        source: data.source,
        tags: data.tags || [],
        slaDeadline: data.slaDeadline 
          ? new Date(data.slaDeadline).toISOString().slice(0, 16) 
          : '',
        contactId: data.contactId,
        assigneeId: data.assigneeId || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode && id) {
      loadTicket();
    }
  }, [isEditMode, id, loadTicket]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.contactId) {
      setError('Contact is required');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data
      const submitData: TicketFormData = {
        ...formData,
        category: formData.category || undefined,
        slaDeadline: formData.slaDeadline || undefined,
        assigneeId: formData.assigneeId || undefined,
      };

      if (isEditMode) {
        await ticketService.updateTicket(id!, submitData);
      } else {
        await ticketService.createTicket(submitData);
      }
      navigate('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save ticket');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.subject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading ticket...</p>
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
            {isEditMode ? 'Edit Ticket' : 'Create Ticket'}
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            {isEditMode ? 'Update ticket information' : 'Create a new support ticket'}
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
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
        {/* Ticket Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Ticket Details
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-secondary-700">
                  Subject <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                  Description <span className="text-danger-600">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detailed description of the issue..."
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
                    {TICKET_STATUSES.map((status) => (
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
                    {TICKET_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Category</option>
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-secondary-700">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    {TICKET_SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="slaDeadline" className="block text-sm font-medium text-secondary-700">
                    SLA Deadline
                  </label>
                  <input
                    type="datetime-local"
                    id="slaDeadline"
                    name="slaDeadline"
                    value={formData.slaDeadline}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-primary-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Assignment */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Contact & Assignment
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactId" className="block text-sm font-medium text-secondary-700">
                  Contact <span className="text-danger-600">*</span>
                </label>
                <select
                  id="contactId"
                  name="contactId"
                  required
                  value={formData.contactId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email && ` (${contact.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-secondary-700">
                  Assign To
                </label>
                <select
                  id="assigneeId"
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Unassigned</option>
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

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
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
              'Update Ticket'
            ) : (
              'Create Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketFormPage;
