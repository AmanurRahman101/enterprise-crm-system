import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  CalendarIcon,
  LinkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Note } from '../../types';

const NoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/notes/${id}`);
        setNote(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNote();
    }
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/notes/${id}`);
      navigate('/notes');
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete note');
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading note...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-800 dark:text-red-300">{error || 'Note not found'}</p>
            <Link
              to="/notes"
              className="mt-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Notes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/notes"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Notes
          </Link>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
              Note Details
            </h1>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/notes/${note.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Note Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Meta Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author */}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Author:</span>{' '}
                  {note.author?.firstName} {note.author?.lastName}
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Created:</span>{' '}
                  {formatDate(note.createdAt)}
                </div>
              </div>

              {/* Updated Date */}
              {note.updatedAt !== note.createdAt && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Updated:</span>{' '}
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Note Content */}
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
                {note.content}
              </div>
            </div>
          </div>

          {/* Linked Entities */}
          {(note.contact || note.deal || note.ticket) && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                Linked To
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Contact */}
                {note.contact && (
                  <Link
                    to={`/contacts/${note.contactId}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    <div>
                      <div className="text-xs font-medium">Contact</div>
                      <div className="text-sm">
                        {note.contact.firstName} {note.contact.lastName}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Deal */}
                {note.deal && (
                  <Link
                    to={`/deals/${note.dealId}`}
                    className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    <div>
                      <div className="text-xs font-medium">Deal</div>
                      <div className="text-sm">{note.deal.title}</div>
                    </div>
                  </Link>
                )}

                {/* Ticket */}
                {note.ticket && (
                  <Link
                    to={`/tickets/${note.ticketId}`}
                    className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    <div>
                      <div className="text-xs font-medium">Ticket</div>
                      <div className="text-sm">#{note.ticket.ticketNumber}</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
