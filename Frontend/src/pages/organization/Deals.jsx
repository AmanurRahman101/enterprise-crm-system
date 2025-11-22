import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import { hasPermission, canDelete } from '../../utils/permissions';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
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
      {...attributes}
      {...listeners}
      onClick={() => onEdit(deal)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{deal.title}</h3>
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

// Kanban Column Component
const KanbanColumn = ({ stage, deals, onEdit }) => {
  const sortableIds = deals.map(deal => deal.id.toString());

  return (
    <div className="flex-1 min-w-[280px] bg-gray-50 rounded-lg p-4">
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
              No deals in this stage
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
  const [activeId, setActiveId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [user] = useState(() => ApiService.getUser());
  const [currentOrg] = useState(() => ApiService.getCurrentOrganization());
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
  }, [navigate]);

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
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeDeal = deals.find(d => d.id.toString() === active.id.toString());
    const overStage = stages.find(s => s.id.toString() === over.id.toString());

    if (!activeDeal || !overStage) {
      return;
    }

    // Update deal stage
    try {
      const response = await ApiService.request(`/api/deals/${activeDeal.id}`, {
        method: 'PUT',
        body: { stageId: overStage.id }
      });

      if (response.success) {
        // Update local state
        setDeals(prevDeals =>
          prevDeals.map(deal =>
            deal.id === activeDeal.id
              ? { ...deal, stage: overStage }
              : deal
          )
        );
        toast.success('Deal moved successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to move deal');
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
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Manage your deals pipeline. Drag and drop deals between stages.
          </p>
        </div>
        {hasPermission(userRole, 'CREATE_DEAL') && (
          <button
            onClick={handleCreateDeal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Deal
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <SortableContext
              key={stage.id}
              id={stage.id.toString()}
              items={getDealsByStage(stage.id).map(d => d.id.toString())}
            >
              <KanbanColumn
                stage={stage}
                deals={getDealsByStage(stage.id)}
                onEdit={handleEditDeal}
              />
            </SortableContext>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
              Dragging...
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
    </div>
  );
};

// Deal Modal Component (simplified - you can expand this)
const DealModal = ({ deal, stages, onClose, onSave, onDelete, canDeleteDeal }) => {
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    value: deal?.value || '',
    currency: deal?.currency || 'USD',
    stageId: deal?.stage?.id || stages[0]?.id || '',
    notes: deal?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              onChange={(e) => setFormData({ ...formData, stageId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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

export default Deals;

