// Re-export Prisma types for use throughout the application
export type {
  User,
  Company,
  Contact,
  Deal,
  Task,
  Ticket,
  Activity,
  Note,
} from '@prisma/client';

export {
  UserRole,
  DealStage,
  TaskStatus,
  TicketStatus,
  TicketPriority,
  ActivityType,
} from '@prisma/client';

// Custom types for API requests/responses

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  companyId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateContactDTO extends Partial<CreateContactDTO> {
  isCustomer?: boolean;
}

export interface CreateCompanyDTO {
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

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {}

export interface CreateDealDTO {
  title: string;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  priority?: string;
  source?: string;
  description?: string;
  expectedCloseDate?: Date;
  contactId: string;
  companyId?: string;
}

export interface UpdateDealDTO extends Partial<CreateDealDTO> {
  lostReason?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date;
  contactId?: string;
  dealId?: string;
  assigneeId: string;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  completedAt?: Date;
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  source?: string;
  contactId: string;
  tags?: string[];
}

export interface UpdateTicketDTO extends Partial<CreateTicketDTO> {
  status?: string;
  assigneeId?: string;
}

export interface CreateActivityDTO {
  type: string;
  subject: string;
  description?: string;
  duration?: number;
  outcome?: string;
  contactId: string;
  dealId?: string;
  ticketId?: string;
  occurredAt?: Date;
}

export interface CreateNoteDTO {
  content: string;
  contactId?: string;
  dealId?: string;
  ticketId?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface ContactFilters {
  search?: string;
  companyId?: string;
  isCustomer?: boolean;
  tags?: string[];
  ownerId?: string;
}

export interface DealFilters {
  search?: string;
  stage?: string[];
  ownerId?: string;
  companyId?: string;
  minValue?: number;
  maxValue?: number;
}

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
  overdue?: boolean;
}

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  contactId?: string;
  category?: string;
  source?: string;
}

// Analytics types
export interface DashboardStats {
  deals: {
    total: number;
    totalValue: number;
    byStage: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    byStatus: Record<string, number>;
  };
  tickets: {
    total: number;
    open: number;
    avgResponseTime: number;
    byPriority: Record<string, number>;
  };
  activities: {
    total: number;
    thisWeek: number;
    byType: Record<string, number>;
  };
}
