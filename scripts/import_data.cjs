/**
 * Data Import Script for GCP Cloud SQL
 * Imports data from Supabase export to Cloud SQL PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cloud SQL connection configuration
const cloudSQLConfig = {
  host: process.env.CLOUD_SQL_HOST || '34.93.226.221', // Update when instance is ready
  port: 5432,
  database: 'gentle_space_realty',
  user: 'postgres',
  password: process.env.CLOUD_SQL_PASSWORD || 'GentleSpace2025!',
  ssl: {
    rejectUnauthorized: false
  }
};

class DataImporter {
  constructor() {
    this.client = new Client(cloudSQLConfig);
    this.data = null;
  }

  mapInquiryType(type) {
    const typeMapping = {
      'showing': 'viewing',
      'information': 'general',
      'offer': 'purchase',
      'callback': 'general',
      'consultation': 'general',
      'inspection': 'viewing'
    };
    return typeMapping[type] || type || 'general';
  }

  mapInquiryStatus(status) {
    const statusMapping = {
      'in_progress': 'contacted',
      'converted': 'completed',
      'pending': 'new',
      'resolved': 'completed',
      'follow_up': 'contacted'
    };
    return statusMapping[status] || status || 'new';
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to Cloud SQL database');
    } catch (error) {
      console.error('❌ Failed to connect to Cloud SQL:', error.message);
      throw error;
    }
  }

  async loadExportData() {
    try {
      const exportPath = path.join(__dirname, '../migration-data/supabase_export.json');
      const rawData = fs.readFileSync(exportPath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log('✅ Loaded Supabase export data');
      console.log('📊 Tables to import:', Object.keys(this.data));
    } catch (error) {
      console.error('❌ Failed to load export data:', error.message);
      throw error;
    }
  }

  async importFaqCategories() {
    const categories = this.data.faq_categories || [];
    console.log(`📝 Importing ${categories.length} FAQ categories...`);

    for (const category of categories) {
      const query = `
        INSERT INTO faq_categories (id, name, slug, description, "order", is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          "order" = EXCLUDED."order",
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `;

      const values = [
        category.id,
        category.name,
        category.slug || category.name.toLowerCase().replace(/\s+/g, '-'), // Generate slug if missing
        category.description,
        category.order || 0,
        category.is_active !== false,
        category.created_at,
        category.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ FAQ categories imported');
  }

  async importUsers() {
    const users = this.data.users || [];
    console.log(`👥 Importing ${users.length} users...`);

    for (const user of users) {
      const query = `
        INSERT INTO users (id, email, name, role, is_active, phone, profile_picture_url, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          is_active = EXCLUDED.is_active,
          phone = EXCLUDED.phone,
          profile_picture_url = EXCLUDED.profile_picture_url,
          bio = EXCLUDED.bio,
          updated_at = EXCLUDED.updated_at
      `;

      // Map super_admin to admin for compatibility
      const role = user.role === 'super_admin' ? 'admin' : (user.role || 'user');
      
      const values = [
        user.id,
        user.email,
        user.name,
        role,
        user.is_active !== false,
        user.phone,
        user.profile_picture_url,
        user.bio,
        user.created_at,
        user.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ Users imported');
  }

  async importProperties() {
    const properties = this.data.properties || [];
    console.log(`🏠 Importing ${properties.length} properties...`);

    for (const property of properties) {
      const query = `
        INSERT INTO properties (
          id, title, description, price, location, address, bedrooms, bathrooms,
          area_sqft, lot_size_sqft, property_type, status, featured, images,
          amenities, features, virtual_tour_url, year_built, parking_spaces,
          hoa_fees, property_taxes, listing_agent_id, approximate_location,
          coordinates, availability_status, place_id, formatted_address,
          place_types, city, state, country, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31, $32, $33
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          location = EXCLUDED.location,
          updated_at = EXCLUDED.updated_at
      `;

      const values = [
        property.id,
        property.title,
        property.description,
        property.price,
        property.location,
        property.address,
        Math.floor(property.bedrooms) || null,
        Math.floor(property.bathrooms) || null,
        property.area_sqft,
        property.lot_size_sqft,
        // Map property types to valid values
        property.property_type === 'residential' ? 'house' : (property.property_type || 'house'),
        // Map status values to valid options
        property.status === 'off-market' ? 'off_market' : (property.status || 'available'),
        property.featured || false,
        JSON.stringify(property.images || []),
        JSON.stringify(property.amenities || []),
        JSON.stringify(property.features || []),
        property.virtual_tour_url,
        property.year_built,
        property.parking_spaces,
        property.hoa_fees,
        property.property_taxes,
        property.listing_agent_id,
        JSON.stringify(property.approximate_location || {}),
        JSON.stringify(property.coordinates || {}),
        property.availability_status,
        property.place_id,
        property.formatted_address,
        JSON.stringify(property.place_types || []),
        property.city,
        property.state,
        property.country || 'India',
        property.created_at,
        property.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ Properties imported');
  }

  async importTestimonials() {
    const testimonials = this.data.testimonials || [];
    console.log(`💬 Importing ${testimonials.length} testimonials...`);

    for (const testimonial of testimonials) {
      const query = `
        INSERT INTO testimonials (
          id, client_name, client_email, client_phone, property_id, rating,
          title, content, status, approved_by, approved_at, rejection_reason,
          is_featured, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          client_name = EXCLUDED.client_name,
          content = EXCLUDED.content,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `;

      const values = [
        testimonial.id,
        testimonial.client_name || 'Anonymous',
        testimonial.client_email,
        testimonial.client_phone,
        testimonial.property_id,
        testimonial.rating,
        testimonial.title,
        testimonial.content,
        testimonial.status || 'pending',
        // Handle non-UUID approved_by values
        testimonial.approved_by && testimonial.approved_by !== 'admin' && testimonial.approved_by.length === 36 ? testimonial.approved_by : null,
        testimonial.approved_at,
        testimonial.rejection_reason,
        testimonial.is_featured || false,
        testimonial.created_at,
        testimonial.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ Testimonials imported');
  }

  async importInquiries() {
    const inquiries = this.data.inquiries || [];
    console.log(`📨 Importing ${inquiries.length} inquiries...`);

    for (const inquiry of inquiries) {
      const query = `
        INSERT INTO inquiries (
          id, property_id, name, email, phone, message, inquiry_type, status,
          priority, assigned_to, response, responded_at, notes,
          preferred_contact_method, preferred_contact_time, budget_min,
          budget_max, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          assigned_to = EXCLUDED.assigned_to,
          response = EXCLUDED.response,
          updated_at = EXCLUDED.updated_at
      `;

      const values = [
        inquiry.id,
        inquiry.property_id,
        inquiry.name,
        inquiry.email,
        inquiry.phone,
        inquiry.message,
        // Map inquiry types to valid values
        this.mapInquiryType(inquiry.inquiry_type),
        // Map inquiry status to valid values
        this.mapInquiryStatus(inquiry.status),
        inquiry.priority || 'medium',
        inquiry.assigned_to,
        inquiry.response,
        inquiry.responded_at,
        inquiry.notes,
        inquiry.preferred_contact_method || 'email',
        inquiry.preferred_contact_time,
        inquiry.budget_min,
        inquiry.budget_max,
        inquiry.created_at,
        inquiry.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ Inquiries imported');
  }

  async importFaqs() {
    const faqs = this.data.faqs || [];
    console.log(`❓ Importing ${faqs.length} FAQs...`);

    for (const faq of faqs) {
      const query = `
        INSERT INTO faqs (
          id, category_id, question, answer, "order", is_active, tags,
          created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          "order" = EXCLUDED."order",
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `;

      const values = [
        faq.id,
        faq.category_id,
        faq.question,
        faq.answer,
        faq.order || 0,
        faq.is_active !== false,
        JSON.stringify(faq.tags || []),
        faq.created_by,
        faq.created_at,
        faq.updated_at
      ];

      await this.client.query(query, values);
    }

    console.log('✅ FAQs imported');
  }

  async importAll() {
    console.log('🚀 Starting data import to Cloud SQL...');
    console.log('=' * 50);

    try {
      await this.connect();
      await this.loadExportData();

      // Import in dependency order
      await this.importFaqCategories();
      await this.importUsers();
      await this.importProperties();
      await this.importTestimonials();
      await this.importInquiries();
      await this.importFaqs();

      console.log('=' * 50);
      console.log('🎉 All data imported successfully!');

      // Verify import
      await this.verifyImport();

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    } finally {
      await this.client.end();
    }
  }

  async verifyImport() {
    console.log('🔍 Verifying import...');

    const tables = ['faq_categories', 'users', 'properties', 'testimonials', 'inquiries', 'faqs'];
    
    for (const table of tables) {
      const result = await this.client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`✅ ${table}: ${count} records`);
    }
  }
}

// Run import if called directly
if (require.main === module) {
  const importer = new DataImporter();
  importer.importAll().catch(console.error);
}

module.exports = DataImporter;