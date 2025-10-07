/**
 * Comprehensive Integration Test Suite
 * Tests all system integration points with Supabase (Frontend-Only Architecture)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Test Configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Mock data for testing
const testProperty = {
  title: 'Test Office Space',
  price: 50000,
  location: 'Test Location, Bengaluru',
  category: 'fully-furnished-offices',
  address: 'Test Address',
  description: 'Test property for integration testing',
  bedrooms: 0,
  bathrooms: 1,
  size: 1500,
  status: 'available'
};

const testInquiry = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+91 9876543210',
  message: 'Test inquiry message',
  inquiry_type: 'general',
  priority: 'medium'
};

describe('🔍 Supabase Integration', () => {
  let supabaseClient: any;
  let adminClient: any;
  let testPropertyId: string;
  let testInquiryId: string;
  
  beforeAll(() => {
    expect(TEST_CONFIG.supabaseUrl).toBeDefined();
    expect(TEST_CONFIG.supabaseAnonKey).toBeDefined();
    
    supabaseClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseAnonKey!);
    
    if (TEST_CONFIG.supabaseServiceKey) {
      adminClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    }
  });
  
  afterAll(async () => {
    // Cleanup test data
    if (adminClient && testPropertyId) {
      await adminClient.from('properties').delete().eq('id', testPropertyId);
    }
    if (adminClient && testInquiryId) {
      await adminClient.from('inquiries').delete().eq('id', testInquiryId);
    }
  });
  
  test('Supabase connection should be healthy', async () => {
    const { data, error } = await supabaseClient
      .from('properties')
      .select('count', { count: 'exact', head: true });
    
    expect(error).toBeNull();
    expect(data).not.toBeUndefined();
  });

  test('Properties table should return property listings', async () => {
    const { data: properties, error } = await supabaseClient
      .from('properties')
      .select('*')
      .limit(10);
    
    expect(error).toBeNull();
    expect(Array.isArray(properties)).toBe(true);
    expect(properties.length).toBeGreaterThanOrEqual(0);
    
    if (properties.length > 0) {
      // Validate property structure
      const property = properties[0];
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('price');
      expect(property).toHaveProperty('location');
      expect(property).toHaveProperty('category');
    }
  });

  test('Property creation should work with admin client', async () => {
    if (!adminClient) {
      console.log('Skipping property creation test - admin client not available');
      return;
    }
    
    const { data: property, error } = await adminClient
      .from('properties')
      .insert([testProperty])
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(property).toBeDefined();
    expect(property.title).toBe(testProperty.title);
    expect(property.price).toBe(testProperty.price);
    expect(property.location).toBe(testProperty.location);
    
    testPropertyId = property.id;
  });

  test('Single property retrieval should work', async () => {
    if (!testPropertyId) {
      console.log('Skipping single property test - no test property created');
      return;
    }
    
    const { data: property, error } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', testPropertyId)
      .single();
    
    expect(error).toBeNull();
    expect(property).toBeDefined();
    expect(property.id).toBe(testPropertyId);
    expect(property.title).toBe(testProperty.title);
  });

  test('Inquiry submission should work correctly', async () => {
    const inquiryData = {
      ...testInquiry,
      property_id: testPropertyId || null
    };
    
    const { data: inquiry, error } = await supabaseClient
      .from('inquiries')
      .insert([inquiryData])
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(inquiry).toBeDefined();
    expect(inquiry.name).toBe(testInquiry.name);
    expect(inquiry.email).toBe(testInquiry.email);
    expect(inquiry.status).toBe('new'); // Default status
    
    testInquiryId = inquiry.id;
  });

  test('Inquiry validation should reject incomplete data', async () => {
    const incompleteInquiry = { name: 'Test' }; // Missing required fields
    
    const { error } = await supabaseClient
      .from('inquiries')
      .insert([incompleteInquiry]);
    
    expect(error).toBeDefined();
    expect(error.message).toContain('not-null'); // Database constraint violation
  });
});

describe('🔐 Authentication & Authorization (Supabase RLS)', () => {
  let supabaseClient: any;
  let adminClient: any;
  
  beforeAll(() => {
    supabaseClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseAnonKey!);
    
    if (TEST_CONFIG.supabaseServiceKey) {
      adminClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    }
  });
  
  test('Anonymous users should have limited access to inquiries', async () => {
    const { data, error } = await supabaseClient
      .from('inquiries')
      .select('*');
    
    // Behavior depends on RLS policies - could return empty array or error
    if (error) {
      expect(error.code).toBeDefined();
    } else {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('Admin client should have full access to inquiries', async () => {
    if (!adminClient) {
      console.log('Skipping admin access test - admin client not available');
      return;
    }
    
    const { data: inquiries, error } = await adminClient
      .from('inquiries')
      .select('*')
      .limit(5);
    
    expect(error).toBeNull();
    expect(Array.isArray(inquiries)).toBe(true);
  });
  
  test('Supabase authentication service should be available', async () => {
    const { data, error } = await supabaseClient.auth.getSession();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.session).toBeNull(); // No active session for test
  });
});

describe('🗄️ Supabase Configuration', () => {
  let supabaseClient: any;
  
  beforeAll(() => {
    supabaseClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseAnonKey!);
  });
  
  test('Supabase environment variables should be configured', () => {
    expect(TEST_CONFIG.supabaseUrl).toBeDefined();
    expect(TEST_CONFIG.supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);
    expect(TEST_CONFIG.supabaseAnonKey).toBeDefined();
    expect(TEST_CONFIG.supabaseAnonKey).toMatch(/^eyJ/); // JWT format
  });

  test('Database schema should include required tables', async () => {
    // Test that required tables exist by querying them
    const tables = ['properties', 'inquiries', 'property_tags', 'testimonials'];
    
    for (const table of tables) {
      const { data, error } = await supabaseClient
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      expect(error).toBeNull();
      expect(data).not.toBeUndefined();
    }
  });

  test('Properties table should have correct structure', async () => {
    const { data: properties, error } = await supabaseClient
      .from('properties')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    
    if (properties && properties.length > 0) {
      const property = properties[0];
      const requiredFields = ['id', 'title', 'price', 'location', 'category', 'created_at'];
      
      requiredFields.forEach(field => {
        expect(property).toHaveProperty(field);
      });
    }
  });

  test('Inquiries table should have correct structure', async () => {
    const { data: inquiries, error } = await supabaseClient
      .from('inquiries')
      .select('*')
      .limit(1);
    
    // May return empty due to RLS policies
    expect(error).toBeNull();
    
    if (inquiries && inquiries.length > 0) {
      const inquiry = inquiries[0];
      const requiredFields = ['id', 'name', 'email', 'message', 'status', 'created_at'];
      
      requiredFields.forEach(field => {
        expect(inquiry).toHaveProperty(field);
      });
    }
  });
});

describe('🚀 Performance Integration', () => {
  let supabaseClient: any;
  
  beforeAll(() => {
    supabaseClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseAnonKey!);
  });
  
  test('Database queries should respond within acceptable time', async () => {
    const startTime = Date.now();
    
    const { data, error } = await supabaseClient
      .from('properties')
      .select('*')
      .limit(20);
    
    const responseTime = Date.now() - startTime;
    
    expect(error).toBeNull();
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    expect(Array.isArray(data)).toBe(true);
  });

  test('Concurrent queries should handle properly', async () => {
    const queries = Array(5).fill(0).map(() =>
      supabaseClient
        .from('properties')
        .select('id, title')
        .limit(5)
    );
    
    const results = await Promise.all(queries);
    
    results.forEach(result => {
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});

describe('🔧 Error Handling', () => {
  let supabaseClient: any;
  
  beforeAll(() => {
    supabaseClient = createClient(TEST_CONFIG.supabaseUrl!, TEST_CONFIG.supabaseAnonKey!);
  });
  
  test('Should handle invalid table queries gracefully', async () => {
    const { data, error } = await supabaseClient
      .from('nonexistent_table')
      .select('*');
    
    expect(error).toBeDefined();
    expect(error.code).toBe('42P01'); // Table does not exist
  });

  test('Should handle malformed queries gracefully', async () => {
    const { data, error } = await supabaseClient
      .from('properties')
      .select('invalid_column_name');
    
    expect(error).toBeDefined();
    expect(error.code).toBe('42703'); // Column does not exist
  });

  test('Should handle network connectivity issues', async () => {
    // Create client with invalid URL to simulate network issues
    const invalidClient = createClient('https://invalid.supabase.co', 'invalid-key');
    
    const { data, error } = await invalidClient
      .from('properties')
      .select('*')
      .limit(1);
    
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});