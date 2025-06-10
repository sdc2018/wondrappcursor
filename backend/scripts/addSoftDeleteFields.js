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
const database_1 = __importDefault(require("../src/config/database"));
/**
 * This script adds is_deleted boolean fields to all relevant tables
 * to implement soft delete functionality across the application.
 */
function addSoftDeleteFields() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            // Start transaction
            yield client.query('BEGIN');
            console.log('Adding is_deleted field to clients table...');
            yield client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            console.log('Adding is_deleted field to services table...');
            yield client.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            console.log('Adding is_deleted field to opportunities table...');
            yield client.query(`
      ALTER TABLE opportunities 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            console.log('Adding is_deleted field to tasks table...');
            yield client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            console.log('Adding is_deleted field to business_units table...');
            yield client.query(`
      ALTER TABLE business_units 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            console.log('Adding is_deleted field to industries table...');
            yield client.query(`
      ALTER TABLE industries 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);
            // Commit transaction
            yield client.query('COMMIT');
            console.log('Successfully added is_deleted fields to all tables');
        }
        catch (error) {
            // Rollback transaction on error
            yield client.query('ROLLBACK');
            console.error('Error adding is_deleted fields:', error);
            throw error;
        }
        finally {
            // Release client back to pool
            client.release();
        }
    });
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
//# sourceMappingURL=addSoftDeleteFields.js.map