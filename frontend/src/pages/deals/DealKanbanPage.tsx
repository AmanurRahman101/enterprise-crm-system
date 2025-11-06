import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { PlusIcon, ListBulletIcon, Squares2X2Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { dealService } from '../../services/dealService';
import { dealStageService, DealStage as DealStageInfo } from '../../services/dealStageService';
import { Deal } from '../../types/deal';
import DealKanbanColumn from '../../components/deals/DealKanbanColumn';
import DealKanbanCard from '../../components/deals/DealKanbanCard';

const DealKanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<DealStageInfo[]>([]);
  const [dealsByStage, setDealsByStage] = useState<Record<string, Deal[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Small distance to start drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load stages from API
  const loadStages = useCallback(async () => {
    try {
      const response = await dealStageService.getStages();
      const stagesData = response.data || [];
      // Sort by order
      stagesData.sort((a, b) => a.order - b.order);
      setStages(stagesData);
      
      // Initialize dealsByStage with empty arrays for each stage
      const initialState: Record<string, Deal[]> = {};
      stagesData.forEach((stage) => {
        initialState[stage.id] = [];
      });
      setDealsByStage(initialState);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stages');
    }
  }, []);

  const loadDeals = useCallback(async () => {
    if (stages.length === 0) return; // Wait for stages to load first

    try {
      setLoading(true);
      setError(null);

      // Fetch all deals
      const response = await dealService.getDeals(1, 1000); // Get all deals
      const allDeals = response.data || [];

      // Group deals by stage ID
      const grouped: Record<string, Deal[]> = {};
      stages.forEach((stage) => {
        grouped[stage.id] = [];
      });

      allDeals.forEach((deal) => {
        if (deal.stage && grouped[deal.stage.id]) {
          grouped[deal.stage.id].push(deal);
        }
      });

      setDealsByStage(grouped);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [stages]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  useEffect(() => {
    if (stages.length > 0) {
      loadDeals();
    }
  }, [stages, loadDeals]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dealId = active.id as string;

    // Find the deal being dragged
    for (const stageId in dealsByStage) {
      const deal = dealsByStage[stageId].find((d) => d.id === dealId);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Find current stage of the deal
    let currentStageId: string | null = null;
    let deal: Deal | null = null;

    for (const stageId in dealsByStage) {
      const foundDeal = dealsByStage[stageId].find((d) => d.id === dealId);
      if (foundDeal) {
        currentStageId = stageId;
        deal = foundDeal;
        break;
      }
    }

    if (!currentStageId || !deal || currentStageId === newStageId) return;

    const newStage = stages.find((s) => s.id === newStageId);
    if (!newStage) return;

    // Optimistically update UI
    setDealsByStage((prev) => {
      const newState = { ...prev };
      // Remove from old stage
      newState[currentStageId!] = newState[currentStageId!].filter((d) => d.id !== dealId);
      // Add to new stage with updated stage info
      newState[newStageId] = [
        ...newState[newStageId],
        {
          ...deal!,
          stageId: newStageId,
          stage: {
            id: newStage.id,
            name: newStage.name,
            color: newStage.color,
            order: newStage.order,
            probability: newStage.probability,
            isWon: newStage.isWon,
            isLost: newStage.isLost,
          },
        },
      ];
      return newState;
    });

    try {
      // Update deal stage on backend
      await dealService.updateDeal(dealId, { stageId: newStageId });
      setError(null);
    } catch (err: any) {
      // Revert on error
      setError(err.response?.data?.message || 'Failed to update deal stage');
      loadDeals(); // Reload to get correct state
    }
  };

  const handleDragCancel = () => {
    setActiveDeal(null);
  };

  // Filter deals based on search term
  const filterDeals = (deals: Deal[]): Deal[] => {
    if (!searchTerm) return deals;
    
    const term = searchTerm.toLowerCase();
    return deals.filter((deal) => {
      const titleMatch = deal.title.toLowerCase().includes(term);
      const contactMatch = deal.contact
        ? `${deal.contact.firstName} ${deal.contact.lastName}`.toLowerCase().includes(term)
        : false;
      const companyMatch = deal.company
        ? deal.company.name.toLowerCase().includes(term)
        : false;
      
      return titleMatch || contactMatch || companyMatch;
    });
  };

  // Calculate total statistics
  const allDeals = Object.values(dealsByStage).flat();
  const totalDeals = allDeals.length;
  const totalValue = allDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = allDeals.filter((deal) => deal.stage?.isWon).length;
  const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Deals Pipeline</h1>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              Drag and drop deals to update their stage
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/deals')}
              className="btn-secondary flex items-center gap-2"
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5" />
              List
            </button>
            <button
              className="btn-secondary flex items-center gap-2 bg-primary-50 text-primary-700 border-primary-200"
              title="Kanban View (Active)"
            >
              <Squares2X2Icon className="h-5 w-5" />
              Kanban
            </button>
            <button
              onClick={() => navigate('/deals/new')}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Deal
            </button>
          </div>
        </div>

        {/* Search and Statistics */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Search deals by title, contact, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                ×
              </button>
            )}
          </div>

          {/* Statistics */}
          <div className="flex gap-4 text-sm">
            <div className="bg-white dark:bg-secondary-800 px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <span className="text-secondary-600 dark:text-secondary-400">Total: </span>
              <span className="font-semibold text-secondary-900 dark:text-secondary-100">{totalDeals} deals</span>
            </div>
            <div className="bg-white dark:bg-secondary-800 px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <span className="text-secondary-600 dark:text-secondary-400">Value: </span>
              <span className="font-semibold text-success-600 dark:text-success-400">${totalValue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-secondary-800 px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <span className="text-secondary-600 dark:text-secondary-400">Win Rate: </span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">{winRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-danger mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
            {stages.map((stage) => {
              const deals = dealsByStage[stage.id] || [];
              const filteredDeals = filterDeals(deals);
              const stageValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);

              // Map hex color to MUI color name
              const colorMap: Record<string, string> = {
                '#1976d2': 'primary',
                '#9c27b0': 'secondary',
                '#2e7d32': 'success',
                '#ed6c02': 'warning',
                '#d32f2f': 'danger',
                '#0288d1': 'info',
                '#616161': 'secondary',
              };
              const muiColor = colorMap[stage.color.toLowerCase()] || 'secondary';

              return (
                <DealKanbanColumn
                  key={stage.id}
                  id={stage.id}
                  title={stage.name}
                  color={muiColor}
                  deals={filteredDeals}
                  totalValue={stageValue}
                  onCardClick={(dealId) => navigate(`/deals/${dealId}`)}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDeal ? (
              <div className="rotate-3 opacity-90">
                <DealKanbanCard deal={activeDeal} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default DealKanbanPage;

