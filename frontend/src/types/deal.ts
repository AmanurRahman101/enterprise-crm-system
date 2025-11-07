// Deal type definitions

// Stage information from backend
export interface DealStageInfo {
  id: string;
  name: string;
  color: string;
  order: number;
  probability?: number;
  isWon: boolean;
  isLost: boolean;
}

// Legacy type for compatibility (will be phased out)
export type DealStage = 
  | 'LEAD'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Deal {
  id: string;
  tenantId: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  stage: DealStageInfo; // Now an object instead of enum
  probability: number;
  priority: DealPriority;
  source?: string;
  description?: string;
  expectedCloseDate?: string;
  contactId: string;
  companyId?: string;
  ownerId: string;
  lostReason?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, populated based on includes)
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    company?: {
      id: string;
      name: string;
    };
  };
  company?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  activities?: any[];
  tasks?: any[];
  notes?: any[];
  _count?: {
    activities: number;
    tasks: number;
    notes: number;
  };
}

// Form data for creating/updating a deal
export interface DealFormData {
  title: string;
  value: number;
  currency?: string;
  stageId?: string; // Changed from stage enum to stageId
  probability?: number;
  priority?: DealPriority;
  source?: string;
  description?: string;
  expectedCloseDate?: string;
  contactId: string;
  companyId?: string;
  lostReason?: string;
}

// Filters for deal list
export interface DealFilters {
  search?: string;
  stageId?: string; // Changed from stage enum to stageId
  priority?: DealPriority;
  minValue?: number;
  maxValue?: number;
  ownerId?: string;
}

// Paginated deal list response
export interface DealListResponse {
  data: Deal[];
  total: number;
  page: number;
  totalPages: number;
}


// Deal priority configuration
export const DEAL_PRIORITIES: { value: DealPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'secondary' },
  { value: 'MEDIUM', label: 'Medium', color: 'primary' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'danger' },
];

// Helper function to get priority configuration
export const getPriorityConfig = (priority: DealPriority) => {
  return DEAL_PRIORITIES.find((p) => p.value === priority) || DEAL_PRIORITIES[1];
};

// Helper function to convert hex color to MUI color
export const getColorForStage = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#1976d2': 'primary',
    '#9c27b0': 'secondary',
    '#2e7d32': 'success',
    '#ed6c02': 'warning',
    '#d32f2f': 'error',
    '#0288d1': 'info',
    '#616161': 'default',
  };
  return colorMap[hexColor.toLowerCase()] || 'default';
};

