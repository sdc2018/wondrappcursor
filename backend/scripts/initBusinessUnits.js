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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Create a database connection pool
const pool = new pg_1.Pool({
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
function initBusinessUnits() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Initializing default business units...');
            // Check which business units already exist
            const existingResult = yield pool.query('SELECT name FROM business_units');
            const existingNames = existingResult.rows.map(row => row.name);
            console.log('Existing business units:', existingNames);
            // Create missing business units
            let createdCount = 0;
            for (const businessUnit of defaultBusinessUnits) {
                if (!existingNames.includes(businessUnit.name)) {
                    console.log(`Creating business unit: ${businessUnit.name}`);
                    yield pool.query('INSERT INTO business_units (name, description, status) VALUES ($1, $2, $3)', [businessUnit.name, businessUnit.description, businessUnit.status]);
                    createdCount++;
                }
                else {
                    console.log(`Business unit already exists: ${businessUnit.name}`);
                }
            }
            console.log(`Created ${createdCount} new business units`);
            // Verify all business units now exist
            const finalResult = yield pool.query('SELECT id, name, description, status FROM business_units ORDER BY id');
            console.log('All business units:');
            console.table(finalResult.rows);
            // Close the pool
            yield pool.end();
            console.log('Database connection closed');
        }
        catch (error) {
            console.error('Error initializing business units:', error);
            process.exit(1);
        }
    });
}
// Run the function
initBusinessUnits();
//# sourceMappingURL=initBusinessUnits.js.map