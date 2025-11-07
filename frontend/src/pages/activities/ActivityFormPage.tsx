import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ActivityType, Contact, Deal, Ticket } from '../../types';
import api from '../../services/api';

const ActivityFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    type: ActivityType.CALL,
    subject: '',
    description: '',
    duration: '',
    outcome: '',
    contactId: '',
    dealId: '',
    ticketId: '',
    occurredAt: new Date().toISOString().slice(0, 16),
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (isEditMode && id) {
      fetchActivity(id);
    } else {
      setLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [contactsRes, dealsRes, ticketsRes] = await Promise.all([
        api.get('/contacts?limit=100'),
        api.get('/deals?limit=100'),
        api.get('/tickets?limit=100'),
      ]);

      setContacts(contactsRes.data.data || contactsRes.data.contacts || contactsRes.data.items || []);
      setDeals(dealsRes.data.data || dealsRes.data.deals || dealsRes.data.items || []);
      setTickets(ticketsRes.data.data || ticketsRes.data.tickets || ticketsRes.data.items || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      // Set empty arrays on error to prevent crashes
      setContacts([]);
      setDeals([]);
      setTickets([]);
    }
  };

  const fetchActivity = async (activityId: string) => {
    try {
      setLoadingData(true);
      const response = await api.get(`/activities/${activityId}`);
      const activity = response.data;

      setFormData({
        type: activity.type,
        subject: activity.subject,
        description: activity.description || '',
        duration: activity.duration?.toString() || '',
        outcome: activity.outcome || '',
        contactId: activity.contactId || '',
        dealId: activity.dealId || '',
        ticketId: activity.ticketId || '',
        occurredAt: activity.occurredAt
          ? new Date(activity.occurredAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch activity');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.type || !formData.subject || !formData.contactId) {
      setError('Please fill in all required fields (Type, Subject, Contact)');
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        outcome: formData.outcome || undefined,
        contactId: formData.contactId,
        dealId: formData.dealId || undefined,
        ticketId: formData.ticketId || undefined,
        occurredAt: formData.occurredAt ? new Date(formData.occurredAt).toISOString() : undefined,
      };

      if (isEditMode && id) {
        await api.put(`/activities/${id}`, payload);
      } else {
        await api.post('/activities', payload);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/activities');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/activities')}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Activities
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Activity' : 'Log New Activity'}
        </h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
          Activity {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={ActivityType.CALL}>Call</option>
              <option value={ActivityType.EMAIL}>Email</option>
              <option value={ActivityType.MEETING}>Meeting</option>
              <option value={ActivityType.NOTE}>Note</option>
              <option value={ActivityType.TASK}>Task</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Follow-up call with client"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Add details about this activity..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Contact (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact <span className="text-red-500">*</span>
            </label>
            <select
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a contact</option>
              {Array.isArray(contacts) && contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName} {contact.email && `(${contact.email})`}
                </option>
              ))}
            </select>
          </div>

          {/* Deal (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Related Deal (Optional)
            </label>
            <select
              name="dealId"
              value={formData.dealId}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              {Array.isArray(deals) && deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title} (${deal.value})
                </option>
              ))}
            </select>
          </div>

          {/* Ticket (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Related Ticket (Optional)
            </label>
            <select
              name="ticketId"
              value={formData.ticketId}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              {Array.isArray(tickets) && tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.subject} ({ticket.status})
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              name="occurredAt"
              value={formData.occurredAt}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Duration (in minutes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 30"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Outcome
            </label>
            <select
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select outcome</option>
              <option value="Successful">Successful</option>
              <option value="No Answer">No Answer</option>
              <option value="Voicemail">Voicemail</option>
              <option value="Callback Requested">Callback Requested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Follow-up Needed">Follow-up Needed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/activities')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Activity' : 'Log Activity'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ActivityFormPage;
