# CLAUDE.md - Wondrlab Cross-Selling Management System

## Project Overview

Internal web platform for Wondrlab to centralize client, service, and opportunity data across multiple Business Units (BUs). Enables Sales, BU Heads, Admins, and Senior Management to collaborate on cross-sell opportunities via a matrix view, task management, notifications, and analytics.

**Domain**: B2B cross-selling / CRM-like internal tool
**Status**: v1 (MVP stage)

## Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 19, TypeScript, Material-UI (MUI) 7, Axios |
| Backend   | Node.js, Express 5, TypeScript                   |
| Database  | PostgreSQL (pg driver, pg-pool)                  |
| Auth      | JWT (jsonwebtoken), bcrypt password hashing       |
| Styling   | MUI sx prop + Emotion                            |
| State     | React Context API (AuthContext) + local useState  |
| Routing   | React Router v7                                  |

## Repository Structure

```
wondrappcursor/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts           # PostgreSQL pool + table init
│   │   ├── controllers/              # Request handlers (9 files)
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── clientController.ts
│   │   │   ├── serviceController.ts
│   │   │   ├── opportunityController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── businessUnitController.ts
│   │   │   └── industryController.ts
│   │   ├── models/                   # DB schema + interfaces (8 files)
│   │   │   ├── User.ts
│   │   │   ├── Client.ts
│   │   │   ├── Service.ts
│   │   │   ├── Opportunity.ts
│   │   │   ├── Task.ts
│   │   │   ├── Notification.ts
│   │   │   ├── BusinessUnit.ts
│   │   │   └── Industry.ts
│   │   ├── routes/                   # Express route definitions (9 files)
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # JWT auth + role-based access
│   │   ├── services/
│   │   │   ├── workflowService.ts    # Scheduled workflows
│   │   │   └── businessUnitService.ts
│   │   └── server.ts                 # Entry point, CORS, route mounting
│   ├── scripts/                      # Seed + migration scripts
│   │   ├── seedData.ts
│   │   ├── seedTasks.ts
│   │   ├── initBusinessUnits.ts
│   │   ├── initIndustries.ts
│   │   ├── alterBusinessUnitsTable.ts
│   │   ├── addSoftDeleteFields.ts
│   │   └── checkUsers.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx            # AppBar, Sidebar, Navigation
│   │   │   └── CSVFormatHelper.tsx    # CSV import/export dialog
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # Auth state management
│   │   ├── pages/                    # Page components (14 files)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Opportunities.tsx
│   │   │   ├── Matrix.tsx            # Cross-sell matrix view
│   │   │   ├── Tasks.tsx
│   │   │   ├── Notifications.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Users.tsx             # Admin only
│   │   │   ├── BusinessUnits.tsx     # Admin only
│   │   │   └── Industries.tsx        # Admin only
│   │   ├── services/                 # Axios API clients (10 files)
│   │   │   ├── api.ts                # Axios instance + interceptors
│   │   │   ├── authService.ts
│   │   │   ├── clientService.ts
│   │   │   ├── serviceService.ts
│   │   │   ├── opportunityService.ts
│   │   │   ├── taskService.ts
│   │   │   ├── userService.ts
│   │   │   ├── businessUnitService.ts
│   │   │   ├── industryService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/
│   │   │   └── csvUtils.ts           # CSV parse, validate, export
│   │   ├── App.tsx                   # Root + routing config
│   │   └── index.tsx                 # React entry point
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── README.md
├── UseCases.md
├── Updated REQUIREMENTS.md
├── Wondrlab Cross-Selling Management System Staged PRD.md
├── .gitignore
└── tasks_page.html                   # Standalone HTML (legacy prototype)
```

## Quick Start

### Prerequisites
- Node.js v14+, npm v6+, PostgreSQL v12+

### Backend
```bash
cd backend
npm install
# Configure .env (DATABASE_URL, JWT_SECRET, PORT)
npm run build
npm run seed        # Populate with test data
npm run dev         # Starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start           # Starts on http://localhost:3000
```

