// ==================== User & Auth Types ====================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  phone?: string | null;
  avatar?: string | null;
  _count?: {
    assignedContacts: number;
    assignedDeals: number;
    assignedTasks: number;
    assignedTickets: number;
  };
}

export interface AuthUser {
  id: string;
  tenantId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  isCustomer?: boolean;
  accessibleTenants?: Array<{
    id: string;
    subdomain: string;
    name: string;
    isPrimary: boolean;
  }>;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  isCustomer?: boolean;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

// ==================== Contact Types ====================

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  language: string;
  avatar?: string | null;
  isCustomer: boolean;
  tags: string[];
  customFields?: any;
  companyId?: string | null;
  ownerId: string;
  lastContactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company | null;
  owner?: User;
}

// ==================== Company Types ====================

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    deals: number;
  };
}

// ==================== Deal Types ====================

export enum DealStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Deal {
  id: string;
  tenantId: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  priority: Priority;
  source?: string | null;
  description?: string | null;
  expectedCloseDate?: string | null;
  contactId: string;
  companyId?: string | null;
  ownerId: string;
  lostReason?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  company?: Company | null;
  owner?: User;
}

// ==================== Task Types ====================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  assigneeId: string;
  creatorId: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  deal?: Deal | null;
  assignee?: User;
  creator?: User;
}

// ==================== Ticket Types ====================

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface Ticket {
  id: string;
  tenantId: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category?: string | null;
  source: string;
  tags: string[];
  slaDeadline?: string | null;
  contactId: string;
  assigneeId?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  firstResponseAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  assignee?: User | null;
}

// ==================== Activity Types ====================

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

export interface Activity {
  id: string;
  tenantId: string;
  type: ActivityType;
  subject: string;
  description?: string | null;
  duration?: number | null;
  outcome?: string | null;
  recordingUrl?: string | null;
  emailMessageId?: string | null;
  metadata?: any;
  contactId: string;
  dealId?: string | null;
  ticketId?: string | null;
  userId: string;
  occurredAt: string;
  createdAt: string;
  contact?: Contact;
  deal?: Deal | null;
  ticket?: Ticket | null;
  user?: User;
}

// ==================== Note Types ====================

export interface Note {
  id: string;
  tenantId: string;
  content: string;
  contactId?: string | null;
  dealId?: string | null;
  ticketId?: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  deal?: Deal | null;
  ticket?: Ticket | null;
  author?: User;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface Statistics {
  total: number;
  [key: string]: any;
}

// ==================== Form Types ====================

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
  address?: string;
  city?: string;
  country?: string;
  tags?: string[];
  isCustomer?: boolean;
}

export interface CompanyFormData {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
}

export interface DealFormData {
  title: string;
  value: number;
  currency?: string;
  stage: DealStage;
  probability?: number;
  priority?: Priority;
  source?: string;
  description?: string;
  expectedCloseDate?: string;
  contactId: string;
  companyId?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assigneeId: string;
}

export interface TicketFormData {
  subject: string;
  description: string;
  priority?: Priority;
  category?: string;
  source?: string;
  contactId: string;
  assigneeId?: string;
  tags?: string[];
}

export interface ActivityFormData {
  type: ActivityType;
  subject: string;
  description?: string;
  duration?: number;
  outcome?: string;
  contactId: string;
  dealId?: string;
  ticketId?: string;
  occurredAt?: string;
}

export interface NoteFormData {
  content: string;
  contactId?: string;
  dealId?: string;
  ticketId?: string;
}
