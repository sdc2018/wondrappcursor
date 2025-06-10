import db from '../src/config/database';

/**
 * This script adds is_deleted boolean fields to all relevant tables
 * to implement soft delete functionality across the application.
 */
async function addSoftDeleteFields() {
  const client = await db.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Adding is_deleted field to clients table...');
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Adding is_deleted field to services table...');
    await client.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Adding is_deleted field to opportunities table...');
    await client.query(`
      ALTER TABLE opportunities 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Adding is_deleted field to tasks table...');
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Adding is_deleted field to business_units table...');
    await client.query(`
      ALTER TABLE business_units 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Adding is_deleted field to industries table...');
    await client.query(`
      ALTER TABLE industries 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully added is_deleted fields to all tables');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error adding is_deleted fields:', error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run the function
addSoftDeleteFields()
  .then(() => {
    console.log('Database update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database update failed:', error);
    process.exit(1);
  });