### Test Credentials (all passwords: `password123`)
| Role              | Email                              |
|-------------------|------------------------------------|
| Admin             | admin@wondrlab.com                 |
| Sales             | sales1@wondrlab.com - sales5@wondrlab.com |
| BU Head           | buhead_creative@wondrlab.com, buhead_digitalmarketing@wondrlab.com, etc. |
| Senior Management | manager1@wondrlab.com - manager3@wondrlab.com |

## Development Commands

### Backend (`/backend`)
| Command              | Purpose                           |
|----------------------|-----------------------------------|
| `npm run dev`        | Dev server with nodemon + ts-node |
| `npm run build`      | Compile TS to `dist/`             |
| `npm start`          | Run compiled JS from `dist/`      |
| `npm run seed`       | Seed database with sample data    |
| `npm run seed:clear` | Clear and re-seed database        |
| `npm run seed:tasks` | Seed task data only               |

### Frontend (`/frontend`)
| Command          | Purpose                  |
|------------------|--------------------------|
| `npm start`      | Dev server on port 3000  |
| `npm run build`  | Production build         |
| `npm test`       | Run Jest tests           |

## Architecture and Patterns

### Backend (MVC + Service Layer)

```
Request -> Route -> Middleware (auth/role) -> Controller -> Model (SQL) -> Response
                                                 |
                                        WorkflowService (scheduled)
```

- **Models**: Define DB schema via `CREATE TABLE IF NOT EXISTS` in `initializeTable()`. Raw SQL with parameterized queries (`$1, $2`). No ORM.
- **Controllers**: Handle request/response, delegate to models. Try-catch with `console.error`.
- **Routes**: Map HTTP methods to controllers with middleware guards.
- **Services**: `workflowService.ts` runs automated processes every 60 minutes.
- **Middleware**: `authenticateToken` validates JWT; `authorizeRole(roles[])` checks permissions.

### Frontend

```
App.tsx (ThemeProvider + AuthProvider + BrowserRouter)
  -> Layout.tsx (AppBar + Sidebar + role-based nav)
       -> Page components (self-contained with local state)
            -> Service modules (API calls via Axios)
```

- **State**: `AuthContext` for auth; `useState` for component-level state. No Redux.
- **API Layer**: Each entity has a dedicated service module. All use shared Axios instance with auth interceptors.
- **Routing**: React Router v7. `ProtectedRoute` wrapper redirects unauthenticated users.

## Database Schema

### Tables and Key Fields

| Table            | Key Fields                                                              | Soft Delete |
|------------------|-------------------------------------------------------------------------|-------------|
| `users`          | id, username, email, password (hashed), role                            | No          |
| `clients`        | id, name, industry, contact_*, account_owner_id (FK), services_used[]   | Yes         |
| `services`       | id, name, business_unit, pricing_model, applicable_industries[], status | Yes         |
| `opportunities`  | id, name, client_id, service_id, assigned_user_id (FKs), status, priority, estimated_value | Yes |
| `tasks`          | id, name, opportunity_id, assigned_user_id (FKs), due_date, status     | No          |
| `notifications`  | id, user_id (FK), type, title, message, related_to, related_id, is_read | No         |
| `business_units` | id, name, description, status, owner_id (FK)                           | No          |
| `industries`     | id, name, description, status                                          | No          |

### Enum Values

