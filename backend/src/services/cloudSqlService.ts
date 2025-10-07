/**
 * GCP Database Service (formerly Supabase)
 * Backend database client for Cloud SQL PostgreSQL
 * Maintains API compatibility with original Supabase service
 */

import dotenv from 'dotenv';

// Load environment variables from main .env file
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import { Storage } from '@google-cloud/storage';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createLogger } from '../utils/logger';

const logger = createLogger();

// Cloud SQL configuration
const dbConfig = {
  host: process.env.DB_HOST || '34.93.226.221',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gentle_space_realty',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'GentleSpace2025!',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize connection pool
const pool = new Pool(dbConfig);

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_PRIVATE_KEY_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/Keys/gentle-space-firebase-adminsdk-fbsvc-56d9a444bd.json';
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'gentle-space'
    });
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Firebase Admin initialization failed:', error);
  }
}

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE_PATH || '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/Keys/aqueous-impact-269911-8c1c766d0dcb.json',
  projectId: process.env.GCS_PROJECT_ID || 'aqueous-impact-269911'
});

/**
 * Test database connection (maintains Supabase API compatibility)
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT COUNT(*) as count FROM properties');
    client.release();
    
    logger.info('Cloud SQL connection test successful');
    return true;
  } catch (error: any) {
    logger.error('Cloud SQL connection test failed', { error: error.message });
    return false;
  }
};

/**
 * Helper function to format response like Supabase
 */
const formatResponse = (data: any, error: any = null) => {
  return {
    data,
    error
  };
};

/**
 * Database service functions (Supabase-compatible API)
 */
