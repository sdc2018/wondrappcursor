import api from './api';
import { AxiosResponse } from 'axios';

// Define types
export interface Task {
  id: number;
  name: string;
  opportunity_id: number;
  assigned_user_id: number;
  due_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  name: string;
  opportunity_id: number;
  assigned_user_id: number;
  due_date: string;
  status: string;
  description?: string;
}

export interface TaskWithDetails extends Task {
  opportunity_name: string;
  client_name: string;
  service_name: string;
  assigned_user_name: string;
  business_unit: string;
}

export interface TaskStats {
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
}

const taskService = {
  /**
   * Get all tasks
   */
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const response: AxiosResponse<Task[]> = await api.get('/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  /**
   * Get task by ID
   */
  getTaskById: async (id: number): Promise<Task> => {
    try {
      const response: AxiosResponse<Task> = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get tasks by opportunity
   */
  getTasksByOpportunity: async (opportunityId: number): Promise<Task[]> => {
    try {
      const response: AxiosResponse<Task[]> = await api.get(`/tasks/opportunity/${opportunityId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tasks for opportunity ${opportunityId}:`, error);
      throw error;
    }
  },

  /**
   * Get tasks assigned to a user
   */
  getTasksByAssignedUser: async (userId: number): Promise<Task[]> => {
    try {
      const response: AxiosResponse<Task[]> = await api.get(`/tasks/assigned-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tasks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get overdue tasks
   */
  getOverdueTasks: async (): Promise<TaskWithDetails[]> => {
    try {
      const response: AxiosResponse<TaskWithDetails[]> = await api.get('/tasks/overdue');
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      throw error;
    }
  },

  /**
   * Get task statistics
   */
  getTaskStats: async (): Promise<TaskStats> => {
    try {
      const response: AxiosResponse<TaskStats> = await api.get('/tasks/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      throw error;
    }
  },

  /**
   * Create new task
   */
  createTask: async (taskData: TaskInput): Promise<Task> => {
    try {
      const response: AxiosResponse<Task> = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  /**
   * Update task
   */
  updateTask: async (id: number, taskData: Partial<TaskInput>): Promise<Task> => {
    try {
      const response: AxiosResponse<Task> = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update task status
   */
  updateTaskStatus: async (id: number, status: string): Promise<Task> => {
    try {
      const response: AxiosResponse<Task> = await api.patch(`/tasks/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for task with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete task
   */
  deleteTask: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      throw error;
    }
  }
};

export default taskService;
