/**
 * Cloud SQL Database Setup Script
 * Creates schema and imports data to Cloud SQL PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');

// Cloud SQL connection configuration
const config = {
  host: '34.93.226.221',
  port: 5432,
  database: 'gentle_space_realty',
  user: 'postgres',
  password: 'GentleSpace2025!',
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔗 Connecting to Cloud SQL...');
    await client.connect();
    console.log('✅ Connected to Cloud SQL database');

    // Read and execute schema SQL
    console.log('🏗️ Creating database schema...');
    const schemaSql = fs.readFileSync('./scripts/create_gcp_schema.sql', 'utf8');
    
    // Split SQL commands (PostgreSQL doesn't support multiple commands in one query)
    const commands = schemaSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('\\c'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.length === 0) continue;

      try {
        await client.query(command);
        console.log(`✅ Executed command ${i + 1}/${commands.length}`);
      } catch (error) {
        console.log(`⚠️ Command ${i + 1} failed (may be expected):`, error.message.substring(0, 100));
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('🎉 Database schema setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };