import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Contact, ContactFilters } from '../../types/contact';
import { contactService } from '../../services/contactService';

const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>({});

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contactService.getContacts(page, limit, {
        ...filters,
        search: searchQuery || undefined,
      });
      setContacts(response.contacts);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactService.deleteContact(id);
      fetchContacts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-secondary-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Contacts</h1>
          <p className="text-sm text-secondary-600 mt-1">
            Manage your contacts and customer relationships
          </p>
        </div>
        <button
          onClick={() => navigate('/contacts/new')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search contacts by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-300' : ''}`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Type
                  </label>
                  <select
                    value={filters.isCustomer === undefined ? '' : filters.isCustomer.toString()}
                    onChange={(e) => handleFilterChange('isCustomer', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Contacts</option>
                    <option value="true">Customers Only</option>
                    <option value="false">Leads Only</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-danger">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Contacts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <UserCircleIcon className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
                    <p className="text-secondary-600 mb-2">No contacts found</p>
                    <button
                      onClick={() => navigate('/contacts/new')}
                      className="btn-primary btn-sm inline-flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Your First Contact
                    </button>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-secondary-50">
                    <td>
                      <div className="flex items-center gap-3">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-semibold text-sm">
                              {contact.firstName[0]}{contact.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <button
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            className="font-medium text-secondary-900 hover:text-primary-600"
                          >
                            {contact.firstName} {contact.lastName}
                          </button>
                          {contact.jobTitle && (
                            <p className="text-sm text-secondary-600">{contact.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {contact.email ? (
                        <div className="flex items-center gap-2 text-secondary-700">
                          <EnvelopeIcon className="w-4 h-4 text-secondary-400" />
                          <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
                            {contact.email}
                          </a>
                        </div>
                      ) : (
                        <span className="text-secondary-400">—</span>
                      )}
                    </td>
                    <td>
                      {contact.phone || contact.mobile ? (
                        <div className="flex items-center gap-2 text-secondary-700">
                          <PhoneIcon className="w-4 h-4 text-secondary-400" />
                          {contact.phone || contact.mobile}
                        </div>
                      ) : (
                        <span className="text-secondary-400">—</span>
                      )}
                    </td>
                    <td>
                      {contact.company ? (
                        <div className="flex items-center gap-2 text-secondary-700">
                          <BuildingOfficeIcon className="w-4 h-4 text-secondary-400" />
                          {contact.company.name}
                        </div>
                      ) : (
                        <span className="text-secondary-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${contact.isCustomer ? 'badge-success' : 'badge-secondary'}`}>
                        {contact.isCustomer ? 'Customer' : 'Lead'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                          className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-secondary-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-600">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> contacts
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactListPage;
