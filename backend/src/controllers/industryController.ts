import { Request, Response } from 'express';
import IndustryModel, { Industry, IndustryInput, IndustryStatus } from '../models/Industry';

class IndustryController {
  /**
   * Create a new industry
   */
  async createIndustry(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, status } = req.body;
      
      // Validate required fields
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Industry name is required'
        });
        return;
      }
      
      // Check if industry with this name already exists
      const existingIndustry = await IndustryModel.findByName(name);
      if (existingIndustry) {
        res.status(400).json({
          success: false,
          message: 'An industry with this name already exists'
        });
        return;
      }
      
      // Create industry data object
      const industryData: IndustryInput = {
        name,
        description,
        status: status || IndustryStatus.ACTIVE
      };
      
      // Create the industry
      const industry = await IndustryModel.create(industryData);
      
      res.status(201).json({
        success: true,
        message: 'Industry created successfully',
        data: industry
      });
    } catch (error) {
      console.error('Error creating industry:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating industry'
      });
    }
  }
  
  /**
   * Get all industries
   */
  async getAllIndustries(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      
      let industries: Industry[];
      
      // If status filter is provided and it's 'active', get only active industries
      if (status === 'active') {
        industries = await IndustryModel.findActive();
      } else {
        industries = await IndustryModel.findAll();
      }
      
      res.status(200).json({
        success: true,
        data: industries
      });
    } catch (error) {
      console.error('Error fetching industries:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching industries'
      });
    }
  }
  
  /**
   * Get industry by ID
   */
  async getIndustryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID
      if (!id || isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Valid industry ID is required'
        });
        return;
      }
      
      // Find the industry
      const industry = await IndustryModel.findById(id);
      
      if (!industry) {
        res.status(404).json({
          success: false,
          message: 'Industry not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: industry
      });
    } catch (error) {
      console.error(`Error fetching industry with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching industry'
      });
    }
  }
  
  /**
   * Update an industry
   */
  async updateIndustry(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { name, description, status } = req.body;
      
      // Validate ID
      if (!id || isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Valid industry ID is required'
        });
        return;
      }
      
      // Check if industry exists
      const industry = await IndustryModel.findById(id);
      if (!industry) {
        res.status(404).json({
          success: false,
          message: 'Industry not found'
        });
        return;
      }
      
      // If name is being updated, check for duplicates
      if (name && name !== industry.name) {
        const existingIndustry = await IndustryModel.findByName(name);
        if (existingIndustry) {
          res.status(400).json({
            success: false,
            message: 'An industry with this name already exists'
          });
          return;
        }
      }
      
      // Create update data object
      const updateData: Partial<IndustryInput> = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      
      // Update the industry
      const updatedIndustry = await IndustryModel.update(id, updateData);
      
      if (!updatedIndustry) {
        res.status(400).json({
          success: false,
          message: 'No fields to update or update failed'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Industry updated successfully',
        data: updatedIndustry
      });
    } catch (error) {
      console.error(`Error updating industry with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating industry'
      });
    }
  }
  
  /**
   * Delete an industry
   */
  async deleteIndustry(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID
      if (!id || isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Valid industry ID is required'
        });
        return;
      }
      
      // Check if industry exists
      const industry = await IndustryModel.findById(id);
      if (!industry) {
        res.status(404).json({
          success: false,
          message: 'Industry not found'
        });
        return;
      }
      
      // Delete the industry
      const deleted = await IndustryModel.delete(id);
      
      if (!deleted) {
        res.status(400).json({
          success: false,
          message: 'Failed to delete industry'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Industry deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting industry with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting industry'
      });
    }
  }
  
  /**
   * Change industry status
   */
  async changeIndustryStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate ID
      if (!id || isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Valid industry ID is required'
        });
        return;
      }
      
      // Validate status
      if (!status || !Object.values(IndustryStatus).includes(status as IndustryStatus)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required (active or inactive)'
        });
        return;
      }
      
      // Check if industry exists
      const industry = await IndustryModel.findById(id);
      if (!industry) {
        res.status(404).json({
          success: false,
          message: 'Industry not found'
        });
        return;
      }
      
      // Update the industry status
      const updatedIndustry = await IndustryModel.update(id, { status: status as IndustryStatus });
      
      if (!updatedIndustry) {
        res.status(400).json({
          success: false,
          message: 'Failed to update industry status'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Industry status updated successfully',
        data: updatedIndustry
      });
    } catch (error) {
      console.error(`Error changing status for industry with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing industry status'
      });
    }
  }
}

export default new IndustryController();
