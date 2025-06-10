import api from './api';

// Define types
export interface Client {
  id: number;
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  account_owner_id: number;
  services_used: number[];
  crm_link?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  account_owner_id: number;
  services_used: number[];
  crm_link?: string;
  notes?: string;
  status: string;
}

export interface AccountOwner {
  id: number;
  username: string;
  email: string;
}

const clientService = {
  /**
   * Get all clients
   */
  getAllClients: async (): Promise<Client[]> => {
    try {
      const response = await api.get('/clients');
      // Extract clients array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  /**
   * Get client by ID
   */
  getClientById: async (id: number): Promise<Client> => {
    try {
      const response = await api.get(`/clients/${id}`);
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get clients by industry
   */
  getClientsByIndustry: async (industry: string): Promise<Client[]> => {
    try {
      const response = await api.get(`/clients/industry/${industry}`);
      // Extract clients array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching clients for industry ${industry}:`, error);
      throw error;
    }
  },

  /**
   * Get clients by account owner
   */
  getClientsByAccountOwner: async (accountOwnerId: number): Promise<Client[]> => {
    try {
      const response = await api.get(`/clients/account-owner/${accountOwnerId}`);
      // Extract clients array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching clients for account owner ${accountOwnerId}:`, error);
      throw error;
    }
  },

  /**
   * Create new client
   */
  createClient: async (clientData: ClientInput): Promise<Client> => {
    try {
      const response = await api.post('/clients', clientData);
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  /**
   * Update client
   */
  updateClient: async (id: number, clientData: Partial<ClientInput>): Promise<Client> => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error updating client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete client
   * @param id The client ID to delete
   * @param force Whether to force delete the client and its opportunities
   * @returns A promise that resolves to an object with success status and message
   */
  deleteClient: async (id: number, force: boolean = false): Promise<any> => {
    try {
      const response = await api.delete(`/clients/${id}?force=${force}`);
      return response.data;
    } catch (error: any) {
      // If the error is a 409 Conflict (client has opportunities), return the response data
      if (error.response && error.response.status === 409) {
        return error.response.data;
      }
      console.error(`Error deleting client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change client status
   */
  changeClientStatus: async (id: number, status: string): Promise<Client> => {
    try {
      const response = await api.patch(`/clients/${id}/status`, { status });
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error changing status for client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add service to client
   */
  addServiceToClient: async (clientId: number, serviceId: number): Promise<Client> => {
    try {
      const response = await api.post(`/clients/${clientId}/services`, { serviceId });
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error adding service ${serviceId} to client ${clientId}:`, error);
      throw error;
    }
  },

  /**
   * Remove service from client
   */
  removeServiceFromClient: async (clientId: number, serviceId: number): Promise<Client> => {
    try {
      const response = await api.delete(`/clients/${clientId}/services/${serviceId}`);
      // Extract client data from the response data structure
      return response.data.data;
    } catch (error) {
      console.error(`Error removing service ${serviceId} from client ${clientId}:`, error);
      throw error;
    }
  },

  /**
   * Get services for a client
   */
  getClientServices: async (clientId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/clients/${clientId}/services`);
      // Extract services array from the response data structure
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching services for client ${clientId}:`, error);
      throw error;
    }
  }
};

export default clientService;
