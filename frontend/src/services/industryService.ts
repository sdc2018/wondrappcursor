import api from './api';
import { AxiosResponse } from 'axios';

/**
 * Industry data interface
 */
export interface Industry {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Industry input data interface for creating/updating industries
 */
export interface IndustryInput {
  name: string;
  description?: string;
  status: string;
}

/**
 * Standardized API response interface
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Service for industry-related API operations
 */
const industryService = {
  /**
   * Get all industries
   */
  getAllIndustries: async (): Promise<Industry[]> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry[]>> = await api.get('/admin/industries');
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Old format with direct array
        return response.data;
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching industries:', error);
      throw error;
    }
  },

  /**
   * Get active industries
   */
  getActiveIndustries: async (): Promise<Industry[]> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry[]>> = await api.get('/admin/industries?status=active');
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Old format with direct array
        return response.data;
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching active industries:', error);
      throw error;
    }
  },

  /**
   * Get industry by ID
   */
  getIndustryById: async (id: number): Promise<Industry | null> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry>> = await api.get(`/admin/industries/${id}`);
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if ('id' in response.data) {
        // Old format with direct object
        return response.data as unknown as Industry;
      } else {
        console.error('Unexpected response format:', response.data);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching industry with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new industry
   */
  createIndustry: async (industryData: IndustryInput): Promise<Industry> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry>> = await api.post('/admin/industries', industryData);
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if ('id' in response.data) {
        // Old format with direct object
        return response.data as unknown as Industry;
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating industry:', error);
      throw error;
    }
  },

  /**
   * Update industry
   */
  updateIndustry: async (id: number, industryData: Partial<IndustryInput>): Promise<Industry> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry>> = await api.put(`/admin/industries/${id}`, industryData);
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if ('id' in response.data) {
        // Old format with direct object
        return response.data as unknown as Industry;
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error(`Error updating industry with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete industry
   */
  deleteIndustry: async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/industries/${id}`);
    } catch (error) {
      console.error(`Error deleting industry with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change industry status
   */
  changeIndustryStatus: async (id: number, status: string): Promise<Industry> => {
    try {
      const response: AxiosResponse<ApiResponse<Industry>> = await api.patch(`/admin/industries/${id}/status`, { status });
      
      // Handle both old and new response formats
      if (response.data.data) {
        // New format with data property
        return response.data.data;
      } else if ('industry' in response.data) {
        // Old format with industry property
        return response.data.industry as unknown as Industry;
      } else if ('id' in response.data) {
        // Old format with direct object
        return response.data as unknown as Industry;
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error(`Error changing industry status with ID ${id}:`, error);
      throw error;
    }
  }
};

export default industryService;