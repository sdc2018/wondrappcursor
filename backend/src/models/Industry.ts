import { Pool } from 'pg';
import db from '../config/database';

export enum IndustryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Industry {
  id: number;
  name: string;
  description?: string;
  status: IndustryStatus;
  created_at: Date;
  updated_at: Date;
}

export interface IndustryInput {
  name: string;
  description?: string;
  status: IndustryStatus;
}

class IndustryModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Create the industries table if it doesn't exist
   */
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Industries table created or already exists');
    } catch (error) {
      console.error('Error creating industries table:', error);
      throw error;
    }
  }

  /**
   * Create a new industry
   */
  async create(industryData: IndustryInput): Promise<Industry> {
    const query = `
      INSERT INTO industries (
        name, description, status
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      industryData.name,
      industryData.description || null,
      industryData.status
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating industry:', error);
      throw error;
    }
  }

  /**
   * Find an industry by ID
   */
  async findById(id: number): Promise<Industry | null> {
    const query = 'SELECT * FROM industries WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error finding industry with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find an industry by name
   */
  async findByName(name: string): Promise<Industry | null> {
    const query = 'SELECT * FROM industries WHERE name = $1';
    
    try {
      const result = await this.pool.query(query, [name]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error finding industry with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get all industries
   */
  async findAll(): Promise<Industry[]> {
    const query = 'SELECT * FROM industries ORDER BY name';
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all industries:', error);
      throw error;
    }
  }

  /**
   * Get active industries
   */
  async findActive(): Promise<Industry[]> {
    const query = 'SELECT * FROM industries WHERE status = $1 ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [IndustryStatus.ACTIVE]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active industries:', error);
      throw error;
    }
  }

  /**
   * Update an industry
   */
  async update(id: number, industryData: Partial<IndustryInput>): Promise<Industry | null> {
    // Build the dynamic query based on provided fields
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is provided
    Object.keys(industryData).forEach(key => {
      if (industryData[key as keyof Partial<IndustryInput>] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(industryData[key as keyof Partial<IndustryInput>]);
        paramIndex++;
      }
    });

    // Add updated_at timestamp
    setFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // If no fields to update, return null
    if (setFields.length === 1) {
      return null;
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE industries
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating industry with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an industry
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM industries WHERE id = $1 RETURNING *';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting industry:', error);
      throw error;
    }
  }
}

export default new IndustryModel();
