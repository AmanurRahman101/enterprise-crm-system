import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Deal } from '../../types/deal';
import DealKanbanCard from './DealKanbanCard';

interface DealKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  deals: Deal[];
  totalValue: number;
  onCardClick: (dealId: string) => void;
}

const DealKanbanColumn: React.FC<DealKanbanColumnProps> = ({
  id,
  title,
  color,
  deals,
  totalValue,
  onCardClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const colorClasses: Record<string, string> = {
    secondary: 'border-secondary-300 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-800/50',
    primary: 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20',
    warning: 'border-warning-300 bg-warning-50 dark:border-warning-600 dark:bg-warning-900/20',
    success: 'border-success-300 bg-success-50 dark:border-success-600 dark:bg-success-900/20',
    danger: 'border-danger-300 bg-danger-50 dark:border-danger-600 dark:bg-danger-900/20',
  };

  const hoverColorClasses: Record<string, string> = {
    secondary: 'border-secondary-400 bg-secondary-100 dark:border-secondary-500 dark:bg-secondary-700',
    primary: 'border-primary-400 bg-primary-100 dark:border-primary-500 dark:bg-primary-800/30',
    warning: 'border-warning-400 bg-warning-100 dark:border-warning-500 dark:bg-warning-800/30',
    success: 'border-success-400 bg-success-100 dark:border-success-500 dark:bg-success-800/30',
    danger: 'border-danger-400 bg-danger-100 dark:border-danger-500 dark:bg-danger-800/30',
  };

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column Header */}
      <div className={`card mb-3 border-2 ${colorClasses[color] || colorClasses.secondary}`}>
        <div className="card-body py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">{title}</h3>
              <span className={`badge-${color} text-xs`}>
                {deals.length}
              </span>
            </div>
            <div className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">
              ${totalValue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border-2 border-dashed p-2 transition-colors ${
          isOver
            ? hoverColorClasses[color] || hoverColorClasses.secondary
            : 'border-secondary-200 bg-secondary-50/30 dark:border-secondary-700 dark:bg-secondary-800/30'
        }`}
        style={{ minHeight: '500px' }}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {deals.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-secondary-400 dark:text-secondary-500 text-sm">
                Drop deals here
              </div>
            ) : (
              deals.map((deal) => (
                <DealKanbanCard
                  key={deal.id}
                  deal={deal}
                  onClick={() => onCardClick(deal.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default DealKanbanColumn;