export const DatabaseService = {
  /**
   * Execute raw SQL query
   */
  query: async (sql: string, params: any[] = []) => {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return formatResponse(result);
    } catch (error: any) {
      logger.error('Database query error:', error);
      return formatResponse(null, { message: error.message });
    } finally {
      client.release();
    }
  },
  /**
   * Properties operations
   */
  properties: {
    getAll: async (filters: any = {}) => {
      const client = await pool.connect();
      try {
        let query = `
          SELECT p.*, u.name as agent_name 
          FROM properties p 
          LEFT JOIN users u ON p.listing_agent_id = u.id 
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.status) {
          query += ` AND p.status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }
        if (filters.property_type) {
          query += ` AND p.property_type = $${paramIndex}`;
          params.push(filters.property_type);
          paramIndex++;
        }
        if (filters.min_price) {
          query += ` AND p.price >= $${paramIndex}`;
          params.push(filters.min_price);
          paramIndex++;
        }
        if (filters.max_price) {
          query += ` AND p.price <= $${paramIndex}`;
          params.push(filters.max_price);
          paramIndex++;
        }

        query += ' ORDER BY p.created_at DESC';
        
        const result = await client.query(query, params);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Properties getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT p.*, u.name as agent_name, u.email as agent_email 
          FROM properties p 
          LEFT JOIN users u ON p.listing_agent_id = u.id 
          WHERE p.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'Property not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Properties getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (propertyData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO properties (
            title, description, price, location, address, bedrooms, bathrooms,
            area_sqft, property_type, status, featured, images, amenities, features
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        
        const values = [
          propertyData.title,
          propertyData.description,
          propertyData.price,
          propertyData.location,
          propertyData.address,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.area_sqft,
          propertyData.property_type,
          propertyData.status || 'available',
          propertyData.featured || false,
          JSON.stringify(propertyData.images || []),
          JSON.stringify(propertyData.amenities || []),
          JSON.stringify(propertyData.features || [])
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Properties create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            if (typeof value === 'object' && value !== null) {
              setClause.push(`${key} = $${paramIndex}`);
              values.push(JSON.stringify(value));
            } else {
              setClause.push(`${key} = $${paramIndex}`);
              values.push(value);
            }
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE properties 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Properties update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM properties WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('Properties delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    search: async (searchQuery: string, filters: any = {}) => {
      const client = await pool.connect();
      try {
        let query = `
          SELECT p.*, u.name as agent_name 
          FROM properties p 
          LEFT JOIN users u ON p.listing_agent_id = u.id 
          WHERE (
            p.title ILIKE $1 OR 
            p.description ILIKE $1 OR 
            p.location ILIKE $1
          )
        `;
        const params = [`%${searchQuery}%`];
        let paramIndex = 2;

        if (filters.status) {
          query += ` AND p.status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }
        if (filters.property_type) {
          query += ` AND p.property_type = $${paramIndex}`;
          params.push(filters.property_type);
          paramIndex++;
        }

        query += ' ORDER BY p.created_at DESC';
        
        const result = await client.query(query, params);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Properties search error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * Testimonials operations
   */
  testimonials: {
    getAll: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT t.*, p.title as property_title 
          FROM testimonials t 
          LEFT JOIN properties p ON t.property_id = p.id 
          ORDER BY t.created_at DESC
        `);
        
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Testimonials getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getApproved: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT t.*, p.title as property_title 
          FROM testimonials t 
          LEFT JOIN properties p ON t.property_id = p.id 
          WHERE t.status = 'approved' 
          ORDER BY t.approved_at DESC
        `);
        
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Testimonials getApproved error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getPending: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT t.*, p.title as property_title 
          FROM testimonials t 
          LEFT JOIN properties p ON t.property_id = p.id 
          WHERE t.status = 'pending' 
          ORDER BY t.created_at DESC
        `);
        
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Testimonials getPending error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (testimonialData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO testimonials (
            client_name, client_email, client_phone, property_id, rating,
            title, content, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        
        const values = [
          testimonialData.client_name,
          testimonialData.client_email,
          testimonialData.client_phone,
          testimonialData.property_id,
          testimonialData.rating,
          testimonialData.title,
          testimonialData.content,
          'pending'
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Testimonials create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE testimonials 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Testimonials update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    updateStatus: async (id: string, status: string, reviewerId: string, reason?: string) => {
      const client = await pool.connect();
      try {
        let query = `UPDATE testimonials SET status = $1, updated_at = NOW()`;
        const values = [status];
        let paramIndex = 2;

        if (status === 'approved') {
          query += `, approved_at = NOW(), approved_by = $${paramIndex}`;
          values.push(reviewerId);
          paramIndex++;
        } else if (status === 'rejected' && reason) {
          query += `, rejection_reason = $${paramIndex}`;
          values.push(reason);
          paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Testimonials updateStatus error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM testimonials WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('Testimonials delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * Inquiries operations
   */
  inquiries: {
    getAll: async (filters: any = {}) => {
      const client = await pool.connect();
      try {
        let query = `
          SELECT i.*, p.title as property_title 
          FROM inquiries i 
          LEFT JOIN properties p ON i.property_id = p.id 
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.status) {
          query += ` AND i.status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }
        if (filters.assigned_to) {
          query += ` AND i.assigned_to = $${paramIndex}`;
          params.push(filters.assigned_to);
          paramIndex++;
        }

        query += ' ORDER BY i.created_at DESC';
        
        const result = await client.query(query, params);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Inquiries getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT i.*, p.title as property_title 
          FROM inquiries i 
          LEFT JOIN properties p ON i.property_id = p.id 
          WHERE i.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'Inquiry not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Inquiries getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (inquiryData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO inquiries (property_id, name, email, phone, message, inquiry_type, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const values = [
          inquiryData.property_id,
          inquiryData.name,
          inquiryData.email,
          inquiryData.phone,
          inquiryData.message,
          inquiryData.inquiry_type || 'general',
          'new'
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Inquiries create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE inquiries 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Inquiries update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    updateStatus: async (id: string, status: string, notes?: string) => {
      const client = await pool.connect();
      try {
        let query = `UPDATE inquiries SET status = $1, updated_at = NOW()`;
        const values = [status];
        let paramIndex = 2;

        if (notes) {
          query += `, notes = $${paramIndex}`;
          values.push(notes);
          paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Inquiries updateStatus error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    assign: async (id: string, agentId: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          UPDATE inquiries 
          SET assigned_to = $1, updated_at = NOW()
          WHERE id = $2 
          RETURNING *
        `, [agentId, id]);
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Inquiries assign error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * FAQs operations
   */
  faqs: {
    getAll: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT f.*, c.name as category_name 
          FROM faqs f 
          LEFT JOIN faq_categories c ON f.category_id = c.id 
          WHERE f.is_active = true 
          ORDER BY f."order" ASC, f.created_at DESC
        `);
        
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('FAQs getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT f.*, c.name as category_name 
          FROM faqs f 
          LEFT JOIN faq_categories c ON f.category_id = c.id 
          WHERE f.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'FAQ not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQs getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (faqData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO faqs (category_id, question, answer, "order", is_active, tags, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const values = [
          faqData.category_id,
          faqData.question,
          faqData.answer,
          faqData.order || 0,
          true,
          JSON.stringify(faqData.tags || []),
          faqData.created_by
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQs create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            if (key === 'tags') {
              setClause.push(`${key} = $${paramIndex}`);
              values.push(JSON.stringify(value));
            } else {
              setClause.push(`${key} = $${paramIndex}`);
              values.push(value);
            }
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE faqs 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQs update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM faqs WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('FAQs delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * FAQ Categories operations
   */
  faqCategories: {
    getAll: async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT * FROM faq_categories 
          WHERE is_active = true 
          ORDER BY "order" ASC
        `);
        
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('FAQ Categories getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM faq_categories WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'Category not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQ Categories getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (categoryData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO faq_categories (name, slug, description, "order", is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const values = [
          categoryData.name,
          categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          categoryData.description,
          categoryData.order || 0,
          true
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQ Categories create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE faq_categories 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('FAQ Categories update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM faq_categories WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('FAQ Categories delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * Users operations
   */
  users: {
    getAll: async (filters: any = {}) => {
      const client = await pool.connect();
      try {
        let query = 'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.role) {
          query += ` AND role = $${paramIndex}`;
          params.push(filters.role);
          paramIndex++;
        }
        if (filters.is_active !== undefined) {
          query += ` AND is_active = $${paramIndex}`;
          params.push(filters.is_active);
          paramIndex++;
        }
        if (filters.email) {
          query += ` AND email = $${paramIndex}`;
          params.push(filters.email);
          paramIndex++;
        }

        query += ' ORDER BY created_at DESC';
        
        const result = await client.query(query, params);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Users getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'User not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Users getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (userData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO users (id, email, name, role, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, name, role, is_active, created_at, updated_at
        `;
        
        const values = [
          userData.id, // Use provided Firebase UID as id
          userData.email,
          userData.name,
          userData.role || 'user',
          userData.is_active !== false
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Users create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE users 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, email, name, role, is_active, created_at, updated_at
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Users update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    updateRole: async (id: string, role: string, _adminUserId: string) => {
      // Simplified role update without RPC
      const client = await pool.connect();
      try {
        const result = await client.query(`
          UPDATE users 
          SET role = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, email, name, role, is_active, created_at, updated_at
        `, [role, id]);
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Users updateRole error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('Users delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * Companies operations
   */
  companies: {
    getAll: async () => {
      const client = await pool.connect();
      try {
        const query = 'SELECT * FROM companies ORDER BY "order" ASC, created_at DESC';
        const result = await client.query(query);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Companies getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getActive: async () => {
      const client = await pool.connect();
      try {
        const query = 'SELECT * FROM companies WHERE is_active = true ORDER BY "order" ASC, created_at DESC';
        const result = await client.query(query);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Companies getActive error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM companies WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'Company not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Companies getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (companyData: any) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO companies (name, logo, website, description, "order", is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const values = [
          companyData.name,
          companyData.logo,
          companyData.website || null,
          companyData.description || null,
          companyData.order || 0,
          companyData.is_active !== false
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Companies create error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, updates: any) => {
      const client = await pool.connect();
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'id') {
            if (key === 'order') {
              setClause.push(`"order" = $${paramIndex}`);
            } else {
              setClause.push(`${key} = $${paramIndex}`);
            }
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE companies 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Companies update error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM companies WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('Companies delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  },

  /**
   * Tags operations
   */
  tags: {
    getAll: async () => {
      const client = await pool.connect();
      try {
        const query = 'SELECT * FROM tags ORDER BY name ASC';
        const result = await client.query(query);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Tags getAll error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getActive: async () => {
      const client = await pool.connect();
      try {
        const query = 'SELECT * FROM tags WHERE is_active = true ORDER BY name ASC';
        const result = await client.query(query);
        return formatResponse(result.rows);
      } catch (error: any) {
        logger.error('Tags getActive error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    getById: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM tags WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return formatResponse(null, { message: 'Tag not found' });
        }
        
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Tags getById error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    create: async (tagData: {
      name: string;
      color?: string;
      backgroundColor?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO tags (name, color, background_color, description, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const values = [
          tagData.name,
          tagData.color || '#000000',
          tagData.backgroundColor || '#f0f9ff',
          tagData.description || null,
          tagData.isActive !== undefined ? tagData.isActive : true
        ];

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Tags create error:', error);
        if (error.code === '23505') {
          return formatResponse(null, { message: 'Tag name already exists' });
        }
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    update: async (id: string, tagData: {
      name?: string;
      color?: string;
      backgroundColor?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const client = await pool.connect();
      try {
        // Check if tag exists first
        const existsResult = await client.query('SELECT id FROM tags WHERE id = $1', [id]);
        if (existsResult.rows.length === 0) {
          return formatResponse(null, { message: 'Tag not found' });
        }

        // Build dynamic update query
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(tagData).forEach(([key, value]) => {
          if (value !== undefined) {
            // Convert camelCase to snake_case for database columns
            const dbKey = key === 'backgroundColor' ? 'background_color' : 
                         key === 'isActive' ? 'is_active' : key;
            setClause.push(`${dbKey} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE tags 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return formatResponse(result.rows[0]);
      } catch (error: any) {
        logger.error('Tags update error:', error);
        if (error.code === '23505') {
          return formatResponse(null, { message: 'Tag name already exists' });
        }
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    },

    delete: async (id: string) => {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM tags WHERE id = $1', [id]);
        return formatResponse((result.rowCount ?? 0) > 0);
      } catch (error: any) {
        logger.error('Tags delete error:', error);
        return formatResponse(null, { message: error.message });
      } finally {
        client.release();
      }
    }
  }
};

// Storage service functions for Cloud Storage compatibility
export const StorageService = {
  uploadFile: async (bucketName: string, fileName: string, fileBuffer: Buffer, options: any = {}) => {
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: options.contentType || 'application/octet-stream',
          cacheControl: options.cacheControl || 'public, max-age=31536000'
        },
        public: options.public || false
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('Storage upload error:', error);
          reject(error);
        });

        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
          logger.info('File uploaded successfully', { fileName, bucketName });
          resolve(formatResponse({ publicUrl }));
        });

        stream.end(fileBuffer);
      });
    } catch (error: any) {
      logger.error('Storage uploadFile error:', error);
      return formatResponse(null, { message: error.message });
    }
  },

  getPublicUrl: (bucketName: string, fileName: string) => {
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  },

  deleteFile: async (bucketName: string, fileName: string) => {
    try {
      const bucket = storage.bucket(bucketName);
      await bucket.file(fileName).delete();
      
      logger.info('File deleted successfully', { fileName, bucketName });
      return formatResponse(true);
    } catch (error: any) {
      logger.error('Storage deleteFile error:', error);
      return formatResponse(null, { message: error.message });
    }
  }
};

// Firebase Auth service for authentication compatibility
export const AuthService = {
  verifyToken: async (idToken: string) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return formatResponse(decodedToken);
    } catch (error: any) {
      logger.error('Auth verifyToken error:', error);
      return formatResponse(null, { message: error.message });
    }
  },

  getUserByUid: async (uid: string) => {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return formatResponse(userRecord);
    } catch (error: any) {
      logger.error('Auth getUserByUid error:', error);
      return formatResponse(null, { message: error.message });
    }
  }
};

// Export the pool for direct access if needed
export const supabaseClient = pool;
export default pool;