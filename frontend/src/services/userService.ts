import api from './api';
import { AxiosResponse } from 'axios';
import { User } from './authService';

// Extended user interface with additional fields if needed
export interface UserWithDetails extends User {
  // Add any additional fields that might be returned by the API
  // but not included in the basic User interface
}

// Interface for user input when creating/updating users
export interface UserInput {
  username: string;
  email: string;
  password?: string; // Optional for updates
  role: string;
}

const userService = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response: AxiosResponse<User[]> = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (userData: UserInput): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update an existing user
   */
  updateUser: async (id: number, userData: Partial<UserInput>): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: number): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role: string): Promise<User[]> => {
    try {
      // Get all users and filter by role
      // In a future update, this could be replaced with a dedicated endpoint
      const users = await userService.getAllUsers();
      return users.filter(user => user.role === role);
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  },

  /**
   * Get sales users (account owners)
   * Convenience method for getting users with 'sales' role
   */
  getSalesUsers: async (): Promise<User[]> => {
    return userService.getUsersByRole('sales');
  }
};

export default userService;