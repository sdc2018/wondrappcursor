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
const Industry_1 = __importDefault(require("../src/models/Industry"));
const Industry_2 = require("../src/models/Industry");
/**
 * Script to initialize the industries table with unique industries from clients and services
 *
 * This script:
 * 1. Extracts unique industries from the clients table
 * 2. Extracts unique industries from the services table's applicable_industries arrays
 * 3. Combines these unique industries and inserts them into the industries table
 */
function initIndustries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Initializing industries...');
            // Get existing industries to avoid duplicates
            const existingIndustries = yield Industry_1.default.findAll();
            const existingIndustryNames = existingIndustries.map(industry => industry.name);
            console.log('Existing industries:', existingIndustryNames);
            // Get unique industries from clients
            const clientIndustriesQuery = `
      SELECT DISTINCT industry 
      FROM clients 
      WHERE industry IS NOT NULL AND industry != ''
    `;
            const clientIndustriesResult = yield database_1.default.query(clientIndustriesQuery);
            const clientIndustries = clientIndustriesResult.rows.map(row => row.industry);
            console.log('Industries from clients:', clientIndustries);
            // Get unique industries from services (stored as arrays)
            const serviceIndustriesQuery = `
      SELECT DISTINCT unnest(applicable_industries) as industry
      FROM services
      WHERE applicable_industries IS NOT NULL AND array_length(applicable_industries, 1) > 0
    `;
            const serviceIndustriesResult = yield database_1.default.query(serviceIndustriesQuery);
            const serviceIndustries = serviceIndustriesResult.rows.map(row => row.industry);
            console.log('Industries from services:', serviceIndustries);
            // Combine and deduplicate all industries
            const allIndustries = [...new Set([...clientIndustries, ...serviceIndustries])];
            console.log('All unique industries:', allIndustries);
            // Filter out industries that already exist
            const newIndustries = allIndustries.filter(industry => !existingIndustryNames.includes(industry));
            console.log('New industries to add:', newIndustries);
            // Insert new industries
            let createdCount = 0;
            for (const industryName of newIndustries) {
                yield Industry_1.default.create({
                    name: industryName,
                    description: `${industryName} industry`,
                    status: Industry_2.IndustryStatus.ACTIVE
                });
                createdCount++;
                console.log(`Created industry: ${industryName}`);
            }
            console.log(`Created ${createdCount} new industries`);
            console.log(`Total industries in database: ${existingIndustryNames.length + createdCount}`);
        }
        catch (error) {
            console.error('Error initializing industries:', error);
        }
        finally {
            // Close the database connection
            yield database_1.default.end();
        }
    });
}
// Run the initialization
initIndustries();
//# sourceMappingURL=initIndustries.js.map