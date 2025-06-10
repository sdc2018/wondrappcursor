"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Load environment variables
dotenv_1.default.config({ path: './.env' });
// Database connection
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// Enums from our models
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SALES"] = "sales";
    UserRole["BU_HEAD"] = "bu_head";
    UserRole["SENIOR_MANAGEMENT"] = "senior_management";
})(UserRole || (UserRole = {}));
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["ACTIVE"] = "active";
    ServiceStatus["INACTIVE"] = "inactive";
    ServiceStatus["DEPRECATED"] = "deprecated";
})(ServiceStatus || (ServiceStatus = {}));
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["ACTIVE"] = "active";
    ClientStatus["INACTIVE"] = "inactive";
    ClientStatus["PROSPECT"] = "prospect";
})(ClientStatus || (ClientStatus = {}));
var OpportunityStatus;
(function (OpportunityStatus) {
    OpportunityStatus["NEW"] = "new";
    OpportunityStatus["IN_PROGRESS"] = "in_progress";
    OpportunityStatus["QUALIFIED"] = "qualified";
    OpportunityStatus["PROPOSAL"] = "proposal";
    OpportunityStatus["NEGOTIATION"] = "negotiation";
    OpportunityStatus["WON"] = "won";
    OpportunityStatus["LOST"] = "lost";
    OpportunityStatus["ON_HOLD"] = "on_hold";
})(OpportunityStatus || (OpportunityStatus = {}));
var OpportunityPriority;
(function (OpportunityPriority) {
    OpportunityPriority["LOW"] = "low";
    OpportunityPriority["MEDIUM"] = "medium";
    OpportunityPriority["HIGH"] = "high";
    OpportunityPriority["CRITICAL"] = "critical";
})(OpportunityPriority || (OpportunityPriority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
})(TaskStatus || (TaskStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["NEW_OPPORTUNITY"] = "new_opportunity";
    NotificationType["OPPORTUNITY_STATUS_CHANGE"] = "opportunity_status_change";
    NotificationType["TASK_ASSIGNED"] = "task_assigned";
    NotificationType["TASK_OVERDUE"] = "task_overdue";
    NotificationType["TASK_OVERDUE_ESCALATION"] = "task_overdue_escalation";
    NotificationType["NEW_CLIENT"] = "new_client";
    NotificationType["OPPORTUNITY_WON"] = "opportunity_won";
})(NotificationType || (NotificationType = {}));
// Sample data
const businessUnits = [
    'Creative',
    'Digital Marketing',
    'Content Production',
    'Media Planning',
    'Strategy'
];
const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Retail',
    'Manufacturing',
    'Education',
    'Entertainment',
    'Food & Beverage'
];
const clientRoles = [
    'Decision Maker',
    'Influencer',
    'Gatekeeper',
    'User',
    'Economic Buyer'
];
const pricingModels = [
    'Fixed Price',
    'Hourly Rate',
    'Retainer',
    'Performance-Based',
    'Value-Based'
];
// Helper function to generate random date within a range
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
// Helper function to get random item from array
const randomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};
// Helper function to get random items from array
const randomItems = (array, min = 1, max = 3) => {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
// Helper function to generate random number within a range
const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// Clear all tables
const clearTables = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query('TRUNCATE notifications, tasks, opportunities, clients, services, users CASCADE');
        console.log('All tables cleared');
    }
    catch (error) {
        console.error('Error clearing tables:', error);
        throw error;
    }
});
// Create sample users
const createUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saltRounds = 10;
        const password = yield bcrypt_1.default.hash('password123', saltRounds);
        // Admin user
        yield pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin', 'admin@wondrlab.com', password, UserRole.ADMIN]);
        // Sales users
        for (let i = 1; i <= 5; i++) {
            yield pool.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, [
                `sales${i}`,
                `sales${i}@wondrlab.com`,
                password,
                UserRole.SALES
            ]);
        }
        // BU Head users (one for each business unit)
        for (let i = 0; i < businessUnits.length; i++) {
            const buName = businessUnits[i].toLowerCase().replace(/\s+/g, '');
            yield pool.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, [
                `buhead_${buName}`,
                `buhead_${buName}@wondrlab.com`,
                password,
                UserRole.BU_HEAD
            ]);
        }
        // Senior Management users
        for (let i = 1; i <= 3; i++) {
            yield pool.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, [
                `manager${i}`,
                `manager${i}@wondrlab.com`,
                password,
                UserRole.SENIOR_MANAGEMENT
            ]);
        }
        console.log('Sample users created');
    }
    catch (error) {
        console.error('Error creating users:', error);
        throw error;
    }
});
// Create sample services
const createServices = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create 3-5 services for each business unit
        for (const bu of businessUnits) {
            const servicesCount = randomNumber(3, 5);
            for (let i = 1; i <= servicesCount; i++) {
                const serviceName = `${bu} Service ${i}`;
                const description = `Comprehensive ${bu.toLowerCase()} service offering for enterprise clients.`;
                const pricingModel = randomItem(pricingModels);
                const pricingDetails = pricingModel === 'Fixed Price' ?
                    `$${randomNumber(5000, 50000)}` :
                    pricingModel === 'Hourly Rate' ?
                        `$${randomNumber(100, 300)}/hour` :
                        `$${randomNumber(2000, 10000)}/month`;
                const applicableIndustries = randomItems(industries, 2, 5);
                const clientRole = randomItem(clientRoles);
                const status = Math.random() > 0.2 ? ServiceStatus.ACTIVE : ServiceStatus.INACTIVE;
                yield pool.query(`
          INSERT INTO services (
            name, description, pricing_model, pricing_details, 
            business_unit, applicable_industries, client_role, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
                    serviceName,
                    description,
                    pricingModel,
                    pricingDetails,
                    bu,
                    applicableIndustries,
                    clientRole,
                    status
                ]);
            }
        }
        console.log('Sample services created');
    }
    catch (error) {
        console.error('Error creating services:', error);
        throw error;
    }
});
// Create sample clients
const createClients = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get Sales user IDs for account owners
        const salesResult = yield pool.query(`
      SELECT id FROM users WHERE role = $1
    `, [UserRole.SALES]);
        const salesUserIds = salesResult.rows.map(row => row.id);
        // Get service IDs
        const serviceResult = yield pool.query(`
      SELECT id FROM services WHERE status = $1
    `, [ServiceStatus.ACTIVE]);
        const serviceIds = serviceResult.rows.map(row => row.id);
        // Create 15-20 clients
        const clientsCount = randomNumber(15, 20);
        for (let i = 1; i <= clientsCount; i++) {
            const name = `Client ${i}`;
            const industry = randomItem(industries);
            const contactName = `Contact Person ${i}`;
            const contactEmail = `contact${i}@client${i}.com`;
            const contactPhone = `+1${randomNumber(1000000000, 9999999999)}`;
            const accountOwnerId = randomItem(salesUserIds);
            // Assign 0-3 random services to each client
            const clientServices = Math.random() > 0.2 ?
                randomItems(serviceIds, 0, 3) :
                [];
            const crmLink = `https://crm.wondrlab.com/clients/${i}`;
            const notes = `Notes for ${name}. Key contact: ${contactName}.`;
            const status = Math.random() > 0.7 ?
                ClientStatus.ACTIVE :
                Math.random() > 0.5 ?
                    ClientStatus.INACTIVE :
                    ClientStatus.PROSPECT;
            // Generate a random address
            const address = `${randomNumber(100, 9999)} ${randomItem(['Main St', 'Broadway', 'Park Ave', 'Market St', 'Oak Rd'])} ${randomItem(['Suite', 'Floor', 'Unit'])} ${randomNumber(100, 999)}, ${randomItem(['New York', 'San Francisco', 'Chicago', 'Los Angeles', 'Miami', 'Seattle', 'Boston', 'Austin'])}`;
            yield pool.query(`
        INSERT INTO clients (
          name, industry, contact_name, contact_email, contact_phone, address,
          account_owner_id, services_used, crm_link, notes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
                name,
                industry,
                contactName,
                contactEmail,
                contactPhone,
                address,
                accountOwnerId,
                clientServices,
                crmLink,
                notes,
                status
            ]);
        }
        console.log('Sample clients created');
    }
    catch (error) {
        console.error('Error creating clients:', error);
        throw error;
    }
});
// Create sample opportunities
const createOpportunities = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get active clients
        const clientResult = yield pool.query(`
      SELECT id FROM clients WHERE status = $1
    `, [ClientStatus.ACTIVE]);
        const clientIds = clientResult.rows.map(row => row.id);
        // Get active services
        const serviceResult = yield pool.query(`
      SELECT id FROM services WHERE status = $1
    `, [ServiceStatus.ACTIVE]);
        const serviceIds = serviceResult.rows.map(row => row.id);
        // Get sales and BU head users for assignment
        const userResult = yield pool.query(`
      SELECT id FROM users WHERE role = $1 OR role = $2
    `, [UserRole.SALES, UserRole.BU_HEAD]);
        const userIds = userResult.rows.map(row => row.id);
        // Create 25-30 opportunities
        const opportunitiesCount = randomNumber(25, 30);
        for (let i = 1; i <= opportunitiesCount; i++) {
            const name = `Opportunity ${i}`;
            const clientId = randomItem(clientIds);
            const serviceId = randomItem(serviceIds);
            const assignedUserId = randomItem(userIds);
            // Distribute statuses realistically
            let status;
            const rand = Math.random();
            if (rand < 0.2)
                status = OpportunityStatus.NEW;
            else if (rand < 0.4)
                status = OpportunityStatus.IN_PROGRESS;
            else if (rand < 0.5)
                status = OpportunityStatus.QUALIFIED;
            else if (rand < 0.6)
                status = OpportunityStatus.PROPOSAL;
            else if (rand < 0.7)
                status = OpportunityStatus.NEGOTIATION;
            else if (rand < 0.8)
                status = OpportunityStatus.WON;
            else if (rand < 0.9)
                status = OpportunityStatus.LOST;
            else
                status = OpportunityStatus.ON_HOLD;
            const priority = randomItem([
                OpportunityPriority.LOW,
                OpportunityPriority.MEDIUM,
                OpportunityPriority.HIGH,
                OpportunityPriority.CRITICAL
            ]);
            const estimatedValue = randomNumber(5000, 100000);
            // Due date between now and 3 months from now
            const now = new Date();
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(now.getMonth() + 3);
            const dueDate = randomDate(now, threeMonthsLater);
            const notes = `Notes for ${name}. Estimated value: $${estimatedValue}.`;
            yield pool.query(`
        INSERT INTO opportunities (
          name, client_id, service_id, assigned_user_id,
          status, priority, estimated_value, due_date, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
                name,
                clientId,
                serviceId,
                assignedUserId,
                status,
                priority,
                estimatedValue,
                dueDate,
                notes
            ]);
        }
        console.log('Sample opportunities created');
    }
    catch (error) {
        console.error('Error creating opportunities:', error);
        throw error;
    }
});
// Create sample tasks
const createTasks = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get opportunities
        const opportunityResult = yield pool.query(`
      SELECT id, assigned_user_id FROM opportunities
    `);
        const opportunities = opportunityResult.rows;
        // Create 2-4 tasks for each opportunity
        for (const opportunity of opportunities) {
            const tasksCount = randomNumber(2, 4);
            for (let i = 1; i <= tasksCount; i++) {
                const name = `Task ${i} for Opportunity ${opportunity.id}`;
                const opportunityId = opportunity.id;
                // 70% assigned to opportunity owner, 30% to someone else
                let assignedUserId;
                if (Math.random() < 0.7) {
                    assignedUserId = opportunity.assigned_user_id;
                }
                else {
                    // Get a random user
                    const userResult = yield pool.query(`
            SELECT id FROM users WHERE role = $1 OR role = $2 LIMIT 1 OFFSET ${Math.floor(Math.random() * 5)}
          `, [UserRole.SALES, UserRole.BU_HEAD]);
                    assignedUserId = userResult.rows[0].id;
                }
                // Due date between now and 1 month from now
                const now = new Date();
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(now.getMonth() + 1);
                const dueDate = randomDate(now, oneMonthLater);
                // Distribute statuses realistically
                let status;
                const rand = Math.random();
                if (rand < 0.3)
                    status = TaskStatus.PENDING;
                else if (rand < 0.7)
                    status = TaskStatus.IN_PROGRESS;
                else
                    status = TaskStatus.COMPLETED;
                const description = `Description for task ${i} related to opportunity ${opportunityId}.`;
                yield pool.query(`
          INSERT INTO tasks (
            name, opportunity_id, assigned_user_id,
            due_date, status, description
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    name,
                    opportunityId,
                    assignedUserId,
                    dueDate,
                    status,
                    description
                ]);
            }
        }
        console.log('Sample tasks created');
    }
    catch (error) {
        console.error('Error creating tasks:', error);
        throw error;
    }
});
// Create sample notifications
const createNotifications = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get users
        const userResult = yield pool.query(`
      SELECT id FROM users
    `);
        const userIds = userResult.rows.map(row => row.id);
        // Get opportunities
        const opportunityResult = yield pool.query(`
      SELECT id FROM opportunities
    `);
        const opportunityIds = opportunityResult.rows.map(row => row.id);
        // Get tasks
        const taskResult = yield pool.query(`
      SELECT id FROM tasks
    `);
        const taskIds = taskResult.rows.map(row => row.id);
        // Create 30-40 notifications
        const notificationsCount = randomNumber(30, 40);
        for (let i = 1; i <= notificationsCount; i++) {
            const userId = randomItem(userIds);
            // Randomly select notification type
            const type = randomItem([
                NotificationType.NEW_OPPORTUNITY,
                NotificationType.OPPORTUNITY_STATUS_CHANGE,
                NotificationType.TASK_ASSIGNED,
                NotificationType.TASK_OVERDUE,
                NotificationType.TASK_OVERDUE_ESCALATION,
                NotificationType.NEW_CLIENT,
                NotificationType.OPPORTUNITY_WON
            ]);
            let title, message, relatedTo, relatedId;
            switch (type) {
                case NotificationType.NEW_OPPORTUNITY:
                    relatedTo = 'opportunity';
                    relatedId = randomItem(opportunityIds);
                    title = 'New Opportunity';
                    message = `A new opportunity has been created and assigned to you.`;
                    break;
                case NotificationType.OPPORTUNITY_STATUS_CHANGE:
                    relatedTo = 'opportunity';
                    relatedId = randomItem(opportunityIds);
                    title = 'Opportunity Status Changed';
                    message = `The status of an opportunity has been updated.`;
                    break;
                case NotificationType.TASK_ASSIGNED:
                    relatedTo = 'task';
                    relatedId = randomItem(taskIds);
                    title = 'New Task Assigned';
                    message = `A new task has been assigned to you.`;
                    break;
                case NotificationType.TASK_OVERDUE:
                    relatedTo = 'task';
                    relatedId = randomItem(taskIds);
                    title = 'Task Overdue';
                    message = `A task is overdue and requires your attention.`;
                    break;
                case NotificationType.TASK_OVERDUE_ESCALATION:
                    relatedTo = 'task';
                    relatedId = randomItem(taskIds);
                    title = 'Task Overdue Escalation';
                    message = `A task is significantly overdue and has been escalated.`;
                    break;
                case NotificationType.NEW_CLIENT:
                    relatedTo = 'client';
                    relatedId = randomItem(opportunityIds); // Using opportunity IDs as proxy for client IDs
                    title = 'New Client Added';
                    message = `A new client has been added to the system.`;
                    break;
                case NotificationType.OPPORTUNITY_WON:
                    relatedTo = 'opportunity';
                    relatedId = randomItem(opportunityIds);
                    title = 'Opportunity Won';
                    message = `Congratulations! An opportunity has been marked as won.`;
                    break;
            }
            // 70% unread, 30% read
            const isRead = Math.random() > 0.7;
            // Created between 7 days ago and now
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const createdAt = randomDate(sevenDaysAgo, new Date());
            yield pool.query(`
        INSERT INTO notifications (
          user_id, type, title, message, related_to, related_id, is_read, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
                userId,
                type,
                title,
                message,
                relatedTo,
                relatedId,
                isRead,
                createdAt
            ]);
        }
        console.log('Sample notifications created');
    }
    catch (error) {
        console.error('Error creating notifications:', error);
        throw error;
    }
});
// Main function to seed the database
const seedDatabase = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (clearExisting = false) {
    try {
        console.log('Starting database seeding...');
        // Test database connection
        yield pool.query('SELECT NOW()');
        console.log('Database connected');
        if (clearExisting) {
            yield clearTables();
        }
        yield createUsers();
        yield createServices();
        yield createClients();
        yield createOpportunities();
        yield createTasks();
        yield createNotifications();
        console.log('Database seeding completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
    finally {
        yield pool.end();
    }
});
// Check if --clear flag is provided
const clearExisting = process.argv.includes('--clear');
// Run the seeding
seedDatabase(clearExisting);
//# sourceMappingURL=seedData.js.map