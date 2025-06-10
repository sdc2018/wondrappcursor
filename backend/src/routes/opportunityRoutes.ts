import { Router } from 'express';
import opportunityController from '../controllers/opportunityController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Custom middleware to check if user is Admin, BU Head, or Sales
const isAdminOrBUHeadOrSales = (req: any, res: any, next: any): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (
    req.user.role === UserRole.ADMIN || 
    req.user.role === UserRole.BU_HEAD || 
    req.user.role === UserRole.SALES
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin, BU Head, or Sales privileges required' });
  }
};

// Public routes - none

// Protected routes - require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', opportunityController.getAllOpportunities);
router.get('/matrix', opportunityController.getCrossSellMatrix);
router.get('/:id', opportunityController.getOpportunityById);
router.get('/client/:clientId', opportunityController.getOpportunitiesByClient);
router.get('/service/:serviceId', opportunityController.getOpportunitiesByService);
router.get('/user/:userId', opportunityController.getOpportunitiesByUser);

// Routes for Admin, BU Head, and Sales roles
router.post('/', isAdminOrBUHeadOrSales, opportunityController.createOpportunity);
router.put('/:id', isAdminOrBUHeadOrSales, opportunityController.updateOpportunity);

// Routes for Admin only
router.delete('/:id', isAdmin, opportunityController.deleteOpportunity);

export default router;