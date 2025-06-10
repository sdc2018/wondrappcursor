import { Router } from 'express';
import industryController from '../controllers/industryController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all industry routes
router.use(authenticateToken);

// GET all industries - Accessible to all authenticated users
router.get('/', industryController.getAllIndustries);

// GET industry by ID - Accessible to all authenticated users
router.get('/:id', industryController.getIndustryById);

// POST create new industry - Admin only
router.post('/', isAdmin, industryController.createIndustry);

// PUT update industry - Admin only
router.put('/:id', isAdmin, industryController.updateIndustry);

// DELETE industry - Admin only
router.delete('/:id', isAdmin, industryController.deleteIndustry);

// PATCH change industry status - Admin only
router.patch('/:id/status', isAdmin, industryController.changeIndustryStatus);

export default router;
