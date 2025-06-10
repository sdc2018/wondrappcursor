import api from './api';
import { AxiosResponse } from 'axios';

// Define types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const authService = {
  /**
   * Login user and store token
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
      
      // Store token and user role in localStorage
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', userData);
      
      // Store token and user role in localStorage if auto-login after registration
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    // Redirect to login page
    window.location.href = '/login';
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return localStorage.getItem('authToken') !== null;
  },

  /**
   * Get user role
   */
  getUserRole: (): string | null => {
    return localStorage.getItem('userRole');
  },

  /**
   * Change user password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (username: string): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await api.put('/auth/profile', { username });
      console.log('Profile updated successfully');
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
};

export default authService;