- **User roles**: `admin`, `sales`, `bu_head`, `senior_management`
- **Client status**: `active`, `inactive`, `prospect`
- **Service status**: `active`, `inactive`, `deprecated`
- **Service pricing_model**: `Fixed Price`, `Hourly Rate`, `Retainer`, `Performance-Based`
- **Service business_unit**: `Creative`, `Digital Marketing`, `Content Production`, `Media Planning`, `Strategy`
- **Opportunity status**: `new`, `in_progress`, `qualified`, `proposal`, `negotiation`, `won`, `lost`, `on_hold`
- **Opportunity priority**: `low`, `medium`, `high`, `critical`
- **Task status**: `pending`, `in_progress`, `completed`
- **Notification types**: `new_opportunity`, `opportunity_status_change`, `task_assigned`, `task_overdue`, `task_overdue_escalation`, `new_client`, `opportunity_won`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Public
- `POST /login` - Public
- `GET /me` - Protected
- `POST /change-password` - Protected
- `PUT /profile` - Protected

### Users (`/api/users`) - Admin only
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

### Clients (`/api/clients`)
- `GET /` - Filters: status, industry, accountOwnerId
- `GET /:id`, `GET /industry/:industry`, `GET /account-owner/:id`, `GET /:id/services`
- `POST /`, `PUT /:id` - Admin, Sales
- `DELETE /:id` - Admin only (soft delete)
- `PATCH /:id/status` - Admin, Sales
- `POST /:clientId/services/:serviceId`, `DELETE /:clientId/services/:serviceId` - Admin, Sales

### Services (`/api/services`)
- `GET /`, `GET /:id`, `GET /business-unit/:businessUnit`, `GET /industry/:industry`
- `POST /`, `PUT /:id` - Admin, BU Head
- `DELETE /:id` - Admin only (soft delete)
- `PATCH /:id/status` - Admin, BU Head

### Opportunities (`/api/opportunities`)
- `GET /`, `GET /matrix`, `GET /:id`
- `GET /client/:clientId`, `GET /service/:serviceId`, `GET /user/:userId`
- `POST /`, `PUT /:id` - Admin, BU Head, Sales
- `DELETE /:id` - Admin only (soft delete)

### Tasks (`/api/tasks`)
- `GET /`, `GET /my-tasks`, `GET /:id`, `GET /assigned-user/:userId`
- `GET /stats`, `GET /overdue` - Admin, BU Head only
- `POST /` - Admin, BU Head, Sales
- `PUT /:id`, `PATCH /:id/status` - Authenticated
- `DELETE /:id` - Admin, BU Head

### Notifications (`/api/notifications`)
- `GET /`, `GET /unread`, `GET /count`
- `PATCH /:id/read`, `PATCH /read-all`
- `DELETE /:id`, `DELETE /cleanup` (Admin)

### Admin Resources
- `/api/admin/business-units` - CRUD (write: Admin only; read: all authenticated)
- `/api/admin/industries` - CRUD (write: Admin only; read: all authenticated)

## User Roles and Permissions

| Action                        | Admin | Sales | BU Head | Sr. Mgmt |
|-------------------------------|-------|-------|---------|----------|
| Manage users                  | Yes   | No    | No      | No       |
| Create/edit clients           | Yes   | Yes   | No      | No       |
| Delete clients                | Yes   | No    | No      | No       |
| Create/edit services          | Yes   | No    | Yes     | No       |
| Delete services               | Yes   | No    | No      | No       |
| Create/edit opportunities     | Yes   | Yes   | Yes     | No       |
| Delete opportunities          | Yes   | No    | No      | No       |
| Create/edit tasks             | Yes   | Yes   | Yes     | No       |
| Delete tasks                  | Yes   | No    | Yes     | No       |
| View all data                 | Yes   | Yes   | Yes     | Yes      |
| Manage BUs and industries     | Yes   | No    | No      | No       |

## Coding Conventions

### General
- TypeScript strict mode in both frontend and backend
- async/await throughout; no raw Promises
- Try-catch in controllers/services with `console.error` logging
- No ORM: raw parameterized SQL queries (`$1, $2, ...`) in model files

### Naming
- **Files**: PascalCase for components/pages (`Dashboard.tsx`), camelCase for services (`clientService.ts`)
- **Interfaces**: PascalCase (`Client`, `ServiceInput`, `TaskWithDetails`)
- **Functions/variables**: camelCase
- **DB columns**: snake_case (`account_owner_id`, `created_at`)
- **Enum values**: UPPER_SNAKE_CASE in backend constants

