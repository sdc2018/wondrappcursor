import { Pool } from 'pg';
import db from '../config/database';
import { UserRole } from './User';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Task {
  id: number;
  name: string;
  opportunity_id: number;
  assigned_user_id: number;
  due_date: Date;
  status: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskInput {
  name: string;
  opportunity_id: number;
  assigned_user_id: number;
  due_date: Date;
  status: string;
  description?: string;
}

export class TaskModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        assigned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Tasks table created or already exists');
    } catch (error) {
      console.error('Error creating tasks table:', error);
      throw error;
    }
  }

  async create(taskData: TaskInput): Promise<Task> {
    const { name, opportunity_id, assigned_user_id, due_date, status, description } = taskData;
    
    const query = `
      INSERT INTO tasks (name, opportunity_id, assigned_user_id, due_date, status, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const values = [name, opportunity_id, assigned_user_id, due_date, status, description || null];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Task | null> {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding task by ID:', error);
      throw error;
    }
  }

  async findByOpportunity(opportunityId: number): Promise<Task[]> {
    const query = 'SELECT * FROM tasks WHERE opportunity_id = $1 ORDER BY due_date ASC';
    
    try {
      const result = await this.pool.query(query, [opportunityId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding tasks by opportunity:', error);
      throw error;
    }
  }

  async findByAssignedUser(userId: number): Promise<Task[]> {
    const query = `
      SELECT t.*, o.name as opportunity_name, c.name as client_name, s.name as service_name
      FROM tasks t
      JOIN opportunities o ON t.opportunity_id = o.id
      JOIN clients c ON o.client_id = c.id
      JOIN services s ON o.service_id = s.id
      WHERE t.assigned_user_id = $1
      ORDER BY t.due_date ASC
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding tasks by assigned user:', error);
      throw error;
    }
  }

  async findAllTasks(): Promise<Task[]> {
    const query = `
      SELECT t.*, o.name as opportunity_name, c.name as client_name, s.name as service_name,
             u.username as assigned_user_name, s.business_unit
      FROM tasks t
      JOIN opportunities o ON t.opportunity_id = o.id
      JOIN clients c ON o.client_id = c.id
      JOIN services s ON o.service_id = s.id
      JOIN users u ON t.assigned_user_id = u.id
      ORDER BY t.due_date ASC
    `;
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all tasks:', error);
      throw error;
    }
  }

  async findOverdueTasks(): Promise<Task[]> {
    const query = `
      SELECT t.*, o.name as opportunity_name, c.name as client_name, s.name as service_name,
             u.email as assigned_user_email, u.username as assigned_user_name,
             s.business_unit
      FROM tasks t
      JOIN opportunities o ON t.opportunity_id = o.id
      JOIN clients c ON o.client_id = c.id
      JOIN services s ON o.service_id = s.id
      JOIN users u ON t.assigned_user_id = u.id
      WHERE t.status != $1 AND t.due_date < NOW()
      ORDER BY t.due_date ASC
    `;
    
    try {
      const result = await this.pool.query(query, [TaskStatus.COMPLETED]);
      return result.rows;
    } catch (error) {
      console.error('Error finding overdue tasks:', error);
      throw error;
    }
  }

  async update(id: number, taskData: Partial<TaskInput>): Promise<Task | null> {
    const allowedFields = ['name', 'assigned_user_id', 'due_date', 'status', 'description'];
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    // Build the SET clause dynamically based on provided fields
    Object.keys(taskData).forEach(key => {
      if (allowedFields.includes(key) && taskData[key as keyof Partial<TaskInput>] !== undefined) {
        updates.push(`${key} = $${valueIndex}`);
        values.push(taskData[key as keyof Partial<TaskInput>]);
        valueIndex++;
      }
    });

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    values.push(id);
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task | null> {
    const query = `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await this.pool.query(query, [status, id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTasksStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = $1) as pending_count,
        COUNT(*) FILTER (WHERE status = $2) as in_progress_count,
        COUNT(*) FILTER (WHERE status = $3) as completed_count,
        COUNT(*) FILTER (WHERE status != $3 AND due_date < NOW()) as overdue_count
      FROM tasks
    `;
    
    try {
      const result = await this.pool.query(query, [
        TaskStatus.PENDING, 
        TaskStatus.IN_PROGRESS, 
        TaskStatus.COMPLETED
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting tasks stats:', error);
      throw error;
    }
  }
}

export default new TaskModel();
