import express, { Request, Response, NextFunction } from 'express';
import serviceController from '../controllers/serviceController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Apply authentication middleware to all service routes
router.use(authenticateToken);

// Custom middleware to check if user is either Admin or BU Head
const isAdminOrBUHead = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.BU_HEAD) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required' });
  }
};

// GET all services
router.get('/', serviceController.getAllServices);

// GET service by ID
router.get('/:id', serviceController.getServiceById);

// GET services by business unit
router.get('/business-unit/:businessUnit', serviceController.getServicesByBusinessUnit);

// GET services by industry
router.get('/industry/:industry', serviceController.getServicesByIndustry);

// POST create new service (Admin and BU Head only)
router.post('/', isAdminOrBUHead, serviceController.createService);

// PUT update service (Admin and BU Head only)
router.put('/:id', isAdminOrBUHead, serviceController.updateService);

// DELETE service (Admin only)
router.delete('/:id', isAdmin, serviceController.deleteService);

// PATCH change service status (Admin and BU Head only)
router.patch('/:id/status', isAdminOrBUHead, serviceController.changeServiceStatus);

export default router;