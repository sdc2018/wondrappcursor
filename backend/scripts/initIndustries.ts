import db from '../src/config/database';
import IndustryModel from '../src/models/Industry';
import { IndustryStatus } from '../src/models/Industry';

/**
 * Script to initialize the industries table with unique industries from clients and services
 * 
 * This script:
 * 1. Extracts unique industries from the clients table
 * 2. Extracts unique industries from the services table's applicable_industries arrays
 * 3. Combines these unique industries and inserts them into the industries table
 */
async function initIndustries() {
  try {
    console.log('Initializing industries...');
    
    // Get existing industries to avoid duplicates
    const existingIndustries = await IndustryModel.findAll();
    const existingIndustryNames = existingIndustries.map(industry => industry.name);
    console.log('Existing industries:', existingIndustryNames);
    
    // Get unique industries from clients
    const clientIndustriesQuery = `
      SELECT DISTINCT industry 
      FROM clients 
      WHERE industry IS NOT NULL AND industry != ''
    `;
    const clientIndustriesResult = await db.query(clientIndustriesQuery);
    const clientIndustries = clientIndustriesResult.rows.map(row => row.industry);
    console.log('Industries from clients:', clientIndustries);
    
    // Get unique industries from services (stored as arrays)
    const serviceIndustriesQuery = `
      SELECT DISTINCT unnest(applicable_industries) as industry
      FROM services
      WHERE applicable_industries IS NOT NULL AND array_length(applicable_industries, 1) > 0
    `;
    const serviceIndustriesResult = await db.query(serviceIndustriesQuery);
    const serviceIndustries = serviceIndustriesResult.rows.map(row => row.industry);
    console.log('Industries from services:', serviceIndustries);
    
    // Combine and deduplicate all industries
    const allIndustries = [...new Set([...clientIndustries, ...serviceIndustries])];
    console.log('All unique industries:', allIndustries);
    
    // Filter out industries that already exist
    const newIndustries = allIndustries.filter(industry => 
      !existingIndustryNames.includes(industry)
    );
    console.log('New industries to add:', newIndustries);
    
    // Insert new industries
    let createdCount = 0;
    for (const industryName of newIndustries) {
      await IndustryModel.create({
        name: industryName,
        description: `${industryName} industry`,
        status: IndustryStatus.ACTIVE
      });
      createdCount++;
      console.log(`Created industry: ${industryName}`);
    }
    
    console.log(`Created ${createdCount} new industries`);
    console.log(`Total industries in database: ${existingIndustryNames.length + createdCount}`);
    
  } catch (error) {
    console.error('Error initializing industries:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the initialization
initIndustries();
