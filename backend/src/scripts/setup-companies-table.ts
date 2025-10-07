/**
 * Database Setup Script - Companies Table
 * Creates the companies table and initial data in GCP Cloud SQL
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService, testConnection } from '../services/cloudSqlService';

async function setupCompaniesTable() {
  console.log('🚀 Setting up companies table in GCP Cloud SQL...');

  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✅ Database connection established');

    // Read the SQL file
    const sqlPath = join(__dirname, 'create-companies-table.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    console.log('📝 Executing companies table creation SQL...');
    const { error: queryError } = await DatabaseService.query(sql);
    
    if (queryError) {
      console.error('❌ Error executing SQL:', queryError.message);
      process.exit(1);
    }
    
    console.log('✅ Companies table setup completed successfully');
    
    // Test the companies service
    console.log('🧪 Testing companies service...');
    const { data: companies, error } = await DatabaseService.companies.getAll();
    
    if (error) {
      console.error('❌ Error testing companies service:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Companies service working! Found ${companies?.length || 0} companies`);
    
    if (companies && companies.length > 0) {
      console.log('📊 Sample companies:');
      companies.forEach((company: any, index: number) => {
        console.log(`  ${index + 1}. ${company.name} (${company.is_active ? 'Active' : 'Inactive'})`);
      });
    }
    
    console.log('🎉 Companies table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up companies table:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupCompaniesTable();