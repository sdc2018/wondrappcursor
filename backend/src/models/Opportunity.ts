import { Pool } from 'pg';
import db from '../config/database';

// Opportunity status options
export enum OpportunityStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
  ON_HOLD = 'on_hold'
}

// Opportunity priority options
export enum OpportunityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Opportunity interface
export interface Opportunity {
  id: number;
  name: string;
  client_id: number;
  service_id: number;
  assigned_user_id: number;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  estimated_value: number;
  due_date: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
}

// Opportunity input interface for creation/updates
export interface OpportunityInput {
  name: string;
  client_id: number;
  service_id: number;
  assigned_user_id: number;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  estimated_value: number;
  due_date: Date;
  notes?: string;
  is_deleted?: boolean;
}

class OpportunityModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Create the opportunities table if it doesn't exist
   */
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
        is_deleted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Opportunities table created or already exists');
    } catch (error) {
      console.error('Error creating opportunities table:', error);
      throw error;
    }
  }

  /**
   * Create a new opportunity
   */
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

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  /**
   * Find an opportunity by ID
   */
  async findById(id: number): Promise<Opportunity | null> {
    const query = 'SELECT * FROM opportunities WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding opportunity by ID:', error);
      throw error;
    }
  }

  /**
   * Find opportunities by client
   */
  async findByClient(clientId: number): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE client_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [clientId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities by client:', error);
      throw error;
    }
  }

  /**
   * Find opportunities by service
   */
  async findByService(serviceId: number): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE service_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [serviceId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities by service:', error);
      throw error;
    }
  }

  /**
   * Find opportunities by assigned user
   */
  async findByAssignedUser(userId: number): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE assigned_user_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities by assigned user:', error);
      throw error;
    }
  }

  /**
   * Find opportunities by status
   */
  async findByStatus(status: OpportunityStatus): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE status = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities by status:', error);
      throw error;
    }
  }

  /**
   * Find opportunities by priority
   */
  async findByPriority(priority: OpportunityPriority): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE priority = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [priority]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities by priority:', error);
      throw error;
    }
  }

  /**
   * Find opportunities due by a certain date
   */
  async findDueBy(date: Date): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE due_date <= $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query, [date]);
      return result.rows;
    } catch (error) {
      console.error('Error finding opportunities due by date:', error);
      throw error;
    }
  }

  /**
   * Get all opportunities
   */
  async findAll(): Promise<Opportunity[]> {
    const query = 'SELECT * FROM opportunities WHERE (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY due_date';
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all opportunities:', error);
      throw error;
    }
  }

  /**
   * Get active opportunities (not won, lost, or on hold)
   */
  async findActive(): Promise<Opportunity[]> {
    const query = `
      SELECT * FROM opportunities 
      WHERE status NOT IN ($1, $2, $3) 
      AND (is_deleted = FALSE OR is_deleted IS NULL)
      ORDER BY due_date
    `;
    
    try {
      const result = await this.pool.query(query, [
        OpportunityStatus.WON,
        OpportunityStatus.LOST,
        OpportunityStatus.ON_HOLD
      ]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active opportunities:', error);
      throw error;
    }
  }

  /**
   * Update an opportunity
   */
  async update(id: number, opportunityData: Partial<OpportunityInput>): Promise<Opportunity | null> {
    // Build the dynamic query based on provided fields
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is provided
    Object.keys(opportunityData).forEach(key => {
      if (opportunityData[key as keyof Partial<OpportunityInput>] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(opportunityData[key as keyof Partial<OpportunityInput>]);
        paramIndex++;
      }
    });

    // Add updated_at
    setFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // If no fields to update, return null
    if (setFields.length === 1) {
      return null;
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE opportunities
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  /**
   * Soft delete an opportunity by its ID
   */
  async delete(id: number): Promise<boolean> {
    const query = `
      UPDATE opportunities
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error soft deleting opportunity:', error);
      throw error;
    }
  }

  /**
   * Soft delete all opportunities for a client
   */
  async deleteByClientId(clientId: number): Promise<number> {
    const query = `
      UPDATE opportunities
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE client_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query, [clientId]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error soft deleting opportunities by client:', error);
      throw error;
    }
  }

  /**
   * Get cross-sell matrix data (clients vs services)
   * Returns data structured for the matrix view
   */
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
    
    try {
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
      });
      
      // Initialize matrix with null values
      Object.keys(clients).forEach(clientId => {
        matrix[clientId] = {};
        Object.keys(services).forEach(serviceId => {
          matrix[clientId][serviceId] = null;
        });
      });
      
      // Fill in the matrix with actual data
      result.rows.forEach(row => {
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
    } catch (error) {
      console.error('Error getting matrix data:', error);
      throw error;
    }
  }
}

export default new OpportunityModel();
