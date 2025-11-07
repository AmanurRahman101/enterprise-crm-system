import apiClient from './api';
import { Task, TaskFormData, TaskFilters, TaskListResponse, TaskStats } from '../types/task';

const taskService = {
  // Get all tasks with pagination and filters
  async getTasks(
    page: number = 1,
    limit: number = 10,
    filters?: TaskFilters
  ): Promise<TaskListResponse> {
    const params: any = { page, limit };
    
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters?.contactId) params.contactId = filters.contactId;
    if (filters?.dealId) params.dealId = filters.dealId;
    if (filters?.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
    if (filters?.dueDateTo) params.dueDateTo = filters.dueDateTo;

    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  // Get a single task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  async createTask(data: TaskFormData): Promise<Task> {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  // Update an existing task
  async updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  // Update task status
  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Assign task to user
  async assignTask(id: string, assigneeId: string): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/assign`, { assigneeId });
    return response.data;
  },

  // Get task statistics
  async getStats(): Promise<TaskStats> {
    const response = await apiClient.get('/tasks/stats');
    return response.data;
  },

  // Get tasks by contact
  async getTasksByContact(contactId: string): Promise<Task[]> {
    const response = await apiClient.get(`/tasks/by-contact/${contactId}`);
    return response.data;
  },

  // Get tasks by deal
  async getTasksByDeal(dealId: string): Promise<Task[]> {
    const response = await apiClient.get(`/tasks/by-deal/${dealId}`);
    return response.data;
  },

  // Get my tasks (assigned to current user)
  async getMyTasks(page: number = 1, limit: number = 10): Promise<TaskListResponse> {
    const response = await apiClient.get('/tasks/my-tasks', {
      params: { page, limit },
    });
    return response.data;
  },
};

export default taskService;
