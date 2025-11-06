import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { contactsAPI } from '../services/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: string;
  createdAt: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status?: string;
}

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching contacts...');
      const response = await contactsAPI.getAll();
      console.log('Contacts fetched:', response.data);
      setContacts(response.data.contacts || []);
      console.log('State updated with', (response.data.contacts || []).length, 'contacts');
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.response?.data?.message || 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError(''); // Clear any previous errors
      
      if (editingContact) {
        // Update existing contact
        console.log('Updating contact:', editingContact.id, data);
        const response = await contactsAPI.update(editingContact.id, data);
        console.log('Update response:', response.data);
      } else {
        // Create new contact
        console.log('Creating contact:', data);
        const response = await contactsAPI.create(data);
        console.log('Create response:', response.data);
      }
      
      // Close modal and refresh list
      setIsModalOpen(false);
      setEditingContact(null);
      reset();
      
      // Refresh the contacts list
      console.log('Refreshing contacts list...');
      await fetchContacts();
      console.log('Contacts refreshed successfully');
    } catch (err: any) {
      console.error('Error saving contact:', err);
      setError(err.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    reset(contact);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await contactsAPI.delete(id);
      fetchContacts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const openCreateModal = () => {
    setEditingContact(null);
    reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      status: 'LEAD',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    reset();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Contacts</h1>
          <p className="text-lg text-gray-600">Manage your customer relationships</p>
        </div>
        <button onClick={openCreateModal} className="btn-accent">
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Contact
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">No contacts found</p>
            <p className="text-gray-500 mt-2">Create your first contact to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                      {contact.position && (
                        <div className="text-sm text-gray-500 mt-1">{contact.position}</div>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">
                      {contact.email}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">
                      {contact.phone || '-'}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">
                      {contact.company || '-'}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${
                        contact.status === 'CUSTOMER' ? 'bg-green-100 text-green-800' :
                        contact.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                        contact.status === 'LEAD' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-semibold">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-primary-600 hover:text-primary-900 mr-6 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingContact ? 'Edit Contact' : 'Create New Contact'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                    {...register('firstName', { required: 'First name is required' })}
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                    {...register('lastName', { required: 'Last name is required' })}
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="input-field"
                  {...register('phone')}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    {...register('company')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    {...register('position')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="input-field"
                  {...register('status')}
                >
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingContact ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
