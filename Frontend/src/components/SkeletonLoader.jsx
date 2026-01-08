import React from 'react';

// Base Skeleton component
const Skeleton = ({ className = '', width = 'w-full', height = 'h-4' }) => {
  return (
    <div
      className={`${width} ${height} bg-gray-800/60 rounded animate-pulse relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent animate-shimmer"></div>
    </div>
  );
};

// Card Skeleton for stat cards and overview cards
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card rounded-xl p-4 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width="w-12" height="h-12" className="rounded-lg" />
            <Skeleton width="w-16" height="h-6" className="rounded-full" />
          </div>
          <Skeleton width="w-24" height="h-8" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      ))}
    </>
  );
};

// Table Skeleton for data tables
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-700/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="w-24" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-700/30 p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width="w-full" height="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// List Skeleton for vertical lists
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="glass-card rounded-xl p-4 flex items-center space-x-4">
          <Skeleton width="w-12" height="h-12" className="rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-3/4" height="h-5" />
            <Skeleton width="w-1/2" height="h-4" />
          </div>
          <Skeleton width="w-20" height="h-8" className="rounded-lg" />
        </div>
      ))}
    </div>
  );
};

// Deal Card Skeleton for Kanban board
export const DealCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card rounded-xl p-4 mb-3 space-y-3">
          <Skeleton width="w-full" height="h-5" />
          <div className="space-y-2">
            <Skeleton width="w-24" height="h-4" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton width="w-16" height="h-6" className="rounded-full" />
            <Skeleton width="w-8" height="h-8" className="rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
};

// Form Skeleton for modals
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="w-32" height="h-4" />
          <Skeleton width="w-full" height="h-10" className="rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton width="w-24" height="h-10" className="rounded-lg" />
        <Skeleton width="w-32" height="h-10" className="rounded-lg" />
      </div>
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton width="w-20" height="h-20" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-48" height="h-6" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>
    </div>
  );
};

export default Skeleton;

