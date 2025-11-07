import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Deal, DEAL_PRIORITIES } from '../../types/deal';

interface DealKanbanCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

const DealKanbanCard: React.FC<DealKanbanCardProps> = ({ deal, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // Prevent touch scrolling during drag
  };

  const priorityConfig = DEAL_PRIORITIES.find((p) => p.value === deal.priority);
  const isActuallyDragging = isDragging || isSortableDragging;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isActuallyDragging && onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card cursor-move hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all select-none ${
        isActuallyDragging ? 'opacity-50 rotate-2' : ''
      }`}
      onClick={handleClick}
    >
      <div className="card-body p-4">
        {/* Title */}
        <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2 line-clamp-2">
          {deal.title}
        </h4>

        {/* Value */}
        <div className="flex items-center gap-2 mb-3">
          <CurrencyDollarIcon className="h-4 w-4 text-success-600 dark:text-success-400" />
          <span className="text-lg font-bold text-success-600 dark:text-success-400">
            ${deal.value.toLocaleString()}
          </span>
          {priorityConfig && (
            <span className={`badge-${priorityConfig.color} text-xs ml-auto`}>
              {priorityConfig.label}
            </span>
          )}
        </div>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mb-2">
            <UserIcon className="h-4 w-4" />
            <span className="truncate">
              {deal.contact.firstName} {deal.contact.lastName}
            </span>
          </div>
        )}

        {/* Company */}
        {deal.company && (
          <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mb-2">
            <BuildingOfficeIcon className="h-4 w-4" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}

        {/* Close Date */}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-500 mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Win Probability */}
        {deal.probability !== null && deal.probability !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              <span>Win Probability</span>
              <span className="font-semibold">{deal.probability}%</span>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1.5">
              <div
                className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealKanbanCard;
