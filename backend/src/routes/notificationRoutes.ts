import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import NotificationController from '../controllers/notificationController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get notifications for current user with pagination
router.get('/', NotificationController.getMyNotifications);

// Get unread notifications for current user
router.get('/unread', NotificationController.getUnreadNotifications);

// Get notification count (total and unread)
router.get('/count', NotificationController.getNotificationCount);

// Mark a notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', NotificationController.deleteNotification);

// Clean up old notifications (admin only)
router.delete('/cleanup', isAdmin, NotificationController.cleanupOldNotifications);

export default router;
