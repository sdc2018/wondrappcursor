# Wondrlab Cross-Selling Management System – Staged Development PRD

## Table of Contents
1. Introduction
2. Development Stages
3. Technical Requirements
4. User Roles and Permissions
5. Constraints and Assumptions
6. Risks and Mitigations

## 1. Introduction

### Context
Wondrlab is a multi-disciplinary organization with multiple Business Units (BUs) offering distinct services to overlapping clients. The Cross-Selling Management System is a web-based platform to centralize client, service, and opportunity data, enabling Sales, BU Heads, Admins, and Senior Management to collaborate on cross-sell opportunities. The system includes a matrix view, task management, notifications, and analytics to enhance BU synergy and revenue.

### Purpose
This staged Product Requirement Document (PRD) organizes the development of the Wondrlab Cross-Selling Management System into modular phases. Each stage delivers specific functionality, ensuring AI code generation tools (e.g., Cursor, Replit) can process requirements incrementally, minimizing loops and resource overuse.

## 2. Development Stages

The development is divided into five stages, each focusing on a core module or feature set. Stages are designed to be independent where possible, allowing AI tools to generate code for one stage at a time.

### Stage 1: User Authentication and Role Management
**Objective**: Implement user authentication and role-based access control to support different user types (Admin, Sales, BU Head, Senior Management).

**Features**:
- **User Authentication**:
  - Signup and login with email/password.
  - Session management using local storage or JWT.
  - Logout functionality.
- **User Roles and Permissions**:
  - System Administrator: Full CRUD access to all data, manages user accounts.
  - Sales/Account Executive: CRUD on clients they manage, create/edit opportunities.
  - BU Head: Manage BU services, view/edit opportunities for their BU.
  - Senior Management: Read-only access to all data.
  - Initial approach: Open visibility (all users see all data).
- **Admin Panel**:
  - Create, edit, delete user accounts.
  - Assign roles to users.

**Deliverables**:
- Login and signup pages.
- Admin panel for user management.
- Backend API endpoints for authentication and user management.
- Role-based access control logic.

**User Stories**:
- As an Admin, I want to create user accounts and assign roles so that team members can access the system.
- As a user, I want to log in securely to access my dashboard based on my role.
- As a Sales user, I want to see all client data so that I can identify cross-sell opportunities.

**Success Metrics**:
- 100% of users can log in and access role-specific dashboards.
- Admin can create/edit/delete at least 10 user accounts without errors.

---

### Stage 2: Client Management Module
**Objective**: Build a centralized database for client data, allowing users to add, edit, and view client information.

**Features**:
- **Client Records**:
  - Fields: Name (unique), Industry, Contact Info (address, phone, website), Account Owner (user reference), Notes, Timestamps.
  - Multiple contacts per client (name, job title, email, phone).
- **Client CRUD Operations**:
  - Add/Edit Client: Sales or Admin can create/edit clients, with duplicate checks.
  - Delete Client: Admin-only, with confirmation prompt.
- **Client List View**:
  - Tabular display with columns: Name, Industry, Account Owner, Number of Open Opportunities.
  - Filterable by Industry or Account Owner.
- **Import/Export**:
  - CSV import/export for client data (format: Name, Industry, Address, Phone, Website, Account Owner Email).
- **Notifications**:
  - Notify Admin and relevant BU Heads when a new client is added.

**Deliverables**:
- Client list and detail pages.
- Forms for adding/editing clients and contacts.
- CSV import/export functionality.
- Backend API endpoints for client CRUD operations.
- Notification system for new clients.

**User Stories**:
- As a Sales user, I want to add a new client so that I can track their services.
- As an Admin, I want to import a client list from CSV to bulk-load data.
- As a BU Head, I want to be notified of new clients to explore cross-sell opportunities.

**Success Metrics**:
- 100% of client records can be created, edited, and deleted without errors.
- CSV import processes at least 100 records accurately.
- Notifications sent to at least 2 BU Heads per new client.

---

### Stage 3: Service Management Module
**Objective**: Enable BU Heads to manage a catalog of services offered by their Business Units.

