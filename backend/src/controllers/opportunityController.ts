import { Request, Response } from 'express';
import { OpportunityStatus, OpportunityPriority, OpportunityInput, Opportunity } from '../models/Opportunity';
import { Pool } from 'pg';
import db from '../config/database';

// Create our own instance of OpportunityModel since it's not properly exported
class OpportunityModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        client_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        assigned_user_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        estimated_value NUMERIC(12, 2) NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `;
    
    await this.pool.query(query);
  }

  async create(opportunityData: OpportunityInput): Promise<Opportunity> {
    const query = `
      INSERT INTO opportunities (
        name, client_id, service_id, assigned_user_id, status,
        priority, estimated_value, due_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      opportunityData.name,
      opportunityData.client_id,
      opportunityData.service_id,
      opportunityData.assigned_user_id,
      opportunityData.status,
      opportunityData.priority,
      opportunityData.estimated_value,
      opportunityData.due_date,
      opportunityData.notes || null
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: number): Promise<Opportunity | null> {
    const query = `SELECT * FROM opportunities WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findByClient(clientId: number): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities WHERE client_id = $1 ORDER BY due_date`;
    const result = await this.pool.query(query, [clientId]);
    
    return result.rows;
  }

  async findByService(serviceId: number): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities WHERE service_id = $1 ORDER BY due_date`;
    const result = await this.pool.query(query, [serviceId]);
    
    return result.rows;
  }

  async findByAssignedUser(userId: number): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities WHERE assigned_user_id = $1 ORDER BY due_date`;
    const result = await this.pool.query(query, [userId]);
    
    return result.rows;
  }

  async findByStatus(status: OpportunityStatus): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities WHERE status = $1 ORDER BY due_date`;
    const result = await this.pool.query(query, [status]);
    
    return result.rows;
  }

  async findByPriority(priority: OpportunityPriority): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities WHERE priority = $1 ORDER BY due_date`;
    const result = await this.pool.query(query, [priority]);
    
    return result.rows;
  }

  async findAll(): Promise<Opportunity[]> {
    const query = `SELECT * FROM opportunities ORDER BY due_date`;
    const result = await this.pool.query(query);
    
    return result.rows;
  }

  async update(id: number, opportunityData: Partial<OpportunityInput>): Promise<Opportunity | null> {
    // Build the SET part of the query dynamically based on the fields provided
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    // Add each field that needs to be updated
    Object.keys(opportunityData).forEach(key => {
      if (opportunityData[key as keyof OpportunityInput] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(opportunityData[key as keyof OpportunityInput]);
        paramCount++;
      }
    });
    
    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If no fields to update, return the existing record
    if (updates.length === 1) {
      return this.findById(id);
    }
    
    // Create the query
    const query = `
      UPDATE opportunities
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    // Add the ID as the last parameter
    values.push(id);
    
    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM opportunities WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMatrixData(): Promise<any> {
    const query = `
      SELECT 
        c.id AS client_id, 
        c.name AS client_name,
        s.id AS service_id,
        s.name AS service_name,
        s.business_unit,
        CASE
          WHEN o.id IS NOT NULL THEN o.status
          WHEN s.id = ANY(c.services_used) THEN 'active'
          ELSE NULL
        END AS status,
        o.id AS opportunity_id
      FROM 
        clients c
      CROSS JOIN 
        services s
      LEFT JOIN 
        opportunities o ON c.id = o.client_id AND s.id = o.service_id
      WHERE 
        s.status = 'active'
      ORDER BY 
        c.name, s.business_unit, s.name
    `;
    
    const result = await this.pool.query(query);
    
    // Transform the data for matrix view
    const clients: { [key: string]: any } = {};
    const services: { [key: string]: any } = {};
    const matrix: { [key: string]: { [key: string]: any } } = {};
    
    // First pass: collect unique clients and services
    result.rows.forEach(row => {
      if (!clients[row.client_id]) {
        clients[row.client_id] = { id: row.client_id, name: row.client_name };
      }
      
      if (!services[row.service_id]) {
        services[row.service_id] = { 
          id: row.service_id, 
          name: row.service_name,
          business_unit: row.business_unit
        };
      }
      
      // Initialize matrix cells
      if (!matrix[row.client_id]) {
        matrix[row.client_id] = {};
      }
      
      matrix[row.client_id][row.service_id] = {
        status: row.status,
        opportunity_id: row.opportunity_id
      };
    });
    
    return {
      clients: Object.values(clients),
      services: Object.values(services),
      matrix
    };
  }
}

// Initialize the Opportunity model
const opportunityModel = new OpportunityModel();

class OpportunityController {
  /**
   * Create a new opportunity
   * @route POST /api/opportunities
   * @access Private - Admin, Sales, BU Head
   */
  async createOpportunity(req: Request, res: Response): Promise<void> {
    try {
      const opportunityData: OpportunityInput = req.body;
      
      // Validate required fields
      if (!opportunityData.name || !opportunityData.client_id || !opportunityData.service_id) {
        res.status(400).json({ message: 'Name, client ID, and service ID are required' });
        return;
      }
      
      // Set assigned user to current user if not specified
      if (!opportunityData.assigned_user_id && req.user) {
        opportunityData.assigned_user_id = req.user.userId;
      }
      
      // Set default status if not provided
      if (!opportunityData.status) {
        opportunityData.status = OpportunityStatus.NEW;
      }
      
      // Set default priority if not provided
      if (!opportunityData.priority) {
        opportunityData.priority = OpportunityPriority.MEDIUM;
      }
      
      const opportunity = await opportunityModel.create(opportunityData);
      res.status(201).json(opportunity);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      res.status(500).json({ message: 'Failed to create opportunity', error: (error as Error).message });
    }
  }
  
  /**
   * Get all opportunities with optional filtering
   * @route GET /api/opportunities
   * @access Private - All authenticated users
   */
  async getAllOpportunities(_req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, client_id, service_id, assigned_user_id } = _req.query;
      
      // Apply filters if provided
      let opportunities: Opportunity[];
      
      if (status) {
        opportunities = await opportunityModel.findByStatus(status as OpportunityStatus);
      } else if (priority) {
        opportunities = await opportunityModel.findByPriority(priority as OpportunityPriority);
      } else if (client_id) {
        opportunities = await opportunityModel.findByClient(Number(client_id));
      } else if (service_id) {
        opportunities = await opportunityModel.findByService(Number(service_id));
      } else if (assigned_user_id) {
        opportunities = await opportunityModel.findByAssignedUser(Number(assigned_user_id));
      } else {
        opportunities = await opportunityModel.findAll();
      }
      
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      res.status(500).json({ message: 'Failed to fetch opportunities', error: (error as Error).message });
    }
  }
  
  /**
   * Get opportunity by ID
   * @route GET /api/opportunities/:id
   * @access Private - All authenticated users
   */
  async getOpportunityById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid opportunity ID' });
        return;
      }
      
      const opportunity = await opportunityModel.findById(id);
      
      if (!opportunity) {
        res.status(404).json({ message: 'Opportunity not found' });
        return;
      }
      
      res.status(200).json(opportunity);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      res.status(500).json({ message: 'Failed to fetch opportunity', error: (error as Error).message });
    }
  }
  
  /**
   * Get opportunities by client
   * @route GET /api/opportunities/client/:clientId
   * @access Private - All authenticated users
   */
  async getOpportunitiesByClient(req: Request, res: Response): Promise<void> {
    try {
      const clientId = Number(req.params.clientId);
      
      if (isNaN(clientId)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      
      const opportunities = await opportunityModel.findByClient(clientId);
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching client opportunities:', error);
      res.status(500).json({ message: 'Failed to fetch client opportunities', error: (error as Error).message });
    }
  }
  
  /**
   * Get opportunities by service
   * @route GET /api/opportunities/service/:serviceId
   * @access Private - All authenticated users
   */
  async getOpportunitiesByService(req: Request, res: Response): Promise<void> {
    try {
      const serviceId = Number(req.params.serviceId);
      
      if (isNaN(serviceId)) {
        res.status(400).json({ message: 'Invalid service ID' });
        return;
      }
      
      const opportunities = await opportunityModel.findByService(serviceId);
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching service opportunities:', error);
      res.status(500).json({ message: 'Failed to fetch service opportunities', error: (error as Error).message });
    }
  }
  
  /**
   * Get opportunities by assigned user
   * @route GET /api/opportunities/user/:userId
   * @access Private - All authenticated users
   */
  async getOpportunitiesByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      
      const opportunities = await opportunityModel.findByAssignedUser(userId);
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching user opportunities:', error);
      res.status(500).json({ message: 'Failed to fetch user opportunities', error: (error as Error).message });
    }
  }
  
  /**
   * Update opportunity
   * @route PUT /api/opportunities/:id
   * @access Private - Admin, Sales, BU Head
   */
  async updateOpportunity(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const opportunityData: Partial<OpportunityInput> = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid opportunity ID' });
        return;
      }
      
      // Check if opportunity exists
      const existingOpportunity = await opportunityModel.findById(id);
      
      if (!existingOpportunity) {
        res.status(404).json({ message: 'Opportunity not found' });
        return;
      }
      
      const updatedOpportunity = await opportunityModel.update(id, opportunityData);
      res.status(200).json(updatedOpportunity);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      res.status(500).json({ message: 'Failed to update opportunity', error: (error as Error).message });
    }
  }
  
  /**
   * Delete opportunity
   * @route DELETE /api/opportunities/:id
   * @access Private - Admin only
   */
  async deleteOpportunity(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid opportunity ID' });
        return;
      }
      
      // Check if opportunity exists
      const existingOpportunity = await opportunityModel.findById(id);
      
      if (!existingOpportunity) {
        res.status(404).json({ message: 'Opportunity not found' });
        return;
      }
      
      const deleted = await opportunityModel.delete(id);
      
      if (!deleted) {
        res.status(500).json({ message: 'Failed to delete opportunity' });
        return;
      }
      
      res.status(200).json({ message: 'Opportunity deleted successfully' });
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      res.status(500).json({ message: 'Failed to delete opportunity', error: (error as Error).message });
    }
  }
  
  /**
   * Get cross-sell matrix data
   * @route GET /api/opportunities/matrix
   * @access Private - All authenticated users
   */
  async getCrossSellMatrix(_req: Request, res: Response): Promise<void> {
    try {
      const matrixData = await opportunityModel.getMatrixData();
      res.status(200).json(matrixData);
    } catch (error) {
      console.error('Error generating cross-sell matrix:', error);
      res.status(500).json({ message: 'Failed to generate cross-sell matrix', error: (error as Error).message });
    }
  }
}

export default new OpportunityController();