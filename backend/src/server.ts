import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models for database initialization
import UserModel from './models/User';
import ServiceModel from './models/Service';
import ClientModel from './models/Client';
import OpportunityModel from './models/Opportunity';
import TaskModel from './models/Task';
import NotificationModel from './models/Notification';
import BusinessUnitModel from './models/BusinessUnit';
import IndustryModel from './models/Industry';

// Import workflow service
import workflowService from './services/workflowService';
import businessUnitService from './services/businessUnitService';

// Import routes
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import clientRoutes from './routes/clientRoutes';
import opportunityRoutes from './routes/opportunityRoutes';
import taskRoutes from './routes/taskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import businessUnitRoutes from './routes/businessUnitRoutes';
import industryRoutes from './routes/industryRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// For development, use a more permissive CORS configuration
if (process.env.NODE_ENV === 'production') {
  // Production CORS settings - more restrictive
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://wondrlab.com',
    credentials: true
  }));
} else {
  // Development CORS settings - allow multiple origins
app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // List of allowed origins for development
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      // For debugging
      console.log(`CORS blocked for origin: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
    },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
}

app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/business-units', businessUnitRoutes);
app.use('/api/admin/industries', industryRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Wondrlab Cross-Selling Management System API' });
});

// Add API root route for frontend connection testing
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Wondrlab API is running correctly' });
});

// Initialize database tables
const initDatabase = async () => {
  try {
    await UserModel.createTable();
    await ServiceModel.createTable();
    await ClientModel.createTable();
    await OpportunityModel.createTable();
    await TaskModel.createTable();
    await NotificationModel.createTable();
    await BusinessUnitModel.createTable();
    await IndustryModel.createTable();
    console.log('All database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    process.exit(1);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize database tables on server start
  await initDatabase();
  
  // Initialize default business units
  console.log('Initializing default business units...');
  await businessUnitService.initDefaultBusinessUnits();
  
  // Run workflows immediately on server start
  console.log('Running initial workflows...');
  await workflowService.runWorkflows();
  
  // Schedule workflows to run every hour
  const WORKFLOW_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  setInterval(async () => {
    console.log('Running scheduled workflows...');
    await workflowService.runWorkflows();
  }, WORKFLOW_INTERVAL);
  
  console.log(`Workflows scheduled to run every ${WORKFLOW_INTERVAL / 60000} minutes`);
});

export default app;