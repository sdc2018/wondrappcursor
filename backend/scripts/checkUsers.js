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
function checkUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking users in the database...');
            // Query to get all users
            const result = yield pool.query('SELECT id, username, email, role FROM users ORDER BY id');
            console.log('Users found:', result.rows.length);
            console.log('User data:');
            console.table(result.rows);
            // Close the pool
            yield pool.end();
            console.log('Database connection closed');
        }
        catch (error) {
            console.error('Error checking users:', error);
            process.exit(1);
        }
    });
}
// Run the function
checkUsers();
//# sourceMappingURL=checkUsers.js.map