/**
 * Simplified Database Schema Creation
 * Creates tables one by one with proper error handling
 */

const { Client } = require('pg');

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

const createTablesSQL = [
  // Extensions first
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  // FAQ Categories table first (referenced by FAQs)
  `CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,

  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,

  // Properties table
  `CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    location VARCHAR(255),
    address TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    lot_size_sqft INTEGER,
    property_type VARCHAR(50) CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'land', 'commercial')),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending', 'off_market')),
    featured BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    virtual_tour_url TEXT,
    year_built INTEGER,
    parking_spaces INTEGER DEFAULT 0,
    hoa_fees DECIMAL(10, 2),
    property_taxes DECIMAL(10, 2),
    listing_agent_id UUID REFERENCES users(id),
    approximate_location JSONB,
    coordinates JSONB,
    availability_status VARCHAR(50),
    place_id VARCHAR(255),
    formatted_address TEXT,
    place_types JSONB DEFAULT '[]'::jsonb,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,

  // Testimonials table
  `CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,

  // Inquiries table
  `CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50) DEFAULT 'general' CHECK (inquiry_type IN ('viewing', 'purchase', 'rent', 'general', 'financing')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    preferred_contact_time VARCHAR(50),
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,

  // FAQs table
  `CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tags JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`
];

const createIndexesSQL = [
  'CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)',
  'CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type)',
  'CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)',
  'CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)',
  'CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured)',
  'CREATE INDEX IF NOT EXISTS idx_properties_listing_agent ON properties(listing_agent_id)',
  'CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status)',
  'CREATE INDEX IF NOT EXISTS idx_testimonials_property ON testimonials(property_id)',
  'CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating)',
  'CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured)',
  'CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)',
  'CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id)',
  'CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to)',
  'CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority)',
  'CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("order")',
  'CREATE INDEX IF NOT EXISTS idx_faq_categories_is_active ON faq_categories(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_faq_categories_order ON faq_categories("order")'
];

async function createSchema() {
  const client = new Client(config);
  
  try {
    console.log('🔗 Connecting to Cloud SQL...');
    await client.connect();
    console.log('✅ Connected to Cloud SQL database');

    // Create tables
    console.log('🏗️ Creating tables...');
    for (let i = 0; i < createTablesSQL.length; i++) {
      const sql = createTablesSQL[i];
      try {
        await client.query(sql);
        console.log(`✅ Table/Extension ${i + 1}/${createTablesSQL.length} created`);
      } catch (error) {
        console.error(`❌ Failed to create table ${i + 1}:`, error.message);
        throw error;
      }
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    for (let i = 0; i < createIndexesSQL.length; i++) {
      const sql = createIndexesSQL[i];
      try {
        await client.query(sql);
        console.log(`✅ Index ${i + 1}/${createIndexesSQL.length} created`);
      } catch (error) {
        console.log(`⚠️ Index ${i + 1} failed (may already exist):`, error.message.substring(0, 50));
      }
    }

    // Insert default admin user
    console.log('👤 Creating default admin user...');
    try {
      await client.query(`
        INSERT INTO users (id, email, name, role, is_active) VALUES 
        ('875605c2-13c9-44ce-b554-bd00e0af2ab9', 'admin@gentlespacerealty.com', 'Admin User', 'admin', true)
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Default admin user created');
    } catch (error) {
      console.log('⚠️ Admin user creation failed:', error.message);
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

    console.log('🎉 Database schema setup completed successfully!');
    return true;

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
  createSchema().catch(console.error);
}

module.exports = { createSchema };