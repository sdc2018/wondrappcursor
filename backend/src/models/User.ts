import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import db from '../config/database';

// Define User roles
export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  BU_HEAD = 'bu_head',
  SENIOR_MANAGEMENT = 'senior_management'
}

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

// User model class
class UserModel {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // Create user table if it doesn't exist
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await this.db.query(query);
      console.log('Users table created or already exists');
    } catch (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
  }

  // Create a new user
  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const values = [user.username, user.email, hashedPassword, user.role];
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    
    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await this.db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result = await this.db.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Update user
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    // Start building the query
    let query = 'UPDATE users SET ';
    const values: any[] = [];
    let valueIndex = 1;
    
    // Add fields to update
    const updateFields: string[] = [];
    
    if (userData.username) {
      updateFields.push(`username = $${valueIndex++}`);
      values.push(userData.username);
    }
    
    if (userData.email) {
      updateFields.push(`email = $${valueIndex++}`);
      values.push(userData.email);
    }
    
    if (userData.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      updateFields.push(`password = $${valueIndex++}`);
      values.push(hashedPassword);
    }
    
    if (userData.role) {
      updateFields.push(`role = $${valueIndex++}`);
      values.push(userData.role);
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If no fields to update, return null
    if (updateFields.length === 0) {
      return null;
    }
    
    // Complete the query
    query += updateFields.join(', ');
    query += ` WHERE id = $${valueIndex} RETURNING *`;
    values.push(id);
    
    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    
    try {
      const result = await this.db.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Validate user credentials
  async validateCredentials(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error validating credentials:', error);
      throw error;
    }
  }

  // Get all users
  async getAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY id';
    
    try {
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Compare password with hashed password
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the password in the database
      const query = `
        UPDATE users
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;
      
      const result = await this.db.query(query, [hashedPassword, userId]);
      
      // Return true if a row was updated, false otherwise
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

// Export an instance of the model with the database connection
export default new UserModel(db);
