import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import toast from 'react-hot-toast';
import CreateOrganizationModal from './CreateOrganizationModal';

const OrganizationSwitcher = ({ onOrganizationChange }) => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOrganizations();
    const currentOrg = ApiService.getCurrentOrganization();
    setCurrentOrganization(currentOrg);
    
    // Listen for organization changes from other components
    const handleOrganizationChange = (event) => {
      setCurrentOrganization(event.detail);
    };
    
    window.addEventListener('organizationChanged', handleOrganizationChange);
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await ApiService.getOrganizations();
      if (response.success) {
        setOrganizations(response.organizations || []);
        const currentOrg = ApiService.getCurrentOrganization();
        if (currentOrg) {
          setCurrentOrganization(currentOrg);
        } else if (response.organizations && response.organizations.length > 0) {
          // Set first organization as current if none is set
          setCurrentOrganization(response.organizations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const handleSwitchOrganization = async (organizationId) => {
    if (organizationId === currentOrganization?.id) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.switchOrganization(organizationId);
      if (response.success) {
        setCurrentOrganization(response.currentOrganization);
        toast.success(`Switched to ${response.currentOrganization.name}`);
        setIsOpen(false);
        
        // Update localStorage and notify parent component
        if (onOrganizationChange) {
          onOrganizationChange(response.currentOrganization);
        }
        
        // Dispatch custom event to notify all components to refresh
        window.dispatchEvent(new CustomEvent('organizationChanged', {
          detail: response.currentOrganization
        }));
        
        // Dispatch a refresh event to force all pages to reload data
        window.dispatchEvent(new CustomEvent('organizationRefresh', {
          detail: response.currentOrganization
        }));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to switch organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (response) => {
    // Reload organizations list
    loadOrganizations();
    
    // Update current organization if new token is returned
    if (response.token) {
      const user = ApiService.getUser();
      const organizations = response.organizations || [response.currentOrganization];
      
      ApiService.setAuth(
        response.token,
        user,
        response.currentOrganization,
        organizations
      );
      
      setCurrentOrganization(response.currentOrganization);
      
      // Notify parent component
      if (onOrganizationChange) {
        onOrganizationChange(response.currentOrganization);
      } else {
        window.dispatchEvent(new CustomEvent('organizationChanged', {
          detail: response.currentOrganization
        }));
      }
    }
    
    // Close dropdown
    setIsOpen(false);
  };

  // Always show the component - users need to be able to create organizations
  // even if they don't have any yet

  // If no organizations exist, show create button directly
  if (!currentOrganization && organizations.length === 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Organization
        </button>
        {showCreateModal && (
          <CreateOrganizationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 transition-all"
      >
        <div className="flex items-center flex-1 min-w-0">
          <svg
            className="w-4 h-4 mr-2 text-indigo-600 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate text-left font-semibold">
            {currentOrganization?.name || 'Select Organization'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {organizations.length > 0 ? (
                <>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSwitchOrganization(org.id)}
                      disabled={loading}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                        org.id === currentOrganization?.id
                          ? 'bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50 mb-1 last:mb-0`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{org.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 capitalize">{org.role}</div>
                        </div>
                        {org.id === currentOrganization?.id && (
                          <svg
                            className="w-5 h-5 text-indigo-600 shrink-0 ml-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowCreateModal(true);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Organization
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-3 py-4 text-center text-sm text-gray-500 mb-2">
                    No organizations available
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Organization
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default OrganizationSwitcher;

