import { Request, Response } from 'express';
import ServiceModel, { ServiceInput, ServiceStatus } from '../models/Service';

/**
 * Service Controller
 * Handles all service-related operations
 */
class ServiceController {
  /**
   * Create a new service
   * @route POST /api/services
   * @access Private (Admin, BU Head)
   */
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const serviceData: ServiceInput = req.body;
      
      // Validate required fields
      if (!serviceData.name || !serviceData.description || !serviceData.business_unit) {
        res.status(400).json({ message: 'Please provide all required fields' });
        return;
      }
      
      // Create the service
      const service = await ServiceModel.create(serviceData);
      
      res.status(201).json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating service'
      });
    }
  }

  /**
   * Get all services
   * @route GET /api/services
   * @access Private
   */
  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      // Check for query parameters
      const { status, businessUnit } = req.query;
      
      let services;
      
      if (status === 'active') {
        services = await ServiceModel.findActive();
      } else if (businessUnit) {
        services = await ServiceModel.findByBusinessUnit(businessUnit as string);
      } else {
        services = await ServiceModel.findAll();
      }
      
      res.status(200).json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving services'
      });
    }
  }

  /**
   * Get service by ID
   * @route GET /api/services/:id
   * @access Private
   */
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid service ID' });
        return;
      }
      
      const service = await ServiceModel.findById(id);
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Error getting service:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving service'
      });
    }
  }

  /**
   * Get services by business unit
   * @route GET /api/services/business-unit/:businessUnit
   * @access Private
   */
  async getServicesByBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const businessUnit = req.params.businessUnit;
      
      if (!businessUnit) {
        res.status(400).json({ message: 'Business unit is required' });
        return;
      }
      
      const services = await ServiceModel.findByBusinessUnit(businessUnit);
      
      res.status(200).json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (error) {
      console.error('Error getting services by business unit:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving services'
      });
    }
  }

  /**
   * Get services by industry
   * @route GET /api/services/industry/:industry
   * @access Private
   */
  async getServicesByIndustry(req: Request, res: Response): Promise<void> {
    try {
      const industry = req.params.industry;
      
      if (!industry) {
        res.status(400).json({ message: 'Industry is required' });
        return;
      }
      
      const services = await ServiceModel.findByIndustry(industry);
      
      res.status(200).json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (error) {
      console.error('Error getting services by industry:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving services'
      });
    }
  }

  /**
   * Update a service
   * @route PUT /api/services/:id
   * @access Private (Admin, BU Head)
   */
  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid service ID' });
        return;
      }
      
      // Check if service exists
      const existingService = await ServiceModel.findById(id);
      
      if (!existingService) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Update the service
      const updatedService = await ServiceModel.update(id, updateData);
      
      if (!updatedService) {
        res.status(400).json({ message: 'No fields to update or update failed' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedService
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating service'
      });
    }
  }

  /**
   * Delete a service
   * @route DELETE /api/services/:id
   * @access Private (Admin only)
   */
  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid service ID' });
        return;
      }
      
      // Check if service exists
      const existingService = await ServiceModel.findById(id);
      
      if (!existingService) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Delete the service
      const deleted = await ServiceModel.delete(id);
      
      if (!deleted) {
        res.status(400).json({ message: 'Failed to delete service' });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting service'
      });
    }
  }

  /**
   * Change service status
   * @route PATCH /api/services/:id/status
   * @access Private (Admin, BU Head)
   */
  async changeServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid service ID' });
        return;
      }
      
      if (!status || !Object.values(ServiceStatus).includes(status as ServiceStatus)) {
        res.status(400).json({ 
          message: 'Invalid status. Must be one of: ' + Object.values(ServiceStatus).join(', ') 
        });
        return;
      }
      
      // Check if service exists
      const existingService = await ServiceModel.findById(id);
      
      if (!existingService) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Update just the status
      const updatedService = await ServiceModel.update(id, { status: status as ServiceStatus });
      
      if (!updatedService) {
        res.status(400).json({ message: 'Failed to update service status' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedService
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating service status'
      });
    }
  }
}

export default new ServiceController();
