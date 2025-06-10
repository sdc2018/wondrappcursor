import api from './api';

// Define types
export interface Opportunity {
  id: number;
  name: string;
  client_id: number;
  service_id: number;
  assigned_user_id: number;
  status: string;
  priority: string;
  estimated_value: number;
  due_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityInput {
  name: string;
  client_id: number;
  service_id: number;
  assigned_user_id: number;
  status: string;
  priority: string;
  estimated_value: number;
  due_date: string;
  notes?: string;
}

export interface MatrixData {
  clients: Array<{ id: number; name: string }>;
  services: Array<{ id: number; name: string; business_unit: string }>;
  matrix: Record<string, Record<string, { status: string | null; opportunity_id: number | null }>>;
}

// Helper function to handle different response formats
const extractData = (response: any) => {
  // If response is already the data we need, return it directly
  if (Array.isArray(response)) {
    return response;
  }
  
  // If response is an object with a data property
  if (response && typeof response === 'object') {
    // If response has a nested data property (response.data.data)
    if (response.data && typeof response.data === 'object' && response.data.data) {
      return response.data.data;
    }
    
    // If response has a data property that's an array or object
    if (response.data) {
      return response.data;
    }
  }
  
  // Fallback to empty array or original response
  return Array.isArray(response) ? response : (response || []);
};

const opportunityService = {
  /**
   * Get all opportunities
   */
  getAllOpportunities: async (): Promise<Opportunity[]> => {
    try {
      const response = await api.get('/opportunities');
      // Log the response for debugging
      console.log('Opportunities API response:', response);
      return extractData(response);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  },

  /**
   * Get opportunity by ID
   */
  getOpportunityById: async (id: number): Promise<Opportunity> => {
    try {
      const response = await api.get(`/opportunities/${id}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error fetching opportunity with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get opportunities by client
   */
  getOpportunitiesByClient: async (clientId: number): Promise<Opportunity[]> => {
    try {
      const response = await api.get(`/opportunities/client/${clientId}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error fetching opportunities for client ${clientId}:`, error);
      throw error;
    }
  },

  /**
   * Get opportunities by service
   */
  getOpportunitiesByService: async (serviceId: number): Promise<Opportunity[]> => {
    try {
      const response = await api.get(`/opportunities/service/${serviceId}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error fetching opportunities for service ${serviceId}:`, error);
      throw error;
    }
  },

  /**
   * Get opportunities by assigned user
   */
  getOpportunitiesByAssignedUser: async (userId: number): Promise<Opportunity[]> => {
    try {
      const response = await api.get(`/opportunities/user/${userId}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error fetching opportunities for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get opportunities by status
   */
  getOpportunitiesByStatus: async (status: string): Promise<Opportunity[]> => {
    try {
      const response = await api.get(`/opportunities/status/${status}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error fetching opportunities with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get active opportunities (not won, lost, or on hold)
   */
  getActiveOpportunities: async (): Promise<Opportunity[]> => {
    try {
      const response = await api.get('/opportunities/active');
      return extractData(response);
    } catch (error) {
      console.error('Error fetching active opportunities:', error);
      throw error;
    }
  },

  /**
   * Create new opportunity
   */
  createOpportunity: async (opportunityData: OpportunityInput): Promise<Opportunity> => {
    try {
      const response = await api.post('/opportunities', opportunityData);
      return extractData(response);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  },

  /**
   * Update opportunity
   */
  updateOpportunity: async (id: number, opportunityData: Partial<OpportunityInput>): Promise<Opportunity> => {
    try {
      const response = await api.put(`/opportunities/${id}`, opportunityData);
      return extractData(response);
    } catch (error) {
      console.error(`Error updating opportunity with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete opportunity
   */
  deleteOpportunity: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/opportunities/${id}`);
      // For boolean responses, check for success property in data
      if (response && typeof response === 'object' && response.data) {
        if (typeof response.data === 'object' && response.data.success !== undefined) {
          return Boolean(response.data.success);
        }
      }
      // Fallback to checking status code
      return response.status === 200;
    } catch (error) {
      console.error(`Error deleting opportunity with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change opportunity status
   */
  changeOpportunityStatus: async (id: number, status: string): Promise<Opportunity> => {
    try {
      const response = await api.patch(`/opportunities/${id}/status`, { status });
      return extractData(response);
    } catch (error) {
      console.error(`Error changing status for opportunity with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get matrix data for cross-sell opportunities visualization
   */
  getMatrixData: async (): Promise<MatrixData> => {
    try {
      const response = await api.get('/opportunities/matrix');
      // Log the response for debugging
      console.log('Matrix API response:', response);
      return extractData(response);
    } catch (error) {
      console.error('Error fetching matrix data:', error);
      throw error;
    }
  }
};

export default opportunityService;