**Features**:
- **Service Records**:
  - Fields: Name (unique per BU), Description, Pricing Info, BU Reference, Applicable Industries (multi-select), Ideal Client Role (e.g., CMO), Status (Active/Inactive).
- **Service CRUD Operations**:
  - Add/Edit Service: BU Head or Admin, with duplicate warnings.
  - Delete Service: Admin-only, with checks for active opportunities.
- **Service List View**:
  - Tabular display with columns: Name, BU, Status, Industries.
  - Filterable by BU or Industry.
- **Import/Export**:
  - CSV import/export for services (format: Name, Description, Pricing, BU, Industries, Ideal Role, Status).
- **Inactive Services**:
  - Hidden from new opportunity creation but retained in historical data.

**Deliverables**:
- Service list and detail pages.
- Forms for adding/editing services.
- CSV import/export functionality.
- Backend API endpoints for service CRUD operations.

**User Stories**:
- As a BU Head, I want to add a new service to my BU’s catalog so that it can be offered to clients.
- As an Admin, I want to export the service catalog to review offerings offline.
- As a Sales user, I want to filter services by industry to identify relevant cross-sell opportunities.

**Success Metrics**:
- 100% of service records can be created, edited, and deleted without errors.
- CSV export includes all service fields accurately.
- Inactive services are excluded from new opportunity forms.

---

### Stage 4: Cross-Sell Opportunity Matrix and Opportunity Management
**Objective**: Implement the core cross-sell matrix view and opportunity management to track and pursue cross-sell opportunities.

**Features**:
- **Cross-Sell Matrix View**:
  - Layout: Clients (rows) vs. Services (columns, grouped by BU).
  - Cell States:
    - Checkmark for active services.
    - Status (e.g., “In Discussion”) for open opportunities.
    - Blank for potential opportunities.
  - Interactions:
    - Click blank cell to create a new opportunity (modal with pre-filled Client and Service).
    - Click status cell to view/edit opportunity details.
  - Filters: By BU, Industry, Status, Assigned User.
  - Frozen headers for Client names and Service names.
- **Opportunity Records**:
  - Fields: Name (unique), Client Name, Service, Assigned User, Status (Identified, In Discussion, Proposal Sent, On Hold, Won, Lost), Due Date, Priority (High/Med/Low), Notes.
- **Opportunity CRUD Operations**:
  - Add/Edit Opportunity: Sales, BU Head, or Admin.
  - Delete Opportunity: Admin-only, with confirmation.
- **Opportunity List View**:
  - Tabular display with columns: Name, Client, Service, Status, Assigned User, Due Date.
  - Filterable by Status or Assigned User.
- **Import/Export**:
  - CSV import/export for opportunities (format: Name, Client Name, Service Name, Assigned User Email, Status, Due Date, Priority, Notes).
- **Opportunity Lifecycle**:
  - On “Won,” update Client record to reflect the new service.
  - On “Lost,” retain opportunity for historical data.

**Deliverables**:
- Matrix view page with interactive cells.
- Opportunity list and detail pages.
- Forms for creating/editing opportunities.
- CSV import/export functionality.
- Backend API endpoints for opportunity CRUD operations and matrix data.

**User Stories**:
- As a Sales user, I want to view the matrix to identify cross-sell opportunities for my clients.
- As a BU Head, I want to create an opportunity from the matrix to assign it to a Sales user.
- As an Admin, I want to import opportunities from CSV to initialize the system.

**Success Metrics**:
- Matrix view loads with 100 clients and 50 services without performance issues.
- 100% of opportunities can be created, edited, and marked as Won/Lost.
- CSV import processes at least 50 opportunities accurately.

---

### Stage 5: Workflows, Task Management, and Notifications
**Objective**: Add task management and notification workflows to support opportunity tracking and collaboration.

**Features**:
- **Task Management**:
  - Tasks per Opportunity: Fields include Task Name, Assigned User, Due Date, Status (Pending, In Progress, Completed).
  - CRUD operations for tasks (Sales, BU Head, Admin).
  - “My Tasks” view: Lists all tasks assigned to a user, with overdue highlighting.
