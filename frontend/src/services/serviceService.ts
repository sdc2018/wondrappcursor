import api from './api';

// Define types
export interface Service {
  id: number;
  name: string;
  description: string;
  pricing_model: string;
  pricing_details?: string;
  business_unit: string;
  applicable_industries: string[];
  client_role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceInput {
  name: string;
  description: string;
  pricing_model: string;
  pricing_details?: string;
  business_unit: string;
  applicable_industries: string[];
  client_role: string;
  status: string;
}

const serviceService = {
  /**
   * Get all services
   */
  getAllServices: async (): Promise<Service[]> => {
    try {
      const response = await api.get('/services');
      // Extract services array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  /**
   * Get service by ID
   */
  getServiceById: async (id: number): Promise<Service> => {
    try {
      const response = await api.get(`/services/${id}`);
      // Extract service data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching service with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get services by business unit
   */
  getServicesByBusinessUnit: async (businessUnit: string): Promise<Service[]> => {
    try {
      const response = await api.get(`/services/business-unit/${businessUnit}`);
      // Extract services array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching services for business unit ${businessUnit}:`, error);
      throw error;
    }
  },

  /**
   * Get services by industry
   */
  getServicesByIndustry: async (industry: string): Promise<Service[]> => {
    try {
      const response = await api.get(`/services/industry/${industry}`);
      // Extract services array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching services for industry ${industry}:`, error);
      throw error;
    }
  },

  /**
   * Create new service
   */
  createService: async (serviceData: ServiceInput): Promise<Service> => {
    try {
      const response = await api.post('/services', serviceData);
      // Extract service data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  /**
   * Update service
   */
  updateService: async (id: number, serviceData: Partial<ServiceInput>): Promise<Service> => {
    try {
      const response = await api.put(`/services/${id}`, serviceData);
      // Extract service data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error updating service with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete service
   */
deleteService: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/services/${id}`);
      // Extract success status from the response data structure
      return response.data.success || false;
    } catch (error) {
      console.error(`Error deleting service with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change service status
   */
  changeServiceStatus: async (id: number, status: string): Promise<Service> => {
    try {
      const response = await api.patch(`/services/${id}/status`, { status });
      // Extract service data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error changing status for service with ID ${id}:`, error);
      throw error;
    }
  }
};

export default serviceService;
