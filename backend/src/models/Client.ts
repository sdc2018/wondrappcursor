import { Pool } from 'pg';
import db from '../config/database';

// Client status options
export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect'
}

// Client interface
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
  status: ClientStatus;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
}

// Client input interface for creation/updates
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
  status: ClientStatus;
  is_deleted?: boolean;
}

class ClientModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Create the clients table if it doesn't exist
   */
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        industry VARCHAR(50) NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        contact_email VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        account_owner_id INTEGER NOT NULL,
        services_used INTEGER[] NOT NULL,
        crm_link TEXT,
        notes TEXT,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_owner_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Clients table created or already exists');
    } catch (error) {
      console.error('Error creating clients table:', error);
      throw error;
    }
  }

  /**
   * Create a new client
   */
  async create(clientData: ClientInput): Promise<Client> {
    const query = `
      INSERT INTO clients (
        name, industry, contact_name, contact_email, contact_phone, address,
        account_owner_id, services_used, crm_link, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      clientData.name,
      clientData.industry,
      clientData.contact_name,
      clientData.contact_email,
      clientData.contact_phone,
      clientData.address,
      clientData.account_owner_id,
      clientData.services_used,
      clientData.crm_link || null,
      clientData.notes || null,
      clientData.status
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Find a client by ID
   */
  async findById(id: number): Promise<Client | null> {
    const query = 'SELECT * FROM clients WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding client by ID:', error);
      throw error;
    }
  }

  /**
   * Find clients by account owner ID
   */
  async findByAccountOwner(accountOwnerId: number): Promise<Client[]> {
    const query = 'SELECT * FROM clients WHERE account_owner_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [accountOwnerId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding clients by account owner:', error);
      throw error;
    }
  }

  /**
   * Find clients by industry
   */
  async findByIndustry(industry: string): Promise<Client[]> {
    const query = 'SELECT * FROM clients WHERE industry = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [industry]);
      return result.rows;
    } catch (error) {
      console.error('Error finding clients by industry:', error);
      throw error;
    }
  }

  /**
   * Find clients using a specific service
   */
  async findByService(serviceId: number): Promise<Client[]> {
    const query = 'SELECT * FROM clients WHERE $1 = ANY(services_used) AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [serviceId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding clients by service:', error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async findAll(): Promise<Client[]> {
    const query = 'SELECT * FROM clients WHERE is_deleted = FALSE OR is_deleted IS NULL ORDER BY name';
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all clients:', error);
      throw error;
    }
  }

  /**
   * Get active clients
   */
  async findActive(): Promise<Client[]> {
    const query = 'SELECT * FROM clients WHERE status = $1 AND (is_deleted = FALSE OR is_deleted IS NULL) ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [ClientStatus.ACTIVE]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active clients:', error);
      throw error;
    }
  }

  /**
   * Update a client
   */
  async update(id: number, clientData: Partial<ClientInput>): Promise<Client | null> {
    // Build the dynamic query based on provided fields
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is provided
    Object.keys(clientData).forEach(key => {
      if (clientData[key as keyof Partial<ClientInput>] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(clientData[key as keyof Partial<ClientInput>]);
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
      UPDATE clients
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Delete a client
   */
  async delete(id: number): Promise<boolean> {
    const query = 'UPDATE clients SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error soft deleting client:', error);
      throw error;
    }
  }

  /**
   * Add a service to a client
   */
  async addService(clientId: number, serviceId: number): Promise<Client | null> {
    const query = `
      UPDATE clients
      SET services_used = array_append(services_used, $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND NOT ($1 = ANY(services_used))
      RETURNING *
    `;
    
    try {
      const result = await this.pool.query(query, [serviceId, clientId]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error adding service to client:', error);
      throw error;
    }
  }

  /**
   * Remove a service from a client
   */
  async removeService(clientId: number, serviceId: number): Promise<Client | null> {
    try {
    const query = `
      UPDATE clients
      SET services_used = array_remove(services_used, $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
      const values = [serviceId, clientId];
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error removing service from client:', error);
      throw error;
    }
  }

  /**
   * Get all services for a client
   * @param clientId The ID of the client
   * @returns Array of service objects associated with the client
   */
  async getServices(clientId: number): Promise<any[]> {
    try {
      // First get the client to access the services_used array
      const client = await this.findById(clientId);
      
      if (!client || !client.services_used || client.services_used.length === 0) {
        return [];
      }
      
      // Query to get all services with IDs in the services_used array
      const query = `
        SELECT * FROM services 
        WHERE id = ANY($1)
        ORDER BY name
      `;
      
      const result = await this.pool.query(query, [client.services_used]);
      return result.rows;
    } catch (error) {
      console.error('Error getting client services:', error);
      throw error;
    }
  }
}

export default new ClientModel();