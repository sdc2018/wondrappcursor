
A comprehensive web-based platform to centralize client, service, and opportunity data, enabling Sales, BU Heads, Admins, and Senior Management to collaborate on cross-sell opportunities.

## Project Overview

Wondrlab Cross-Selling Management System is designed to help Wondrlab, a multi-disciplinary organization with multiple Business Units (BUs), to better manage and leverage cross-selling opportunities. The system centralizes client, service, and opportunity data, providing a unified platform for all stakeholders to collaborate effectively.

The system includes:
- User authentication and role-based access control
- Client management with service relationship tracking
- Service management organized by business units
- Opportunity tracking and management
- Cross-sell opportunity matrix view
- Task management with assignments and due dates
- In-app notification system
- Automated workflows for task reminders and service updates

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Material-UI (MUI) for UI components
- React Router for navigation
- Context API for state management
- Axios for API communication

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL (v12 or higher)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a PostgreSQL database named "wondrlab_db"

4. Configure environment variables:
   - Review the `.env` file and update as needed
   - Default configuration connects to PostgreSQL at localhost:5432 with username "postgres" and password "password"

5. Build the TypeScript code:
   ```
   npm run build
   ```

6. Seed the database with test data:
   ```
   npm run seed
   ```

7. Start the backend server:
   ```
   npm run dev
   ```

The backend server will run on http://localhost:5000 by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

The frontend application will run on http://localhost:3000 by default.

## Database Seeding

The system includes a database seeding script that populates the database with test data for all entity types:

- Users with different roles (Admin, Sales, BU Head, Senior Management)
- Services across different business units
- Clients with various industries and service relationships
- Opportunities in different stages
- Tasks with assignments and due dates
- Notifications for various system events

To run the seeding script:
```
cd backend
npm run seed
```

To clear the database and reseed:
```
cd backend
npm run seed:clear
```

## Features and Functionality

### User Authentication and Role Management
- User registration and login
- Role-based access control (Admin, Sales, BU Head, Senior Management)
- Protected routes based on user roles

### Client Management
- Create, view, update, and delete clients
- Track client information, industry, and contact details
- Manage client-service relationships
- Filter clients by industry and account owner

### Service Management
- Organize services by business unit
- Track service details, pricing models, and applicable industries
- Filter services by business unit and industry

### Opportunity Management
- Create and track cross-sell opportunities
- Assign opportunities to users
- Track opportunity status, priority, and estimated value
- Filter opportunities by client, service, assigned user, and status

### Cross-Sell Matrix View
- Visual matrix of clients vs. services
- Identify potential cross-sell opportunities
- Color-coded cells for active services, existing opportunities, and potential opportunities
- Quick access to opportunity details and creation

### Task Management
- Create and assign tasks related to opportunities
- Track task status and due dates
- Filter tasks by assignment and overdue status
- Visual indicators for overdue tasks

### Notification System
- In-app notifications for important events
- Notification types for new opportunities, status changes, task assignments, etc.
- Mark notifications as read individually or all at once

### Automated Workflows
- Task reminders for overdue tasks
- Automatic client service updates when opportunities are won
- Scheduled workflow execution

## Usage Instructions

### Login
- Use the following test credentials:
  - Admin: admin@wondrlab.com / password
  - Sales: sarah@wondrlab.com / password
  - BU Head: michael@wondrlab.com / password
  - Senior Management: emily@wondrlab.com / password

### Dashboard
- View key metrics and statistics
- See recent opportunities and overdue tasks
- Quick access to main system functions

### Clients
- View all clients in a table format
- Add new clients with the "Add Client" button
- Edit or delete clients using the action buttons
- Assign services to clients during creation or editing

### Services
- View all services organized by business unit
- Add new services with the "Add Service" button
- Edit or delete services using the action buttons
- Change service status (active, inactive, deprecated)

### Opportunities
- View all opportunities in a table format
- Add new opportunities with the "Add Opportunity" button
- Edit or delete opportunities using the action buttons
- Track opportunity progress through different statuses

### Matrix View
- Explore the cross-sell matrix of clients vs. services
- Click on a cell to view opportunity details or create a new opportunity
- Filter the matrix by business unit or client
- Color coding: green (active service), blue (existing opportunity), gray (potential opportunity)

### Tasks
- View tasks with filtering options (All Tasks, My Tasks, Overdue Tasks)
- Add new tasks with the "Add Task" button
- Edit or delete tasks using the action buttons
- Mark tasks as completed when finished

### Notifications
- View all notifications or filter to unread only
- Mark notifications as read individually or all at once
- Delete notifications individually or all at once

## Project Structure

### Backend
- `src/config`: Configuration files (database, etc.)
- `src/controllers`: Request handlers for each entity
- `src/middleware`: Authentication and authorization middleware
- `src/models`: Database models and interfaces
- `src/routes`: API route definitions
- `src/services`: Business logic services
- `scripts`: Database seeding and utility scripts

### Frontend
- `src/components`: Reusable UI components
- `src/contexts`: React context providers
- `src/pages`: Page components for each route
- `src/services`: API service clients
- `src/types`: TypeScript interfaces and types
- `src/utils`: Utility functions

## License

This project is licensed under the MIT License.
