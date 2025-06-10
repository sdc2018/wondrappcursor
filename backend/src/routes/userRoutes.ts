import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

/**
 * User Routes
 * All routes require authentication and admin authorization
 */

// Get all users - Admin only
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get user by ID - Admin only
router.get('/:id', authenticateToken, isAdmin, userController.getUserById);

// Create a new user - Admin only
router.post('/', authenticateToken, isAdmin, userController.createUser);

// Update a user - Admin only
router.put('/:id', authenticateToken, isAdmin, userController.updateUser);

// Delete a user - Admin only
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

export default router;