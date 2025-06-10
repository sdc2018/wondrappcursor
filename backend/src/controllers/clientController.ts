import { Request, Response } from 'express';
import ClientModel, { ClientInput, ClientStatus } from '../models/Client';

/**
 * Client Controller
 * Handles all client-related operations
 */
class ClientController {
  /**
   * Create a new client
   * @route POST /api/clients
   * @access Private (Admin, Sales)
   */
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const clientData: ClientInput = req.body;
      
      // Validate required fields
      if (!clientData.name || !clientData.industry || !clientData.account_owner_id) {
        res.status(400).json({ message: 'Please provide all required fields' });
        return;
      }
      
      // Create the client
      const client = await ClientModel.create(clientData);
      
      res.status(201).json({
        success: true,
        data: client
      });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating client'
      });
    }
  }

  /**
   * Get all clients
   * @route GET /api/clients
   * @access Private
   */
  async getAllClients(req: Request, res: Response): Promise<void> {
    try {
      // Check for query parameters
      const { status, industry, accountOwnerId } = req.query;
      
      let clients;
      
      if (status === 'active') {
        clients = await ClientModel.findActive();
      } else if (industry) {
        clients = await ClientModel.findByIndustry(industry as string);
      } else if (accountOwnerId) {
        const ownerId = parseInt(accountOwnerId as string);
        if (isNaN(ownerId)) {
          res.status(400).json({ message: 'Invalid account owner ID' });
          return;
        }
        clients = await ClientModel.findByAccountOwner(ownerId);
      } else {
        clients = await ClientModel.findAll();
      }
      
      res.status(200).json({
        success: true,
        count: clients.length,
        data: clients
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving clients'
      });
    }
  }

  /**
   * Get client by ID
   * @route GET /api/clients/:id
   * @access Private
   */
  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      const client = await ClientModel.findById(id);
      
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: client
      });
    } catch (error) {
      console.error('Error getting client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving client'
      });
    }
  }

  /**
   * Get clients by industry
   * @route GET /api/clients/industry/:industry
   * @access Private
   */
  async getClientsByIndustry(req: Request, res: Response): Promise<void> {
    try {
      const industry = req.params.industry;
      
      if (!industry) {
        res.status(400).json({ message: 'Industry is required' });
        return;
      }
      
      const clients = await ClientModel.findByIndustry(industry);
      
      res.status(200).json({
        success: true,
        count: clients.length,
        data: clients
      });
    } catch (error) {
      console.error('Error getting clients by industry:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving clients'
      });
    }
  }

  /**
   * Get clients by account owner
   * @route GET /api/clients/account-owner/:id
   * @access Private
   */
  async getClientsByAccountOwner(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid account owner ID' });
        return;
      }
      
      const clients = await ClientModel.findByAccountOwner(id);
      
      res.status(200).json({
        success: true,
        count: clients.length,
        data: clients
      });
    } catch (error) {
      console.error('Error getting clients by account owner:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving clients'
      });
    }
  }

  /**
   * Update a client
   * @route PUT /api/clients/:id
   * @access Private (Admin, Sales)
   */
  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(id);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Update the client
      const updatedClient = await ClientModel.update(id, updateData);
      
      if (!updatedClient) {
        res.status(400).json({ message: 'No fields to update or update failed' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedClient
      });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating client'
      });
    }
  }

  /**
   * Delete client
   * @route DELETE /api/clients/:id
   * @access Private (Admin)
   */
  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { force } = req.query;
      const forceDelete = force === 'true';
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(id);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Check for related opportunities
      const opportunityModel = (await import('../models/Opportunity')).default;
      const relatedOpportunities = await opportunityModel.findByClient(id);
      
      // If there are related opportunities and not forcing delete, return a warning
      if (relatedOpportunities.length > 0 && !forceDelete) {
        res.status(409).json({
          success: false,
          message: 'Client has related opportunities',
          hasOpportunities: true,
          opportunityCount: relatedOpportunities.length
        });
        return;
      }
      
      // If force delete is true and there are opportunities, delete them first
      if (forceDelete && relatedOpportunities.length > 0) {
        // Use the bulk delete method for better performance
        await opportunityModel.deleteByClientId(id);
      }
      
      // Delete the client
      const deleted = await ClientModel.delete(id);
      
      if (!deleted) {
        res.status(400).json({ message: 'Failed to delete client' });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: forceDelete && relatedOpportunities.length > 0 
          ? `Client and ${relatedOpportunities.length} related opportunities deleted successfully`
          : 'Client deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting client'
      });
    }
  }

  /**
   * Change client status
   * @route PATCH /api/clients/:id/status
   * @access Private (Admin, Sales)
   */
  async changeClientStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      if (!status || !Object.values(ClientStatus).includes(status as ClientStatus)) {
        res.status(400).json({ 
          message: 'Invalid status. Must be one of: ' + Object.values(ClientStatus).join(', ') 
        });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(id);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Update just the status
      const updatedClient = await ClientModel.update(id, { status: status as ClientStatus });
      
      if (!updatedClient) {
        res.status(400).json({ message: 'Failed to update client status' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedClient
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating client status'
      });
    }
  }

  /**
   * Add service to client
   * @route POST /api/clients/:clientId/services/:serviceId
   * @access Private (Admin, Sales)
   */
  async addServiceToClient(req: Request, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.clientId);
      const serviceId = parseInt(req.params.serviceId);
      
      if (isNaN(clientId) || isNaN(serviceId)) {
        res.status(400).json({ message: 'Invalid client ID or service ID' });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(clientId);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Add service to client
      const result = await ClientModel.addService(clientId, serviceId);
      
      if (!result) {
        res.status(400).json({ message: 'Failed to add service to client or service already added' });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Service added to client successfully'
      });
    } catch (error) {
      console.error('Error adding service to client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while adding service to client'
      });
    }
  }

  /**
   * Remove service from client
   * @route DELETE /api/clients/:clientId/services/:serviceId
   * @access Private (Admin, Sales)
   */
  async removeServiceFromClient(req: Request, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.clientId);
      const serviceId = parseInt(req.params.serviceId);
      
      if (isNaN(clientId) || isNaN(serviceId)) {
        res.status(400).json({ message: 'Invalid client ID or service ID' });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(clientId);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Remove service from client
      const result = await ClientModel.removeService(clientId, serviceId);
      
      if (!result) {
        res.status(400).json({ message: 'Failed to remove service from client or service not associated' });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Service removed from client successfully'
      });
    } catch (error) {
      console.error('Error removing service from client:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while removing service from client'
      });
    }
  }

  /**
   * Get services for a client
   * @route GET /api/clients/:id/services
   * @access Private
   */
  async getClientServices(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      // Check if client exists
      const existingClient = await ClientModel.findById(id);
      
      if (!existingClient) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }
      
      // Get client services
      const services = await ClientModel.getServices(id);
      
      res.status(200).json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (error) {
      console.error('Error getting client services:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving client services'
      });
    }
  }
}

export default new ClientController();
