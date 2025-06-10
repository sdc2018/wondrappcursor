import express, { Request, Response, NextFunction } from 'express';
import clientController from '../controllers/clientController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Apply authentication middleware to all client routes
router.use(authenticateToken);

// Custom middleware to check if user is either Admin or Sales
const isAdminOrSales = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SALES) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or Sales privileges required' });
  }
};

// GET all clients
router.get('/', clientController.getAllClients);

// GET client by ID
router.get('/:id', clientController.getClientById);

// GET clients by industry
router.get('/industry/:industry', clientController.getClientsByIndustry);

// GET clients by account owner
router.get('/account-owner/:id', clientController.getClientsByAccountOwner);

// GET services for a client
router.get('/:id/services', clientController.getClientServices);

// POST create new client (Admin and Sales only)
router.post('/', isAdminOrSales, clientController.createClient);

// PUT update client (Admin and Sales only)
router.put('/:id', isAdminOrSales, clientController.updateClient);

// DELETE client (Admin only)
router.delete('/:id', isAdmin, clientController.deleteClient);

// PATCH change client status (Admin and Sales only)
router.patch('/:id/status', isAdminOrSales, clientController.changeClientStatus);

// POST add service to client (Admin and Sales only)
router.post('/:clientId/services/:serviceId', isAdminOrSales, clientController.addServiceToClient);

// DELETE remove service from client (Admin and Sales only)
router.delete('/:clientId/services/:serviceId', isAdminOrSales, clientController.removeServiceFromClient);

export default router;
