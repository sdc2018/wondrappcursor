import api from './api';
import { AxiosResponse } from 'axios';

// Define types
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_to: string;
  related_id: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

const notificationService = {
  /**
   * Get all notifications for a user with pagination
   */
  getUserNotifications: async (limit: number = 20, offset: number = 0): Promise<Notification[]> => {
    try {
      const response: AxiosResponse<Notification[]> = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications: async (): Promise<Notification[]> => {
    try {
      const response: AxiosResponse<Notification[]> = await api.get('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification counts (total and unread)
   */
  getNotificationCount: async (): Promise<NotificationCount> => {
    try {
      const response: AxiosResponse<NotificationCount> = await api.get('/notifications/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: number): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete all notifications for a user
   */
  deleteAllNotifications: async (): Promise<void> => {
    try {
      await api.delete('/notifications');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },

  /**
   * Clean up old notifications (admin only)
   */
  cleanupOldNotifications: async (days: number): Promise<void> => {
    try {
      await api.delete(`/notifications/cleanup?days=${days}`);
    } catch (error) {
      console.error(`Error cleaning up notifications older than ${days} days:`, error);
      throw error;
    }
  }
};

export default notificationService;
