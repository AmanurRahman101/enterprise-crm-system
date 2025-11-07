// Task Status Enum
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Task Priority Enum (reusing TicketPriority)
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Task Interface
export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  contactId: string | null;
  dealId: string | null;
  assigneeId: string;
  creatorId: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  deal?: {
    id: string;
    title: string;
    value: number;
    stage: string;
  };
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Task Form Data
export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assigneeId: string;
}

// Task Filters
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// Task List Response
export interface TaskListResponse {
  data?: Task[];
  tasks?: Task[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Task Stats Response
export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

// Task Status Options
export const TASK_STATUSES = [
  { value: 'TODO' as TaskStatus, label: 'To Do', color: 'secondary' },
  { value: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', color: 'primary' },
  { value: 'COMPLETED' as TaskStatus, label: 'Completed', color: 'success' },
  { value: 'CANCELLED' as TaskStatus, label: 'Cancelled', color: 'danger' },
];

// Task Priority Options
export const TASK_PRIORITIES = [
  { value: 'LOW' as TaskPriority, label: 'Low', color: 'secondary' },
  { value: 'MEDIUM' as TaskPriority, label: 'Medium', color: 'primary' },
  { value: 'HIGH' as TaskPriority, label: 'High', color: 'warning' },
  { value: 'URGENT' as TaskPriority, label: 'Urgent', color: 'danger' },
];

// Helper Functions
export const getStatusConfig = (status: TaskStatus) => {
  return TASK_STATUSES.find((s) => s.value === status) || TASK_STATUSES[0];
};

export const getPriorityConfig = (priority: TaskPriority) => {
  return TASK_PRIORITIES.find((p) => p.value === priority) || TASK_PRIORITIES[1];
};

export const getStatusColor = (status: TaskStatus): string => {
  const config = getStatusConfig(status);
  return config.color;
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const config = getPriorityConfig(priority);
  return config.color;
};

// Helper to check if task is overdue
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return false;
  }
  return new Date(task.dueDate) < new Date();
};

// Helper to format due date status
export const getDueDateStatus = (task: Task): { text: string; color: string } => {
  if (!task.dueDate) {
    return { text: 'No due date', color: 'secondary' };
  }

  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return { text: 'Closed', color: 'secondary' };
  }

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (dueDate < today) {
    return { text: 'Overdue', color: 'danger' };
  } else if (dueDate.getTime() === today.getTime()) {
    return { text: 'Due today', color: 'warning' };
  } else if (dueDate < tomorrow) {
    return { text: 'Due tomorrow', color: 'warning' };
  } else if (dueDate < nextWeek) {
    return { text: 'Due this week', color: 'primary' };
  } else {
    return { text: 'Upcoming', color: 'success' };
  }
};
