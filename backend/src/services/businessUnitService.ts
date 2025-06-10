import BusinessUnitModel, { BusinessUnitStatus, BusinessUnitInput } from '../models/BusinessUnit';

/**
 * Default business units that should exist in the system
 * These match the hardcoded values used in the frontend Services page
 */
const DEFAULT_BUSINESS_UNITS: BusinessUnitInput[] = [
  {
    name: 'Creative',
    description: 'Creative design and branding services',
    status: BusinessUnitStatus.ACTIVE
  },
  {
    name: 'Digital Marketing',
    description: 'Digital marketing and advertising services',
    status: BusinessUnitStatus.ACTIVE
  },
  {
    name: 'Content Production',
    description: 'Content creation and production services',
    status: BusinessUnitStatus.ACTIVE
  },
  {
    name: 'Media Planning',
    description: 'Media strategy and planning services',
    status: BusinessUnitStatus.ACTIVE
  },
  {
    name: 'Strategy',
    description: 'Strategic consulting and planning services',
    status: BusinessUnitStatus.ACTIVE
  }
];

/**
 * BusinessUnitService handles business unit initialization and management
 */
class BusinessUnitService {
  constructor() {
    // Constructor is empty as we use singleton instance of BusinessUnitModel
  }

  /**
   * Initialize default business units if they don't already exist
   */
  async initDefaultBusinessUnits(): Promise<void> {
    try {
      console.log('Initializing default business units...');
      
      // Get all existing business units
      const existingBusinessUnits = await BusinessUnitModel.findAll();
      const existingNames = existingBusinessUnits.map(bu => bu.name);
      
      console.log('Existing business units:', existingNames);
      
      // Create missing business units
      let createdCount = 0;
      
      for (const businessUnit of DEFAULT_BUSINESS_UNITS) {
        if (!existingNames.includes(businessUnit.name)) {
          console.log(`Creating business unit: ${businessUnit.name}`);
          
          await BusinessUnitModel.create(businessUnit);
          
          createdCount++;
        } else {
          console.log(`Business unit already exists: ${businessUnit.name}`);
        }
      }
      
      console.log(`Created ${createdCount} new business units`);
      
      // Verify all business units now exist
      const finalBusinessUnits = await BusinessUnitModel.findAll();
      console.log(`Total business units in database: ${finalBusinessUnits.length}`);
    } catch (error) {
      console.error('Error initializing business units:', error);
    }
  }
}

// Export as singleton instance
export default new BusinessUnitService();