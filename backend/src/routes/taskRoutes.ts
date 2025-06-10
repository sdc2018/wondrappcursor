import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import TaskController from '../controllers/taskController';

const router = Router();

// Custom middleware to check if user is Admin, BU Head, or Sales
const isAdminOrBUHeadOrSales = (req: any, res: any, next: any): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === 'admin' || req.user.role === 'bu_head' || req.user.role === 'sales') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin, BU Head, or Sales privileges required' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all tasks with optional filters
router.get('/', TaskController.getAllTasks);

// Get task statistics (Admin or BU Head only)
router.get('/stats', (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === 'admin' || req.user.role === 'bu_head') {
    next();
    return;
  }
  
  res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required' });
  return;
}, TaskController.getTaskStats);

// Get overdue tasks (Admin or BU Head only)
router.get('/overdue', (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === 'admin' || req.user.role === 'bu_head') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required' });
  }
}, TaskController.getOverdueTasks);

// Get tasks for current user
router.get('/my-tasks', TaskController.getMyTasks);

// Get tasks by assigned user ID (for "My Tasks" filter)
router.get('/assigned-user/:userId', TaskController.getTasksByAssignedUser);

// Get task by ID
router.get('/:id', TaskController.getTaskById);

// Create a new task (Admin, BU Head, or Sales only)
router.post('/', isAdminOrBUHeadOrSales, TaskController.createTask);

// Update task
router.put('/:id', TaskController.updateTask);

// Update task status
router.patch('/:id/status', TaskController.updateTaskStatus);

// Delete task (Admin or BU Head only)
router.delete('/:id', (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === 'admin' || req.user.role === 'bu_head') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required' });
  }
}, TaskController.deleteTask);

export default router;
