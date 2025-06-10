import { Pool } from 'pg';
import dotenv from 'dotenv';
import { TaskStatus } from '../src/models/Task';
import { UserRole } from '../src/models/User';

// Load environment variables
dotenv.config();

// Create a new pool for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to get random item from array
const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random number between min and max
const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to get random date between start and end
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Create 10 sample tasks
const createSampleTasks = async () => {
  try {
    console.log('Creating 10 sample tasks...');

    // Get opportunities
    const opportunityResult = await pool.query(`
      SELECT id, assigned_user_id FROM opportunities
      LIMIT 10
    `);
    
    const opportunities = opportunityResult.rows;
    
    if (opportunities.length === 0) {
      console.log('No opportunities found. Please create opportunities first.');
      return;
    }
    
    // Get users with SALES or BU_HEAD roles
    const userResult = await pool.query(`
      SELECT id FROM users 
      WHERE (role = $1 OR role = $2)
    `, [UserRole.SALES, UserRole.BU_HEAD]);
    
    const userIds = userResult.rows.map(row => row.id);
    
    if (userIds.length === 0) {
      console.log('No users found with SALES or BU_HEAD roles. Please create users first.');
      return;
    }

    // Task names and descriptions
    const taskNames = [
      'Client meeting preparation',
      'Create project proposal',
      'Review campaign performance',
      'Prepare presentation slides',
      'Follow up with client',
      'Conduct market research',
      'Design mock-ups',
      'Coordinate with creative team',
      'Finalize contract details',
      'Schedule kickoff meeting'
    ];
    
    const taskDescriptions = [
      'Prepare all necessary materials for the upcoming client meeting.',
      'Draft a comprehensive project proposal including timeline and budget.',
      'Analyze the performance of the current campaign and prepare a report.',
      'Create presentation slides for the executive meeting.',
      'Send follow-up email to client regarding project status.',
      'Research market trends and competitor analysis for the new campaign.',
      'Design initial mock-ups for client review.',
      'Coordinate with the creative team on project requirements.',
      'Review and finalize all contract details before signing.',
      'Schedule and prepare agenda for the project kickoff meeting.'
    ];

    // Create 10 tasks
    for (let i = 0; i < 10; i++) {
      // Select a random opportunity
      const opportunity = randomItem(opportunities);
      
      // 70% assigned to opportunity owner, 30% to someone else
      let assignedUserId;
      if (Math.random() < 0.7) {
        assignedUserId = opportunity.assigned_user_id;
      } else {
        assignedUserId = randomItem(userIds);
      }
      
      // Due date between now and 1 month from now
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);
      const dueDate = randomDate(now, oneMonthLater);
      
      // Distribute statuses realistically
      let status;
      const rand = Math.random();
      if (rand < 0.3) status = TaskStatus.PENDING;
      else if (rand < 0.7) status = TaskStatus.IN_PROGRESS;
      else status = TaskStatus.COMPLETED;
      
      // Get task name and description
      const name = taskNames[i];
      const description = taskDescriptions[i];
      
      // Insert task
      await pool.query(`
        INSERT INTO tasks (
          name,
          opportunity_id,
          assigned_user_id,
          due_date,
          status,
          description
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        name,
        opportunity.id,
        assignedUserId,
        dueDate,
        status,
        description
      ]);
      
      console.log(`Created task: ${name}`);
    }
    
    console.log('Successfully created 10 sample tasks!');
  } catch (error) {
    console.error('Error creating sample tasks:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run the function
createSampleTasks().catch(err => {
  console.error('Error in seed script:', err);
  process.exit(1);
});
