import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function alterBusinessUnitsTable() {
  try {
    console.log('Connecting to database...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_units' AND column_name = 'owner_id'
    `;
    
    const columnCheck = await pool.query(checkColumnQuery);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding owner_id column to business_units table...');
      
      // Add the owner_id column
      const alterTableQuery = `
        ALTER TABLE business_units 
        ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      `;
      
      await pool.query(alterTableQuery);
      console.log('Successfully added owner_id column to business_units table');
    } else {
      console.log('owner_id column already exists in business_units table');
    }
    
    console.log('Database update completed successfully');
  } catch (error) {
    console.error('Error altering business_units table:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
alterBusinessUnitsTable();
