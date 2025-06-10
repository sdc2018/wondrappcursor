import { Pool } from 'pg';
import db from '../config/database';

// Service status options
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated'
}

// Service interface
export interface Service {
  id: number;
  name: string;
  description: string;
  pricing_model: string;
  pricing_details?: string;
  business_unit: string;
  applicable_industries: string[];
  client_role: string;
  status: ServiceStatus;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
}

// Service input interface for creation/updates
export interface ServiceInput {
  name: string;
  description: string;
  pricing_model: string;
  pricing_details?: string;
  business_unit: string;
  applicable_industries: string[];
  client_role: string;
  status: ServiceStatus;
  is_deleted?: boolean;
}

class ServiceModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Create the services table if it doesn't exist
   */
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        pricing_model VARCHAR(50) NOT NULL,
        pricing_details TEXT,
        business_unit VARCHAR(50) NOT NULL,
        applicable_industries TEXT[] NOT NULL,
        client_role VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Services table created or already exists');
    } catch (error) {
      console.error('Error creating services table:', error);
      throw error;
    }
  }

  /**
   * Create a new service
   */
  async create(serviceData: ServiceInput): Promise<Service> {
    const query = `
      INSERT INTO services (
        name, description, pricing_model, pricing_details, business_unit, 
        applicable_industries, client_role, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      serviceData.name,
      serviceData.description,
      serviceData.pricing_model,
      serviceData.pricing_details || null,
      serviceData.business_unit,
      serviceData.applicable_industries,
      serviceData.client_role,
      serviceData.status
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Find a service by ID
   */
  async findById(id: number): Promise<Service | null> {
    const query = 'SELECT * FROM services WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding service by ID:', error);
      throw error;
    }
  }

  /**
   * Find services by business unit
   */
  async findByBusinessUnit(businessUnit: string): Promise<Service[]> {
    const query = 'SELECT * FROM services WHERE business_unit = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)';
    
    try {
      const result = await this.pool.query(query, [businessUnit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding services by business unit:', error);
      throw error;
    }
  }

  /**
   * Find services by applicable industry
   */
  async findByIndustry(industry: string): Promise<Service[]> {
    const query = 'SELECT * FROM services WHERE $1 = ANY(applicable_industries) AND (is_deleted = FALSE OR is_deleted IS NULL)';
    
    try {
      const result = await this.pool.query(query, [industry]);
      return result.rows;
    } catch (error) {
      console.error('Error finding services by industry:', error);
      throw error;
    }
  }

  /**
   * Get all services
   */
  async findAll(): Promise<Service[]> {
    const query = 'SELECT * FROM services WHERE (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all services:', error);
      throw error;
    }
  }

  /**
   * Get active services
   */
  async findActive(): Promise<Service[]> {
    const query = 'SELECT * FROM services WHERE status = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [ServiceStatus.ACTIVE]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active services:', error);
      throw error;
    }
  }

  /**
   * Update a service
   */
  async update(id: number, serviceData: Partial<ServiceInput>): Promise<Service | null> {
    // Build the dynamic query based on provided fields
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is provided
    Object.keys(serviceData).forEach(key => {
      if (serviceData[key as keyof Partial<ServiceInput>] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(serviceData[key as keyof Partial<ServiceInput>]);
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
      UPDATE services
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete a service
   */
  async delete(id: number): Promise<boolean> {
    // Use soft delete by setting is_deleted to TRUE
    const query = `
      UPDATE services
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
}

export default new ServiceModel();
