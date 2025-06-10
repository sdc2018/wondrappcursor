import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Define default business units
const defaultBusinessUnits = [
  {
    name: 'Creative',
    description: 'Creative design and branding services',
    status: 'active'
  },
  {
    name: 'Digital Marketing',
    description: 'Digital marketing and advertising services',
    status: 'active'
  },
  {
    name: 'Content Production',
    description: 'Content creation and production services',
    status: 'active'
  },
  {
    name: 'Media Planning',
    description: 'Media strategy and planning services',
    status: 'active'
  },
  {
    name: 'Strategy',
    description: 'Strategic consulting and planning services',
    status: 'active'
  }
];

async function initBusinessUnits() {
  try {
    console.log('Initializing default business units...');
    
    // Check which business units already exist
    const existingResult = await pool.query('SELECT name FROM business_units');
    const existingNames = existingResult.rows.map(row => row.name);
    
    console.log('Existing business units:', existingNames);
    
    // Create missing business units
    let createdCount = 0;
    
    for (const businessUnit of defaultBusinessUnits) {
      if (!existingNames.includes(businessUnit.name)) {
        console.log(`Creating business unit: ${businessUnit.name}`);
        
        await pool.query(
          'INSERT INTO business_units (name, description, status) VALUES ($1, $2, $3)',
          [businessUnit.name, businessUnit.description, businessUnit.status]
        );
        
        createdCount++;
      } else {
        console.log(`Business unit already exists: ${businessUnit.name}`);
      }
    }
    
    console.log(`Created ${createdCount} new business units`);
    
    // Verify all business units now exist
    const finalResult = await pool.query('SELECT id, name, description, status FROM business_units ORDER BY id');
    console.log('All business units:');
    console.table(finalResult.rows);
    
    // Close the pool
    await pool.end();
    
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error initializing business units:', error);
    process.exit(1);
  }
}

// Run the function
initBusinessUnits();
