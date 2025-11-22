import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import { hasPermission, canDelete } from '../../utils/permissions';

// Click outside to close dropdown
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

// Tabs Component
const Tabs = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'people', label: 'People', icon: '👤' },
    { id: 'organizations', label: 'Organizations', icon: '🏢' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Person Card Component
const PersonCard = ({ person, onEdit, onDelete, onCall, canDeleteContact }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {person.firstName} {person.lastName}
          </h3>
          {person.jobTitle && (
            <p className="text-sm text-gray-600 mt-1">{person.jobTitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {person.userId && onCall && (
            <button
              onClick={() => onCall(person)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(person)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canDeleteContact && (
            <button
              onClick={() => onDelete(person.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        {person.email && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${person.email}`} className="hover:text-indigo-600 transition-colors">
              {person.email}
            </a>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${person.phone}`} className="hover:text-indigo-600 transition-colors">
              {person.phone}
            </a>
          </div>
        )}
      </div>

      {person.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{person.notes}</p>
        </div>
      )}
    </div>
  );
};

// Organization Card Component
const OrganizationCard = ({ organization, onEdit, onDelete, onCall, canDeleteContact }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
          {organization.website && (
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
            >
              {organization.website}
            </a>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {organization.linkedOrganizationId && onCall && (
            <button
              onClick={() => onCall(organization)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Call Organization"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(organization)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canDeleteContact && (
            <button
              onClick={() => onDelete(organization.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        {organization.email && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${organization.email}`} className="hover:text-indigo-600 transition-colors">
              {organization.email}
            </a>
          </div>
        )}
        {organization.phone && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${organization.phone}`} className="hover:text-indigo-600 transition-colors">
              {organization.phone}
            </a>
          </div>
        )}
        {organization.address && (
          <div className="flex items-start">
            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{organization.address}</span>
          </div>
        )}
      </div>

      {organization.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{organization.notes}</p>
        </div>
      )}
    </div>
  );
};

// Person Modal Component - Only allows selecting existing users
const PersonModal = ({ person, onClose, onSave }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    userId: null,
    jobTitle: person?.jobTitle || '',
    notes: person?.notes || ''
  });

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setShowDropdown(false));

  // Load available users on mount or when search query changes
  useEffect(() => {
    const loadUsers = async () => {
      if (searchQuery.length < 2 && searchQuery.length > 0) return; // Don't search for single character
      
      try {
        setLoadingUsers(true);
        const response = await ApiService.getAvailableUsers(searchQuery);
        if (response.success) {
          setAvailableUsers(response.users || []);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const timer = setTimeout(() => {
      if (searchQuery) {
        loadUsers();
      } else {
        // Load initial users on mount
        loadUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (user) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setSearchQuery(user.fullName || user.email);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedUserId && !person) {
      toast.error('Please select a user from the system');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {person ? 'Edit Contact' : 'Add Contact from System'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!person && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User from System *
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : availableUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-400">{user.phone}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm font-medium text-indigo-900">Selected: {selectedUser.fullName}</div>
                    <div className="text-xs text-indigo-700">{selectedUser.email}</div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only users who have signed up to the system can be added as contacts (for calling feature).
              </p>
            </div>
          )}

          {person && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Contact:</div>
              <div className="font-medium text-gray-900">{person.firstName} {person.lastName}</div>
              <div className="text-sm text-gray-600">{person.email}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title (Optional)
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g., Manager, Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Additional notes about this contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {person ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Organization Modal Component - Only allows selecting existing organizations
const OrganizationModal = ({ organization, onClose, onSave }) => {
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    organizationId: null,
    notes: organization?.notes || ''
  });

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setShowDropdown(false));

  // Load available organizations on mount or when search query changes
  useEffect(() => {
    const loadOrganizations = async () => {
      if (searchQuery.length < 2 && searchQuery.length > 0) return;
      
      try {
        setLoadingOrgs(true);
        const response = await ApiService.getAvailableOrganizations(searchQuery);
        if (response.success) {
          setAvailableOrganizations(response.organizations || []);
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
        setAvailableOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    const timer = setTimeout(() => {
      if (searchQuery) {
        loadOrganizations();
      } else {
        loadOrganizations();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOrgSelect = (org) => {
    setSelectedOrgId(org.id);
    setSelectedOrg(org);
    setFormData({ ...formData, organizationId: org.id });
    setSearchQuery(org.name);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedOrgId && !organization) {
      toast.error('Please select an organization from the system');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {organization ? 'Edit Contact' : 'Add Organization from System'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!organization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Organization from System *
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingOrgs ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : availableOrganizations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No organizations found'}
                      </div>
                    ) : (
                      availableOrganizations.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleOrgSelect(org)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{org.name}</div>
                          {org.email && (
                            <div className="text-sm text-gray-500">{org.email}</div>
                          )}
                          {org.phone && (
                            <div className="text-xs text-gray-400">{org.phone}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedOrg && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm font-medium text-indigo-900">Selected: {selectedOrg.name}</div>
                    {selectedOrg.email && (
                      <div className="text-xs text-indigo-700">{selectedOrg.email}</div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only organizations that exist in the system can be added as contacts.
              </p>
            </div>
          )}

          {organization && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Organization:</div>
              <div className="font-medium text-gray-900">{organization.name}</div>
              {organization.email && (
                <div className="text-sm text-gray-600">{organization.email}</div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Additional notes about this organization..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {organization ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Contacts Component
const Contacts = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('people');
  const [people, setPeople] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg] = useState(() => ApiService.getCurrentOrganization());
  const userRole = currentOrg?.role || 'viewer';

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.request('/api/contacts');

      if (response.success) {
        setPeople(response.people || []);
        setOrganizations(response.organizations || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = () => {
    setEditingItem(null);
    setActiveTab('people');
    setShowModal(true);
  };

  const handleCreateOrganization = () => {
    setEditingItem(null);
    setActiveTab('organizations');
    setShowModal(true);
  };

  const handleEditPerson = (person) => {
    setEditingItem(person);
    setShowModal(true);
  };

  const handleEditOrganization = (org) => {
    setEditingItem(org);
    setShowModal(true);
  };

  const handleCallContact = async (contact) => {
    // Check if user has permission to make calls (viewers cannot)
    if (userRole === 'viewer') {
      toast.error('You do not have permission to make calls. Viewers can only view information.');
      return;
    }

    // Check if window.makeCall is available (from CallInterface component)
    if (!window.makeCall) {
      toast.error('Call feature is not initialized yet. Please refresh the page.');
      return;
    }

    // Format contact data for calling
    const contactData = {
      id: contact.id,
      type: contact.hasOwnProperty('firstName') ? 'person' : 'organization',
      userId: contact.userId || null,
      linkedOrganizationId: contact.linkedOrganizationId || null,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      name: contact.name || '',
    };

    console.log('Calling contact:', contactData);

    try {
      await window.makeCall(contactData);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
    }
  };

  const handleSavePerson = async (personData) => {
    try {
      if (editingItem) {
        // For editing, only update notes and jobTitle
        await ApiService.request(`/api/contacts/people/${editingItem.id}`, {
          method: 'PUT',
          body: {
            firstName: editingItem.firstName,
            lastName: editingItem.lastName,
            email: editingItem.email,
            phone: editingItem.phone,
            jobTitle: personData.jobTitle,
            notes: personData.notes
          }
        });
        toast.success('Contact updated successfully');
      } else {
        // For creating, send userId
        await ApiService.request('/api/contacts/people', {
          method: 'POST',
          body: {
            userId: personData.userId,
            jobTitle: personData.jobTitle,
            notes: personData.notes
          }
        });
        toast.success('Contact added successfully');
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save contact');
    }
  };

  const handleSaveOrganization = async (orgData) => {
    try {
      if (editingItem) {
        // For editing, only update notes
        await ApiService.request(`/api/contacts/organizations/${editingItem.id}`, {
          method: 'PUT',
          body: {
            name: editingItem.name,
            email: editingItem.email,
            phone: editingItem.phone,
            address: editingItem.address,
            website: editingItem.website,
            notes: orgData.notes
          }
        });
        toast.success('Contact updated successfully');
      } else {
        // For creating, send organizationId
        await ApiService.request('/api/contacts/organizations', {
          method: 'POST',
          body: {
            organizationId: orgData.organizationId,
            notes: orgData.notes
          }
        });
        toast.success('Contact added successfully');
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save contact');
    }
  };

  const handleDeletePerson = async (personId) => {
    if (!confirm('Are you sure you want to delete this person?')) {
      return;
    }

    try {
      await ApiService.request(`/api/contacts/people/${personId}`, {
        method: 'DELETE'
      });
      toast.success('Person deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete person');
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await ApiService.request(`/api/contacts/organizations/${orgId}`, {
        method: 'DELETE'
      });
      toast.success('Organization deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete organization');
    }
  };

  const filteredPeople = people.filter(person =>
    searchQuery === '' ||
    `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.phone?.includes(searchQuery)
  );

  const filteredOrganizations = organizations.filter(org =>
    searchQuery === '' ||
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.phone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Manage your contact people and organizations
            </p>
          </div>
          {hasPermission(userRole, 'CREATE_CONTACT') && (
            <button
              onClick={activeTab === 'people' ? handleCreatePerson : handleCreateOrganization}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add {activeTab === 'people' ? 'Person' : 'Organization'}
          </button>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <Tabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'people' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchQuery ? 'No people found matching your search' : 'No people yet. Create your first contact!'}
            </div>
          ) : (
            filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onEdit={handleEditPerson}
                onDelete={handleDeletePerson}
                onCall={userRole !== 'viewer' ? handleCallContact : null}
                canDeleteContact={canDelete(userRole, 'DELETE_CONTACT', person.createdByUserId, user.userId)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'organizations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizations.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchQuery ? 'No organizations found matching your search' : 'No organizations yet. Create your first organization!'}
            </div>
          ) : (
            filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onEdit={handleEditOrganization}
                onDelete={handleDeleteOrganization}
                onCall={userRole !== 'viewer' ? handleCallContact : null}
                canDeleteContact={canDelete(userRole, 'DELETE_CONTACT', org.createdByUserId, user.userId)}
              />
            ))
          )}
        </div>
      )}

      {showModal && activeTab === 'people' && (
        <PersonModal
          person={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSavePerson}
        />
      )}

      {showModal && activeTab === 'organizations' && (
        <OrganizationModal
          organization={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveOrganization}
        />
      )}
    </div>
  );
};

export default Contacts;

