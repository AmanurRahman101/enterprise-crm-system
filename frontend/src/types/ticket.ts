// Ticket type definitions
export type TicketStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Ticket {
  id: string;
  tenantId: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  source: string;
  tags: string[];
  slaDeadline?: string;
  contactId: string;
  assigneeId?: string;
  resolvedAt?: string;
  closedAt?: string;
  firstResponseAt?: string;
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
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  activities?: any[];
  notes?: any[];
  _count?: {
    activities: number;
    notes: number;
  };
}

// Form data for creating/updating a ticket
export interface TicketFormData {
  subject: string;
  description: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  source?: string;
  tags?: string[];
  slaDeadline?: string;
  contactId: string;
  assigneeId?: string;
}

// Filters for ticket list
export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigneeId?: string;
  contactId?: string;
}

// Paginated ticket list response
export interface TicketListResponse {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

// Ticket status configuration for UI
export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Open', color: 'primary' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning' },
  { value: 'PENDING', label: 'Pending', color: 'secondary' },
  { value: 'RESOLVED', label: 'Resolved', color: 'success' },
  { value: 'CLOSED', label: 'Closed', color: 'secondary' },
];

// Ticket priority configuration
export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'secondary' },
  { value: 'MEDIUM', label: 'Medium', color: 'primary' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'danger' },
];

// Ticket source options
export const TICKET_SOURCES = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'APP', label: 'App' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
];

// Ticket category options
export const TICKET_CATEGORIES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Billing', label: 'Billing' },
  { value: 'General', label: 'General Inquiry' },
  { value: 'Bug', label: 'Bug Report' },
  { value: 'Feature', label: 'Feature Request' },
  { value: 'Support', label: 'Support' },
];

// Helper function to get status configuration
export const getStatusConfig = (status: TicketStatus) => {
  return TICKET_STATUSES.find((s) => s.value === status) || TICKET_STATUSES[0];
};

// Helper function to get priority configuration
export const getPriorityConfig = (priority: TicketPriority) => {
  return TICKET_PRIORITIES.find((p) => p.value === priority) || TICKET_PRIORITIES[1];
};
