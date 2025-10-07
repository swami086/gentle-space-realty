/**
 * Database Setup Script - Tags Table
 * Creates the tags table and initial data in GCP Cloud SQL
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService, testConnection } from '../services/cloudSqlService';

async function setupTagsTable() {
  console.log('🚀 Setting up tags table in GCP Cloud SQL...');

  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✅ Database connection established');

    // Read the SQL file
    const sqlPath = join(__dirname, 'create-tags-table.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    console.log('📝 Executing tags table creation SQL...');
    const { error: queryError } = await DatabaseService.query(sql);
    
    if (queryError) {
      console.error('❌ Error executing SQL:', queryError.message);
      process.exit(1);
    }
    
    console.log('✅ Tags table setup completed successfully');
    
    // Test the tags service
    console.log('🧪 Testing tags service...');
    const { data: tags, error } = await DatabaseService.tags.getAll();
    
    if (error) {
      console.error('❌ Error testing tags service:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Tags service working! Found ${tags?.length || 0} tags`);
    
    if (tags && tags.length > 0) {
      console.log('📊 Sample tags:');
      tags.forEach((tag: any, index: number) => {
        console.log(`  ${index + 1}. ${tag.name} (${tag.is_active ? 'Active' : 'Inactive'}) - ${tag.color}`);
      });
    }
    
    console.log('🎉 Tags table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up tags table:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupTagsTable();