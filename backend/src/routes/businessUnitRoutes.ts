import express, { Request, Response, NextFunction } from 'express';
import businessUnitController from '../controllers/businessUnitController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Apply authentication middleware to all business unit routes
router.use(authenticateToken);

// Custom middleware to check if user is Admin
// For business units, we'll restrict most operations to Admin users only
const isAdminUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// GET all business units (accessible to all authenticated users)
router.get('/', businessUnitController.getAllBusinessUnits);

// GET business unit by ID (accessible to all authenticated users)
router.get('/:id', businessUnitController.getBusinessUnitById);

// POST create new business unit (Admin only)
router.post('/', isAdmin, businessUnitController.createBusinessUnit);

// PUT update business unit (Admin only)
router.put('/:id', isAdmin, businessUnitController.updateBusinessUnit);

// DELETE business unit (Admin only)
router.delete('/:id', isAdmin, businessUnitController.deleteBusinessUnit);

// PATCH change business unit status (Admin only)
router.patch('/:id/status', isAdmin, businessUnitController.changeBusinessUnitStatus);

export default router;
