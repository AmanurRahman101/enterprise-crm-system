import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Contact } from '../../types/contact';
import { contactService } from '../../services/contactService';
import { CallButton } from '../../components/common/CallButton';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchContact();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchContact = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await contactService.getContact(id);
      setContact(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactService.deleteContact(id);
      navigate('/contacts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-secondary-600">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/contacts')} className="btn-secondary flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Contacts
        </button>
        <div className="alert-danger">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error || 'Contact not found'}</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'notes', label: 'Notes' },
    { id: 'tasks', label: 'Tasks' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/contacts')} className="btn-secondary flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <div className="flex gap-2">
          {/* VoIP Call Button */}
          <CallButton
            contactId={contact.id}
            contactName={`${contact.firstName} ${contact.lastName}`}
            contactEmail={contact.email}
            showVideo={true}
            onCallComplete={(duration) => {
              console.log(`Call completed: ${duration} seconds`);
              // Optionally refresh contact data to show new call log
              fetchContact();
            }}
          />
          <button
            onClick={() => navigate(`/contacts/${id}/edit`)}
            className="btn-secondary flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Contact Header Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start gap-6">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-secondary-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-secondary-100">
                <span className="text-primary-700 font-bold text-3xl">
                  {contact.firstName[0]}{contact.lastName[0]}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900 mb-1">
                    {contact.firstName} {contact.lastName}
                  </h1>
                  {contact.jobTitle && (
                    <p className="text-secondary-600 mb-3">{contact.jobTitle}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge ${contact.isCustomer ? 'badge-success' : 'badge-secondary'}`}>
                      {contact.isCustomer ? 'Customer' : 'Lead'}
                    </span>
                    {Array.isArray(contact.tags) && contact.tags.map(tag => (
                      <span key={tag} className="badge badge-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Contact Information</h2>
              </div>
              <div className="card-body">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      Email
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700">
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-secondary-400">Not provided</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      Phone
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {contact.phone || <span className="text-secondary-400">Not provided</span>}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      Company
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {contact.company?.name || <span className="text-secondary-400">Not provided</span>}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Department
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {contact.department || <span className="text-secondary-400">Not provided</span>}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <GlobeAltIcon className="w-4 h-4" />
                      Language
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {contact.language?.toUpperCase() || 'EN'}
                    </dd>
                  </div>

                  {contact.address && (
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        Address
                      </dt>
                      <dd className="text-sm text-secondary-900">
                        {contact.address}
                        {(contact.city || contact.country) && (
                          <span>, {[contact.city, contact.country].filter(Boolean).join(', ')}</span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Social Links */}
            {(contact.linkedinUrl || contact.twitterUrl) && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-secondary-900">Social Profiles</h2>
                </div>
                <div className="card-body">
                  <div className="flex gap-4">
                    {contact.linkedinUrl && (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {contact.twitterUrl && (
                      <a
                        href={contact.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-secondary-900">Details</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Created by
                  </dt>
                  <dd className="text-sm text-secondary-900">
                    {contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'Not assigned'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Created
                  </dt>
                  <dd className="text-sm text-secondary-900">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Last Updated
                  </dt>
                  <dd className="text-sm text-secondary-900">
                    {new Date(contact.updatedAt).toLocaleDateString()}
                  </dd>
                </div>

                {contact.lastContactedAt && (
                  <div>
                    <dt className="text-sm font-medium text-secondary-500 mb-1 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Last Contacted
                    </dt>
                    <dd className="text-sm text-secondary-900">
                      {new Date(contact.lastContactedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-secondary-500">Activity timeline coming soon...</p>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-secondary-500">Notes section coming soon...</p>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-secondary-500">Tasks section coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetailPage;
