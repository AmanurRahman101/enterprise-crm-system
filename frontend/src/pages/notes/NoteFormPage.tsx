import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface Deal {
  id: string;
  title: string;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
}

const NoteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [content, setContent] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [ticketId, setTicketId] = useState('');

  // Available options for linking
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch note data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch available contacts, deals, tickets
        const [contactsRes, dealsRes, ticketsRes] = await Promise.all([
          api.get('/contacts?limit=100'),
          api.get('/deals?limit=100'),
          api.get('/tickets?limit=100'),
        ]);

        setContacts(contactsRes.data.data?.items || contactsRes.data.items || []);
        setDeals(dealsRes.data.data?.items || dealsRes.data.items || []);
        setTickets(ticketsRes.data.data?.items || ticketsRes.data.items || []);

        // If edit mode, fetch note data
        if (isEditMode) {
          const noteRes = await api.get(`/notes/${id}`);
          const note = noteRes.data;
          
          setContent(note.content || '');
          setContactId(note.contactId || '');
          setDealId(note.dealId || '');
          setTicketId(note.ticketId || '');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!content.trim()) {
      setError('Note content is required');
      setLoading(false);
      return;
    }

    if (!contactId && !dealId && !ticketId) {
      setError('Please link this note to at least one entity (Contact, Deal, or Ticket)');
      setLoading(false);
      return;
    }

    try {
      const noteData = {
        content: content.trim(),
        contactId: contactId || null,
        dealId: dealId || null,
        ticketId: ticketId || null,
        authorId: user?.id,
      };

      if (isEditMode) {
        await api.put(`/notes/${id}`, noteData);
        setSuccess('Note updated successfully!');
      } else {
        await api.post('/notes', noteData);
        setSuccess('Note created successfully!');
      }

      setTimeout(() => {
        navigate('/notes');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/notes');
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            {isEditMode ? 'Edit Note' : 'Create New Note'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Update your note details below' : 'Add a new note and link it to contacts, deals, or tickets'}
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
            <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            <span className="text-sm text-green-800 dark:text-green-300">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
            <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-6 space-y-6">
            {/* Note Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
                placeholder="Write your note here..."
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {content.length} characters
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Link to Entities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Link this note to one or more entities (at least one is required)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Link to Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <UserCircleIcon className="h-4 w-4 inline mr-1" />
                    Contact
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link to Deal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                    Deal
                  </label>
                  <select
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link to Ticket */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TicketIcon className="h-4 w-4 inline mr-1" />
                    Ticket
                  </label>
                  <select
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {tickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        #{ticket.ticketNumber} - {ticket.subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteFormPage;
