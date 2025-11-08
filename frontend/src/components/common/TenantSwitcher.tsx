import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BuildingOffice2Icon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface AccessibleTenant {
  id: string;
  subdomain: string;
  name: string;
  isPrimary: boolean;
}

export default function TenantSwitcher() {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState(
    localStorage.getItem('tenant') || ''
  );
  const [isOpen, setIsOpen] = useState(false);

  // Get accessible tenants from user object
  const accessibleTenants: AccessibleTenant[] = (user as any)?.accessibleTenants || [];

  const switchTenant = (tenantSubdomain: string) => {
    localStorage.setItem('tenant', tenantSubdomain);
    setCurrentTenant(tenantSubdomain);
    setIsOpen(false);
    
    // Reload page to fetch data for new tenant
    window.location.reload();
  };

  // TEMPORARY: Show always for testing (remove condition later)
  // Don't show switcher if user only has access to one tenant
  // if (accessibleTenants.length <= 1) {
  //   return null;
  // }

  // For debugging: Show the component even with 0 or 1 tenants
  console.log('🔍 [TenantSwitcher] Accessible Tenants:', accessibleTenants);
  console.log('🔍 [TenantSwitcher] User object:', user);

  const currentTenantData = accessibleTenants.find(t => t.subdomain === currentTenant);

  // Fallback: If no accessible tenants from API, show current tenant from localStorage
  const displayName = currentTenantData?.name || currentTenant || 'No Tenant';
  const displayTenants = accessibleTenants.length > 0 ? accessibleTenants : [
    { id: '1', subdomain: currentTenant || 'unknown', name: currentTenant || 'Current Tenant', isPrimary: true }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
      >
        <BuildingOffice2Icon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {displayName}
          </span>
          {currentTenantData?.isPrimary && (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Primary
            </span>
          )}
        </div>
        <ChevronDownIcon className="w-4 h-4 text-secondary-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
              <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400">
                Switch Organization
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                You have access to {accessibleTenants.length} organizations
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {accessibleTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => switchTenant(tenant.subdomain)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors ${
                    tenant.subdomain === currentTenant
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {tenant.name}
                        </p>
                        {tenant.isPrimary && (
                          <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                        {tenant.subdomain}
                      </p>
                    </div>
                    
                    {tenant.subdomain === currentTenant && (
                      <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