- **Notifications**:
  - New Opportunity: Notify Assigned User and BU Head of the service’s BU.
  - Opportunity Status Change: Notify Assigned User and Client Account Owner.
  - Task Overdue: Notify Task Owner; escalate to BU Head after 24 hours.
  - Delivery: In-app notifications - In app notifications (toast messages or a notification center)
- **Workflows**:
  - Task reminders for overdue tasks.
  - Automatic Client service update on opportunity “Won” status.

**Deliverables**:
- Task list and detail views.
- Notification center for in-app alerts.
- Backend API endpoints for task CRUD and notifications.
- Workflow logic for status updates and reminders.

**User Stories**:
- As a Sales user, I want to assign a task to follow up on an opportunity so that I don’t miss deadlines.
- As a BU Head, I want to be notified when an opportunity is assigned to my BU.
- As an Admin, I want overdue tasks to escalate to BU Heads for follow-up.

**Success Metrics**:
- 100% of tasks can be created, edited, and completed.
- Notifications sent for 100% of new opportunities and overdue tasks.
- “My Tasks” view displays all user tasks accurately.

---

## 3. Technical Requirements

- **Frontend**: React with Tailwind CSS for styling, hosted via CDN (e.g., cdn.jsdelivr.net).
- **Backend**: Node.js with Express for API endpoints.
- **Database**: PostgreSQL with indexing for performance.
- **API Design**: RESTful endpoints for CRUD operations (e.g., `/clients`, `/services`, `/opportunities`, `/tasks`).
- **Authentication**: JWT-based authentication with role-based access control.
- **Responsiveness**: Responsive design for desktop and tablets (mobile support is future enhancement).
- **Browser Compatibility**: Chrome, Firefox, Safari.
- **Import/Export**: CSV format for clients, services, and opportunities.
- **Notifications**: In-app notifications (no email in v1).
- **Deployment**: Single-page HTML application for simplicity, deployable on any web server.

**Example API Endpoints**:
- `POST /auth/login`: Authenticate user.
- `GET /clients`: List all clients.
- `POST /services`: Create a new service.
- `PUT /opportunities/:id`: Update opportunity status.
- `GET /tasks/me`: List user’s tasks.

---

## 4. User Roles and Permissions

| **Role**              | **Permissions**                                                                 |
|-----------------------|---------------------------------------------------------------------------------|
| System Administrator  | Full CRUD on all data, manage users, override data.                              |
| Sales/Account Executive | CRUD on their clients and opportunities, view all data.                         |
| BU Head              | Manage BU services, CRUD on BU opportunities, view all data.                     |
| Senior Management    | Read-only access to clients, services, opportunities, and analytics.             |

**Note**: Initial implementation uses open visibility (all users see all data). Fine-grained access control is a future enhancement.

---

## 5. Constraints and Assumptions

**Constraints**:
- Prioritize simplicity to align with AI tool capabilities.
- No external CRM integration in v1 (only store CRM URL).
- No native mobile app or deep mobile responsiveness in v1.
- No complex financial tracking or multi-currency support.

**Assumptions**:
- Users have modern web browsers (Chrome, Firefox, Safari).
- AI tools can handle modular React and Node.js code.
- Initial dataset size: ~100 clients, ~50 services, ~200 opportunities.

---

## 6. Risks and Mitigations

| **Risk**                                      | **Mitigation**                                                                 |
|-----------------------------------------------|------------------------------------------------------------------------------|
| AI tools generate inefficient code or loops    | Use modular, clear requirements; test each stage before proceeding.           |
| Large matrix view causes performance issues    | Implement pagination or partial loading; optimize database queries.           |
| Data inconsistencies (e.g., duplicate clients) | Add duplicate checks and validation in forms.                                |
| Notifications fail to deliver                  | Test in-app notifications across browsers; add fallback alerts.               |

---

## 7. Future Enhancements (Out of Scope for v1)
- Fine-grained access control (e.g., BU-specific data visibility).
- CRM integration (Salesforce, HubSpot).
- Mobile app or enhanced mobile responsiveness.
- AI-based cross-sell recommendations.
- Opportunity value tracking (revenue, ROI).
- Calendar/email integration.
- File attachments for opportunities.