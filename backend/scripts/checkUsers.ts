import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
  try {
    console.log('Checking users in the database...');
    
    // Query to get all users
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id');
    
    console.log('Users found:', result.rows.length);
    console.log('User data:');
    console.table(result.rows);
    
    // Close the pool
    await pool.end();
    
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

// Run the function
checkUsers();
