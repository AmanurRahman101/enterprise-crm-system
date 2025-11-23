import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import { hasPermission, canDelete } from '../../utils/permissions';
import { validators } from '../../utils/validation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Deal Card Component
const SortableDealCard = ({ deal, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 hover:shadow-md transition-shadow relative group"
    >
      {/* Drag handle area */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-move z-10"
        onClick={(e) => {
          // Prevent edit when clicking on drag handle
          e.stopPropagation();
        }}
      />
      
      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(deal);
        }}
        className="absolute top-2 right-2 z-20 p-1.5 bg-indigo-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700"
        title="Edit deal"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <h3 className="font-semibold text-gray-900 mb-2 pr-8">{deal.title}</h3>
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="font-medium">Value:</span>
          <span className="ml-2">{formatCurrency(deal.value, deal.currency)}</span>
        </div>
        {deal.contactPerson && (
          <div className="flex items-center">
            <span className="font-medium">Contact:</span>
            <span className="ml-2">{deal.contactPerson.name}</span>
          </div>
        )}
        {deal.contactOrg && (
          <div className="flex items-center">
            <span className="font-medium">Organization:</span>
            <span className="ml-2">{deal.contactOrg.name}</span>
          </div>
        )}
        {deal.assignedTo && (
          <div className="flex items-center">
            <span className="font-medium">Assigned:</span>
            <span className="ml-2">{deal.assignedTo.name}</span>
          </div>
        )}
        {deal.expectedCloseDate && (
          <div className="flex items-center">
            <span className="font-medium">Close Date:</span>
            <span className="ml-2">{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
          </div>
        )}
        {deal.probability > 0 && (
          <div className="flex items-center">
            <span className="font-medium">Probability:</span>
            <span className="ml-2">{deal.probability}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable Stage Column Component
const DroppableStageColumn = ({ stage, deals, onEdit, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      type: 'stage',
      stageId: stage.id
    }
  });

  const sortableIds = deals.map(deal => deal.id.toString());

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] sm:min-w-[280px] bg-gray-50 rounded-lg p-3 sm:p-4 transition-colors ${
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{stage.name}</h2>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white">
          {deals.length}
        </span>
      </div>
      <div
        className="min-h-[400px]"
        style={{
          borderTop: `3px solid ${stage.color || '#6B7280'}`,
          paddingTop: '12px'
        }}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} onEdit={onEdit} />
          ))}
          {deals.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              Drop deals here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

const Deals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState(null);
  const [overId, setOverId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [showStageManagement, setShowStageManagement] = useState(false);
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg, setCurrentOrg] = useState(() => ApiService.getCurrentOrganization());
  const userRole = currentOrg?.role || 'viewer';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    const token = ApiService.getToken();
    if (!token || !user) {
      toast.error('Please sign in');
      navigate('/auth/signin');
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentOrg?.id]);

  // Listen for organization changes
  useEffect(() => {
    const handleOrganizationChange = (event) => {
      const newOrg = event.detail || ApiService.getCurrentOrganization();
      setCurrentOrg(newOrg);
      loadData(); // Refresh data when organization changes
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);
    window.addEventListener('organizationRefresh', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
      window.removeEventListener('organizationRefresh', handleOrganizationChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealsResponse, stagesResponse] = await Promise.all([
        ApiService.request('/api/deals'),
        ApiService.request('/api/deals/stages')
      ]);

      if (dealsResponse.success) {
        setDeals(dealsResponse.deals || []);
      }
      if (stagesResponse.success) {
        setStages(stagesResponse.stages || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const dealId = event.active.id.toString();
    const deal = deals.find(d => d.id.toString() === dealId);
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      setOverId(over.id.toString());
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDeal(null);
    setOverId(null);

    if (!over) {
      return;
    }

    const dealId = active.id.toString();
    const deal = deals.find(d => d.id.toString() === dealId);
    
    if (!deal) {
      return;
    }

    // Check if dropped on a stage
    let targetStageId = null;
    
    if (typeof over.id === 'string' && over.id.startsWith('stage-')) {
      // Dropped on stage column
      targetStageId = parseInt(over.id.replace('stage-', ''));
    } else if (over.data?.current?.type === 'stage') {
      // Dropped on stage (from data)
      targetStageId = over.data.current.stageId;
    } else {
      // Dropped on another deal - find its stage
      const targetDeal = deals.find(d => d.id.toString() === over.id.toString());
      if (targetDeal) {
        targetStageId = targetDeal.stage.id;
      }
    }

    // If no valid target stage or same stage, do nothing
    if (!targetStageId || targetStageId === deal.stage.id) {
      return;
    }

    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) {
      return;
    }

    // Update deal stage (and probability will be auto-updated by backend)
    try {
      const response = await ApiService.request(`/api/deals/${deal.id}`, {
        method: 'PUT',
        body: { stageId: targetStageId }
      });

      if (response.success) {
        // Update local state with new stage and probability
        // Use target stage's default probability (backend will have updated it)
        const newProbability = targetStage.defaultProbability !== undefined 
          ? targetStage.defaultProbability 
          : deal.probability;
        
        setDeals(prevDeals =>
          prevDeals.map(d =>
            d.id === deal.id
              ? { 
                  ...d, 
                  stage: targetStage,
                  probability: newProbability
                }
              : d
          )
        );
        toast.success(`Deal moved to ${targetStage.name} (Probability: ${newProbability}%)`);
      } else {
        toast.error(response.message || 'Failed to move deal');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to move deal');
      // Reload data on error to ensure consistency
      loadData();
    }
  };

  const getDealsByStage = (stageId) => {
    return deals.filter(deal => deal.stage.id === stageId);
  };

  const handleCreateDeal = () => {
    setEditingDeal(null);
    setShowCreateModal(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setShowCreateModal(true);
  };

  const handleSaveDeal = async (dealData) => {
    try {
      if (editingDeal) {
        await ApiService.request(`/api/deals/${editingDeal.id}`, {
          method: 'PUT',
          body: dealData
        });
        toast.success('Deal updated successfully');
      } else {
        await ApiService.request('/api/deals', {
          method: 'POST',
          body: dealData
        });
        toast.success('Deal created successfully');
      }
      setShowCreateModal(false);
      setEditingDeal(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save deal');
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) {
      return;
    }

    try {
      await ApiService.request(`/api/deals/${dealId}`, {
        method: 'DELETE'
      });
      toast.success('Deal deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete deal');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
            Manage your deals pipeline. Drag and drop deals between stages.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {hasPermission(userRole, 'MANAGE_ORGANIZATION') && (
            <button
              onClick={() => setShowStageManagement(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center sm:justify-start"
            >
              <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="whitespace-nowrap">Manage Stages</span>
            </button>
          )}
          {hasPermission(userRole, 'CREATE_DEAL') && (
            <button
              onClick={handleCreateDeal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center sm:justify-start"
            >
              <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">New Deal</span>
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <DroppableStageColumn
              key={stage.id}
              stage={stage}
              deals={getDealsByStage(stage.id)}
              onEdit={handleEditDeal}
              isOver={overId === `stage-${stage.id}`}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-500 p-4 w-64">
              <h3 className="font-semibold text-gray-900 mb-2">{activeDeal.title}</h3>
              <div className="text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">Value:</span>
                  <span className="ml-2">
                    {activeDeal.value 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: activeDeal.currency || 'USD',
                          minimumFractionDigits: 0
                        }).format(activeDeal.value)
                      : 'N/A'}
                  </span>
                </div>
                {activeDeal.contactPerson && (
                  <div className="flex items-center mt-1">
                    <span className="font-medium">Contact:</span>
                    <span className="ml-2">{activeDeal.contactPerson.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <DealModal
          deal={editingDeal}
          stages={stages}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDeal(null);
          }}
          onSave={handleSaveDeal}
          onDelete={editingDeal ? () => handleDeleteDeal(editingDeal.id) : null}
          canDeleteDeal={canDelete(userRole)}
        />
      )}

      {showStageManagement && (
        <StageManagementModal
          stages={stages}
          onClose={() => setShowStageManagement(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

// Deal Modal Component
const DealModal = ({ deal, stages, onClose, onSave, onDelete, canDeleteDeal }) => {
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    value: deal?.value || '',
    currency: deal?.currency || 'USD',
    stageId: deal?.stage?.id || stages[0]?.id || '',
    contactPersonId: deal?.contactPerson?.id || null,
    contactOrgId: deal?.contactOrg?.id || null,
    assignedToUserId: deal?.assignedTo?.id || null,
    expectedCloseDate: deal?.expectedCloseDate || '',
    probability: deal?.probability || 0,
    notes: deal?.notes || ''
  });

  const [contactType, setContactType] = useState(deal?.contactPerson ? 'person' : deal?.contactOrg ? 'organization' : 'none');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableContacts, setAvailableContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState(
    deal?.contactPerson 
      ? { id: deal.contactPerson.id, name: deal.contactPerson.name, email: deal.contactPerson.email }
      : deal?.contactOrg
      ? { id: deal.contactOrg.id, name: deal.contactOrg.name, email: deal.contactOrg.email }
      : null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [errors, setErrors] = useState({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load contacts based on type from the contacts API
  useEffect(() => {
    const loadContacts = async () => {
      if (searchQuery.length < 2 && searchQuery.length > 0) return;
      
      try {
        setLoadingContacts(true);
        if (contactType === 'person') {
          const response = await ApiService.request('/api/contacts?type=people');
          if (response.success) {
            const filtered = (response.contacts || []).filter(contact => {
              const name = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
              const email = (contact.email || '').toLowerCase();
              const search = searchQuery.toLowerCase();
              return !searchQuery || name.includes(search) || email.includes(search);
            });
            setAvailableContacts(filtered);
          }
        } else if (contactType === 'organization') {
          const response = await ApiService.request('/api/contacts?type=organizations');
          if (response.success) {
            const filtered = (response.contacts || []).filter(contact => {
              const name = (contact.name || '').toLowerCase();
              const email = (contact.email || '').toLowerCase();
              const search = searchQuery.toLowerCase();
              return !searchQuery || name.includes(search) || email.includes(search);
            });
            setAvailableContacts(filtered);
          }
        }
      } catch (error) {
        console.error('Failed to load contacts:', error);
        setAvailableContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    const timer = setTimeout(() => {
      if (contactType !== 'none') {
        loadContacts();
      } else {
        setAvailableContacts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, contactType]);

  const handleContactSelect = (contact) => {
    if (contactType === 'person') {
      setFormData({ ...formData, contactPersonId: contact.id, contactOrgId: null });
      setSelectedContact({ id: contact.id, name: `${contact.firstName} ${contact.lastName}`, email: contact.email });
    } else if (contactType === 'organization') {
      setFormData({ ...formData, contactOrgId: contact.id, contactPersonId: null });
      setSelectedContact({ id: contact.id, name: contact.name, email: contact.email });
    }
    setSearchQuery(contact.firstName ? `${contact.firstName} ${contact.lastName}` : contact.name || contact.email);
    setShowDropdown(false);
  };

  const handleContactTypeChange = (type) => {
    setContactType(type);
    setFormData({ ...formData, contactPersonId: null, contactOrgId: null });
    setSelectedContact(null);
    setSearchQuery('');
    setAvailableContacts([]);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    
    // Title validation
    const titleResult = validators.dealTitle(formData.title, true);
    if (!titleResult.valid) {
      validationErrors.title = titleResult.message;
    }
    
    // Value validation
    if (formData.value !== '' && formData.value !== null) {
      const valueResult = validators.dealValue(formData.value, false);
      if (!valueResult.valid) {
        validationErrors.value = valueResult.message;
      }
    }
    
    // Currency validation
    const currencyResult = validators.currency(formData.currency, false);
    if (!currencyResult.valid) {
      validationErrors.currency = currencyResult.message;
    }
    
    // Stage validation
    if (!formData.stageId) {
      validationErrors.stageId = 'Stage is required';
    }
    
    // Probability validation
    const probabilityResult = validators.probability(formData.probability, false);
    if (!probabilityResult.valid) {
      validationErrors.probability = probabilityResult.message;
    }
    
    // Date validation
    if (formData.expectedCloseDate) {
      const dateResult = validators.date(formData.expectedCloseDate, false, 'Expected close date');
      if (!dateResult.valid) {
        validationErrors.expectedCloseDate = dateResult.message;
      }
    }
    
    // Notes validation
    const notesResult = validators.text(formData.notes, false, 'Notes');
    if (!notesResult.valid) {
      validationErrors.notes = notesResult.message;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }
    
    // Ensure only one contact type is set
    const submitData = { ...formData };
    if (contactType === 'person') {
      submitData.contactOrgId = null;
      if (!submitData.contactPersonId) {
        submitData.contactPersonId = null;
      }
    } else if (contactType === 'organization') {
      submitData.contactPersonId = null;
      if (!submitData.contactOrgId) {
        submitData.contactOrgId = null;
      }
    } else {
      submitData.contactPersonId = null;
      submitData.contactOrgId = null;
    }
    // Convert empty strings to null for optional fields
    if (submitData.value === '') submitData.value = null;
    if (submitData.expectedCloseDate === '') submitData.expectedCloseDate = null;
    if (submitData.probability === '') submitData.probability = 0;
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {deal ? 'Edit Deal' : 'Create Deal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999999999999.99"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.value ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.value && (
                <p className="mt-1 text-xs text-red-600">{errors.value}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.currency ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage *
            </label>
            <select
              required
              value={formData.stageId}
              onChange={(e) => {
                const selectedStage = stages.find(s => s.id === parseInt(e.target.value));
                setFormData({ 
                  ...formData, 
                  stageId: parseInt(e.target.value),
                  // Auto-set probability to stage's default if not manually set
                  probability: selectedStage?.defaultProbability || formData.probability
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.name} {stage.defaultProbability !== undefined ? `(${stage.defaultProbability}%)` : ''}
                </option>
              ))}
            </select>
            {formData.stageId && (() => {
              const selectedStage = stages.find(s => s.id === formData.stageId);
              return selectedStage?.defaultProbability !== undefined && (
                <p className="mt-1 text-xs text-gray-500">
                  Default probability for this stage: {selectedStage.defaultProbability}%
                </p>
              );
            })()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Type
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleContactTypeChange('none')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  contactType === 'none'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => handleContactTypeChange('person')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  contactType === 'person'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Person
              </button>
              <button
                type="button"
                onClick={() => handleContactTypeChange('organization')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  contactType === 'organization'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Organization
              </button>
            </div>
            {contactType !== 'none' && (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder={`Search ${contactType === 'person' ? 'person' : 'organization'}...`}
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
                    {loadingContacts ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : availableContacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No contacts found'}
                      </div>
                    ) : (
                      availableContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => handleContactSelect(contact)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {contact.firstName ? `${contact.firstName} ${contact.lastName}` : contact.name}
                          </div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedContact && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm font-medium text-indigo-900">
                      Selected: {selectedContact.name}
                    </div>
                    {selectedContact.email && (
                      <div className="text-xs text-indigo-700">{selectedContact.email}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.expectedCloseDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expectedCloseDate && (
                <p className="mt-1 text-xs text-red-600">{errors.expectedCloseDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleChange('probability', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.probability ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.probability && (
                <p className="mt-1 text-xs text-red-600">{errors.probability}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              maxLength={65535}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {onDelete && canDeleteDeal && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            )}
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
              {deal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stage Management Modal Component
const StageManagementModal = ({ stages, onClose, onUpdate }) => {
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6B7280');
  const [newStageProbability, setNewStageProbability] = useState(0);
  const [editingStage, setEditingStage] = useState(null);

  const handleSaveStage = async (stageId, name, color, defaultProbability) => {
    // Validate
    const validationErrors = {};
    
    const nameResult = validators.stageName(name, true);
    if (!nameResult.valid) {
      validationErrors.name = nameResult.message;
    }
    
    const colorResult = validators.color(color, false);
    if (!colorResult.valid) {
      validationErrors.color = colorResult.message;
    }
    
    const probResult = validators.probability(defaultProbability, false);
    if (!probResult.valid) {
      validationErrors.probability = probResult.message;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      toast.error(Object.values(validationErrors)[0]);
      return;
    }
    
    try {
      await ApiService.request(`/api/deals/stages/${stageId}`, {
        method: 'PUT',
        body: { name, color, defaultProbability }
      });
      toast.success('Stage updated successfully');
      onUpdate();
      setEditingStage(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update stage');
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!confirm('Are you sure you want to delete this stage? Deals using this stage must be moved first.')) {
      return;
    }

    try {
      await ApiService.request(`/api/deals/stages/${stageId}`, {
        method: 'DELETE'
      });
      toast.success('Stage deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to delete stage');
    }
  };

  const [errors, setErrors] = useState({});

  const handleCreateStage = async () => {
    // Validate form
    const validationErrors = {};
    
    const nameResult = validators.stageName(newStageName.trim(), true);
    if (!nameResult.valid) {
      validationErrors.name = nameResult.message;
    }
    
    const colorResult = validators.color(newStageColor, false);
    if (!colorResult.valid) {
      validationErrors.color = colorResult.message;
    }
    
    const probResult = validators.probability(newStageProbability, false);
    if (!probResult.valid) {
      validationErrors.probability = probResult.message;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    try {
      const prob = parseInt(newStageProbability) || 0;
      await ApiService.request('/api/deals/stages', {
        method: 'POST',
        body: { name: newStageName.trim(), color: newStageColor, defaultProbability: prob }
      });
      toast.success('Stage created successfully');
      setNewStageName('');
      setNewStageColor('#6B7280');
      setNewStageProbability(0);
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to create stage');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Deal Stages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Stage */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Stage</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Stage name"
                  value={newStageName}
                  onChange={(e) => {
                    setNewStageName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateStage();
                    }
                  }}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Prob %"
                  value={newStageProbability}
                  onChange={(e) => setNewStageProbability(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleCreateStage}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Stage
                </button>
              </div>
              <p className="text-xs text-gray-500">Default probability: All deals in this stage will automatically get this probability value</p>
            </div>
          </div>

          {/* Existing Stages */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Stages</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {editingStage === stage.id ? (
                    <StageEditForm
                      stage={stage}
                      onSave={(name, color, defaultProbability) => handleSaveStage(stage.id, name, color, defaultProbability)}
                      onCancel={() => setEditingStage(null)}
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{stage.name}</span>
                        {stage.defaultProbability !== undefined && (
                          <span className="ml-2 text-sm text-gray-500">({stage.defaultProbability}% default)</span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingStage(stage.id)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Stage Edit Form Component
const StageEditForm = ({ stage, onSave, onCancel }) => {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color);
  const [defaultProbability, setDefaultProbability] = useState(stage.defaultProbability || 0);

  const handleSave = () => {
    // Validate before saving
    const nameResult = validators.stageName(name.trim(), true);
    const colorResult = validators.color(color, false);
    const probResult = validators.probability(defaultProbability, false);
    
    if (!nameResult.valid || !colorResult.valid || !probResult.valid) {
      toast.error(nameResult.message || colorResult.message || probResult.message);
      return;
    }
    
    if (name.trim() && (name !== stage.name || color !== stage.color || defaultProbability !== (stage.defaultProbability || 0))) {
      onSave(name.trim(), color, defaultProbability);
    } else {
      onCancel();
    }
  };

  return (
    <>
      <input
        type="text"
        maxLength={100}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        autoFocus
        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          handleSave();
        }}
        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
      />
      <input
        type="number"
        min="0"
        max="100"
        value={defaultProbability}
        onChange={(e) => {
          setDefaultProbability(parseInt(e.target.value) || 0);
        }}
        onBlur={handleSave}
        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Prob %"
      />
      <button
        onClick={onCancel}
        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        Cancel
      </button>
    </>
  );
};

export default Deals;

