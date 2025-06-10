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
// Create a new pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
function alterBusinessUnitsTable() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Connecting to database...');
            // Check if the column already exists
            const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_units' AND column_name = 'owner_id'
    `;
            const columnCheck = yield pool.query(checkColumnQuery);
            if (columnCheck.rows.length === 0) {
                console.log('Adding owner_id column to business_units table...');
                // Add the owner_id column
                const alterTableQuery = `
        ALTER TABLE business_units 
        ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      `;
                yield pool.query(alterTableQuery);
                console.log('Successfully added owner_id column to business_units table');
            }
            else {
                console.log('owner_id column already exists in business_units table');
            }
            console.log('Database update completed successfully');
        }
        catch (error) {
            console.error('Error altering business_units table:', error);
        }
        finally {
            // Close the pool
            yield pool.end();
        }
    });
}
// Run the function
alterBusinessUnitsTable();
//# sourceMappingURL=alterBusinessUnitsTable.js.map