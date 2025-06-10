import { Request, Response } from 'express';
import BusinessUnitModel, { BusinessUnit, BusinessUnitInput, BusinessUnitStatus } from '../models/BusinessUnit';

/**
 * Business Unit Controller Class
 */
class BusinessUnitController {
  /**
   * Create a new business unit
   */
  async createBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, status, owner_id } = req.body;

      // Validate required fields
      if (!name || !description) {
        res.status(400).json({ 
          success: false,
          message: 'Name and description are required' 
        });
        return;
      }

      // Check if business unit with the same name already exists
      const existingBusinessUnit = await BusinessUnitModel.findByName(name);
      if (existingBusinessUnit) {
        res.status(409).json({ 
          success: false,
          message: 'Business unit with this name already exists' 
        });
        return;
      }

      // Create business unit with status or default to ACTIVE
      const businessUnitData: BusinessUnitInput = {
        name,
        description,
        status: status || BusinessUnitStatus.ACTIVE,
        owner_id: owner_id || undefined
      };

      const businessUnit = await BusinessUnitModel.create(businessUnitData);
      
      res.status(201).json({
        success: true,
        message: 'Business unit created successfully',
        data: businessUnit
      });
    } catch (error) {
      console.error('Error creating business unit:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during business unit creation' 
      });
    }
  }

  /**
   * Get all business units
   */
  async getAllBusinessUnits(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string;
      let businessUnits: BusinessUnit[];
      
      // If status is specified as 'active', only return active business units
      if (status === 'active') {
        businessUnits = await BusinessUnitModel.findActive();
      } else {
        businessUnits = await BusinessUnitModel.findAll();
      }
      
      res.status(200).json({
        success: true,
        data: businessUnits
      });
    } catch (error) {
      console.error('Error getting business units:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while retrieving business units' 
      });
    }
  }

  /**
   * Get a business unit by ID
   */
  async getBusinessUnitById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ 
          success: false,
          message: 'Valid business unit ID is required' 
        });
        return;
      }
      
      // Get business unit
      const businessUnit = await BusinessUnitModel.findById(Number(id));
      
      if (!businessUnit) {
        res.status(404).json({ 
          success: false,
          message: 'Business unit not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: businessUnit
      });
    } catch (error) {
      console.error(`Error getting business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while retrieving business unit' 
      });
    }
  }

  /**
   * Update a business unit
   */
  async updateBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { name, description, status, owner_id } = req.body;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ 
          success: false,
          message: 'Valid business unit ID is required' 
        });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ 
          success: false,
          message: 'Business unit not found' 
        });
        return;
      }
      
      // Check if there's another business unit with the same name
      if (name && name !== existingBusinessUnit.name) {
        const duplicateBusinessUnit = await BusinessUnitModel.findByName(name);
        if (duplicateBusinessUnit) {
          res.status(409).json({ 
            success: false,
            message: 'Another business unit with this name already exists' 
          });
          return;
        }
      }
      
      // Prepare update data
      const updateData: Partial<BusinessUnitInput> = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status as BusinessUnitStatus;
      // Include owner_id in update data if it's provided in the request
      if (owner_id !== undefined) {
        updateData.owner_id = owner_id === null ? null : Number(owner_id);
      }
      
      // Update the business unit
      const updatedBusinessUnit = await BusinessUnitModel.update(Number(id), updateData);
      
      if (!updatedBusinessUnit) {
        res.status(400).json({ 
          success: false,
          message: 'Update failed - no valid fields provided' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Business unit updated successfully',
        data: updatedBusinessUnit
      });
    } catch (error) {
      console.error(`Error updating business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while updating business unit' 
      });
    }
  }

  /**
   * Delete a business unit
   */
  async deleteBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ 
          success: false,
          message: 'Valid business unit ID is required' 
        });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ 
          success: false,
          message: 'Business unit not found' 
        });
        return;
      }
      
      // Delete the business unit
      const success = await BusinessUnitModel.delete(Number(id));
      
      if (!success) {
        res.status(500).json({ 
          success: false,
          message: 'Failed to delete business unit' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Business unit deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while deleting business unit' 
      });
    }
  }

  /**
   * Change business unit status
   */
  async changeBusinessUnitStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ 
          success: false,
          message: 'Valid business unit ID is required' 
        });
        return;
      }
      
      // Validate status
      if (!status || !Object.values(BusinessUnitStatus).includes(status as BusinessUnitStatus)) {
        res.status(400).json({ 
          success: false,
          message: 'Valid status is required (active or inactive)' 
        });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ 
          success: false,
          message: 'Business unit not found' 
        });
        return;
      }
      
      // Update status
      const updatedBusinessUnit = await BusinessUnitModel.update(Number(id), { status: status as BusinessUnitStatus });
      
      if (!updatedBusinessUnit) {
        res.status(400).json({ 
          success: false,
          message: 'Status update failed' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Business unit status updated successfully',
        data: updatedBusinessUnit
      });
    } catch (error) {
      console.error(`Error changing status for business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while changing business unit status' 
      });
    }
  }
}

// Export controller instance
export default new BusinessUnitController();