### Backend Response Format
- Success: `{ success: true, data: ..., count: ... }`
- Error: `{ message: "...", success: false }`
- Status codes: 200, 201, 400, 401, 403, 404, 409, 500
- Password hashing: bcrypt with 10 salt rounds
- JWT expiry: 24 hours
- Soft deletes via `is_deleted` boolean (clients, services, opportunities)

### Frontend Patterns
- Functional components with hooks (`useState`, `useEffect`)
- `useAuth()` custom hook for auth state
- MUI `sx` prop for styling (no CSS modules, no Tailwind)
- Each page handles CRUD with MUI Dialog components
- API responses accessed via `response.data.data` (nested)
- CSV import/export via `csvUtils.ts`

## Environment Variables

### Backend (`.env`)
| Variable       | Default                | Description              |
|----------------|------------------------|--------------------------|
| `DATABASE_URL` | (required)             | PostgreSQL connection    |
| `JWT_SECRET`   | fallback in code       | JWT signing secret       |
| `PORT`         | `5000`                 | Server port              |
| `NODE_ENV`     | `development`          | Environment mode         |
| `CORS_ORIGIN`  | `https://wondrlab.com` | Production CORS origin   |

### Frontend
- API base URL is set in `frontend/src/services/api.ts`

## Automated Workflows

The `WorkflowService` runs on server startup and every 60 minutes:

1. **Overdue Task Reminders**: Finds tasks past `due_date`, sends `task_overdue` notification. If 24+ hours overdue, escalates to BU Head.
2. **Won Opportunity Processing**: When opportunity status is `won`, adds service to client's `services_used` array and notifies account owner and BU Head.

## Key Business Logic

- **Cross-Sell Matrix**: `/api/opportunities/matrix` returns data for clients-vs-services grid. `Matrix.tsx` renders interactive table; blank cells create new opportunities.
- **Opportunity lifecycle**: Created -> status updates -> Won (auto-updates client services) or Lost (historical).
- **Notification system**: In-app only (no email in v1). Created by controllers and workflow service.
- **CSV import/export**: Available for clients, services, opportunities, tasks. Uses semicolons for array fields.

## Known Issues and Technical Debt

1. **Port mismatch**: Frontend `api.ts` may point to a different port than the backend default (5000). Verify `.env`.
2. **Duplicate task files**: `Tasks.fixed.tsx` and `TasksTemp.tsx` exist but are unused -- candidates for removal.
3. **No automated tests**: Backend has no tests. Frontend has only boilerplate `App.test.tsx`.
4. **Inconsistent soft deletes**: Only clients, services, and opportunities use soft delete. Other entities use hard delete.
5. **`tasks_page.html`**: Standalone HTML file in root -- legacy prototype, not part of React app.

## Guidelines for AI Assistants

1. **Read before modifying**: Always read existing files before making changes.
2. **Follow existing patterns**: New entities must mirror the controller/model/route/service structure.
3. **SQL over ORM**: Use raw SQL. Do not introduce an ORM.
4. **Parameterized queries only**: Always use `$1, $2` placeholders. Never interpolate user input into SQL.
5. **Soft delete where established**: Clients, services, and opportunities use `is_deleted`. Follow this for related entities.
6. **MUI for UI**: Use Material-UI components and `sx` prop. Do not introduce Tailwind or other CSS frameworks.
7. **Auth context**: Use `useAuth()` hook. Do not access localStorage directly in components.
8. **Service module per entity**: Maintain the 1:1 mapping between backend entities and frontend service modules.
9. **Response format**: Backend returns `{ success: true, data: ... }`. Frontend services expect `response.data.data`.
10. **TypeScript strict**: All new code must be typed. No `any` unless absolutely necessary.
