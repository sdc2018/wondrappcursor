import { Pool } from 'pg';
import db from '../config/database';
import { UserRole } from './User';

export enum NotificationType {
  NEW_OPPORTUNITY = 'new_opportunity',
  OPPORTUNITY_STATUS_CHANGE = 'opportunity_status_change',
  TASK_ASSIGNED = 'task_assigned',
  TASK_OVERDUE = 'task_overdue',
  TASK_OVERDUE_ESCALATION = 'task_overdue_escalation',
  NEW_CLIENT = 'new_client',
  OPPORTUNITY_WON = 'opportunity_won'
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_to: string; // 'opportunity', 'task', 'client', 'service'
  related_id: number;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationInput {
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_to: string;
  related_id: number;
}

export class NotificationModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        related_to VARCHAR(20) NOT NULL,
        related_id INTEGER NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Notifications table created or already exists');
    } catch (error) {
      console.error('Error creating notifications table:', error);
      throw error;
    }
  }

  async create(notificationData: NotificationInput): Promise<Notification> {
    const { user_id, type, title, message, related_to, related_id } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_to, related_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const values = [user_id, type, title, message, related_to, related_id];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async createMultiple(notifications: NotificationInput[]): Promise<number> {
    if (notifications.length === 0) {
      return 0;
    }
    
    // Create a parameterized query for multiple insertions
    const valueStrings = [];
    const values = [];
    let valueIndex = 1;
    
    for (const notification of notifications) {
      const { user_id, type, title, message, related_to, related_id } = notification;
      valueStrings.push(`($${valueIndex}, $${valueIndex + 1}, $${valueIndex + 2}, $${valueIndex + 3}, $${valueIndex + 4}, $${valueIndex + 5})`);
      values.push(user_id, type, title, message, related_to, related_id);
      valueIndex += 6;
    }
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_to, related_id)
      VALUES ${valueStrings.join(', ')}
    `;
    
    try {
      const result = await this.pool.query(query, values);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error creating multiple notifications:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      throw error;
    }
  }

  async findByUser(userId: number, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error finding notifications by user:', error);
      throw error;
    }
  }

  async findUnreadByUser(userId: number): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding unread notifications by user:', error);
      throw error;
    }
  }

  async markAsRead(id: number): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<number> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING id';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async deleteOlderThan(days: number): Promise<number> {
    const query = `
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  async getNotificationCount(userId: number): Promise<{ total: number, unread: number }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread
      FROM notifications
      WHERE user_id = $1
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting notification count:', error);
      throw error;
    }
  }

  // Helper method to find users by role for notifications
  async findUsersByRole(role: UserRole): Promise<number[]> {
    const query = 'SELECT id FROM users WHERE role = $1';
    
    try {
      const result = await this.pool.query(query, [role]);
      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw error;
    }
  }

  // Helper method to find BU Head for a specific business unit
  async findBUHeadByBusinessUnit(businessUnit: string): Promise<number | null> {
    try {
      // Find the business unit by name
      const buQuery = `
        SELECT owner_id FROM business_units 
        WHERE name = $1 AND status = 'active'
        LIMIT 1
      `;
      
      const buResult = await this.pool.query(buQuery, [businessUnit]);
      
      // If business unit found and has an owner_id
      if (buResult.rows.length > 0 && buResult.rows[0]?.owner_id) {
        return buResult.rows[0].owner_id;
      }
      
      // Fallback: If no business unit found or no owner_id, try to find a BU_HEAD user
      const userQuery = `
      SELECT id FROM users 
        WHERE role = $1
      LIMIT 1
    `;
      
      const userResult = await this.pool.query(userQuery, [UserRole.BU_HEAD]);
      
      return userResult.rows.length > 0 && userResult.rows[0]?.id ? userResult.rows[0].id : null;
    } catch (error) {
      console.error('Error finding BU Head by business unit:', error);
      return null;
    }
  }
}

export default new NotificationModel();
