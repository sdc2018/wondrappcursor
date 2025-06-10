import { Request, Response } from 'express';
import NotificationModel from '../models/Notification';
import { UserRole } from '../models/User';

export class NotificationController {
  // Get notifications for the current user
  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const notifications = await NotificationModel.findByUser(req.user.userId, limit, offset);
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: 'Server error while retrieving notifications' });
    }
  }

  // Get unread notifications for the current user
  async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const notifications = await NotificationModel.findUnreadByUser(req.user.userId);
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      res.status(500).json({ message: 'Server error while retrieving unread notifications' });
    }
  }

  // Get notification count (total and unread)
  async getNotificationCount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const counts = await NotificationModel.getNotificationCount(req.user.userId);
      res.status(200).json(counts);
    } catch (error) {
      console.error('Error getting notification count:', error);
      res.status(500).json({ message: 'Server error while retrieving notification count' });
    }
  }

  // Mark a notification as read
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const notificationId = parseInt(req.params.id);
      
      // Verify notification exists and belongs to the user
      const notification = await NotificationModel.findById(notificationId);
      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      
      if (notification.user_id !== req.user.userId) {
        res.status(403).json({ message: 'Access denied: This notification does not belong to you' });
        return;
      }
      
      const success = await NotificationModel.markAsRead(notificationId);
      
      if (success) {
        res.status(200).json({ message: 'Notification marked as read' });
      } else {
        res.status(500).json({ message: 'Failed to mark notification as read' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Server error while marking notification as read' });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const count = await NotificationModel.markAllAsRead(req.user.userId);
      res.status(200).json({ message: `${count} notifications marked as read` });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Server error while marking all notifications as read' });
    }
  }

  // Delete a notification
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const notificationId = parseInt(req.params.id);
      
      // Verify notification exists and belongs to the user
      const notification = await NotificationModel.findById(notificationId);
      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      
      if (notification.user_id !== req.user.userId) {
        res.status(403).json({ message: 'Access denied: This notification does not belong to you' });
        return;
      }
      
      const success = await NotificationModel.delete(notificationId);
      
      if (success) {
        res.status(200).json({ message: 'Notification deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete notification' });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Server error while deleting notification' });
    }
  }

  // Clean up old notifications (admin only)
  async cleanupOldNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      // Check if user is admin
      if (req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied: Admin privileges required' });
        return;
      }
      
      const days = req.body.days || 30; // Default to 30 days
      
      const count = await NotificationModel.deleteOlderThan(days);
      res.status(200).json({ message: `${count} old notifications deleted` });
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      res.status(500).json({ message: 'Server error while cleaning up old notifications' });
    }
  }
}

export default new NotificationController();
