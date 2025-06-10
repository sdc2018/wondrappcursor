import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key';

// Interface for decoded token
interface DecodedToken {
  userId: number;
  role: UserRole;
  iat: number;
  exp: number;
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: UserRole;
      };
    }
  }
}

// Middleware to authenticate JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user has required role
export const authorizeRole = (allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      return;
    }
    
    next();
  };
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
    return;
  }
  
  next();
};

// Middleware to check if user is a BU head
export const isBUHead = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== UserRole.BU_HEAD) {
    res.status(403).json({ message: 'Access denied: BU Head privileges required' });
    return;
  }
  
  next();
};

// Middleware to check if user is in sales
export const isSales = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== UserRole.SALES) {
    res.status(403).json({ message: 'Access denied: Sales privileges required' });
    return;
  }
  
  next();
};

// Middleware to check if user is in senior management
export const isSeniorManagement = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== UserRole.SENIOR_MANAGEMENT) {
    res.status(403).json({ message: 'Access denied: Senior Management privileges required' });
    return;
  }
  
  next();
};
