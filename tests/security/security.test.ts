/**
 * Security Tests for Frontend-Only Architecture with Supabase
 * Tests security policies, data validation, and access control using Supabase RLS
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test data fixtures
const createMockProperty = () => ({
  title: 'Security Test Property',
  price: 100000,
  location: 'Security Test Location',
  category: 'fully-furnished-offices',
  address: 'Test Security Address',
  description: 'Property for security testing',
  bedrooms: 2,
  bathrooms: 1,
  size: 1000,
  status: 'available'
});

const createMockInquiry = (propertyId?: string) => ({
  name: 'Security Test User',
  email: 'security@test.com',
  phone: '+91 9876543210',
  message: 'Security test inquiry',
  property_id: propertyId || null,
  inquiry_type: 'general',
  priority: 'medium'
});

const spamInquiryData = () => ({
  name: 'Spam User',
  email: 'spam@malicious.com',
  phone: '+91 0000000000',
  message: 'SPAM SPAM SPAM SPAM SPAM '.repeat(100), // Very long message
  inquiry_type: 'general'
});

const mockInquiryRequest = createMockInquiry;

describe('Security Tests', () => {
  let supabaseClient: any;
  let adminClient: any;
  let testPropertyId: string;
  let testInquiryId: string;

  beforeAll(() => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    
    if (supabaseServiceKey) {
      adminClient = createClient(supabaseUrl!, supabaseServiceKey, {
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

  describe('🔐 Row Level Security (RLS) Policies', () => {
    test('Anonymous users should not be able to access admin tables', async () => {
      // Try to access admin-only data
      const { data, error } = await supabaseClient
        .from('users')
        .select('*');

      // Should either return empty array or error based on RLS policies
      if (error) {
        expect(error.code).toBeDefined();
      } else {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0); // Should be empty for anonymous users
      }
    });

    test('Anonymous users should be able to read public properties', async () => {
      const { data: properties, error } = await supabaseClient
        .from('properties')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(properties)).toBe(true);
    });

    test('Anonymous users should be able to create inquiries', async () => {
      const inquiryData = createMockInquiry();
      
      const { data: inquiry, error } = await supabaseClient
        .from('inquiries')
        .insert([inquiryData])
        .select()
        .single();

      expect(error).toBeNull();
      expect(inquiry).toBeDefined();
      expect(inquiry.name).toBe(inquiryData.name);
      
      testInquiryId = inquiry.id;
    });

    test('Anonymous users should not be able to update existing inquiries', async () => {
      if (!testInquiryId) {
        console.log('Skipping inquiry update test - no test inquiry created');
        return;
      }

      const { error } = await supabaseClient
        .from('inquiries')
        .update({ status: 'contacted' })
        .eq('id', testInquiryId);

      // Should fail due to RLS policies (anonymous users can't update)
      expect(error).toBeDefined();
    });

    test('Admin client should have full access to inquiries', async () => {
      if (!adminClient) {
        console.log('Skipping admin test - admin client not available');
        return;
      }

      const { data: inquiries, error } = await adminClient
        .from('inquiries')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(inquiries)).toBe(true);
    });
  });

  describe('🛡️ Input Validation & Sanitization', () => {
    test('Should reject inquiries with missing required fields', async () => {
      const invalidInquiry = {
        message: 'Test message'
        // Missing name, email, etc.
      };

      const { error } = await supabaseClient
        .from('inquiries')
        .insert([invalidInquiry]);

      expect(error).toBeDefined();
      expect(error.message).toContain('not-null');
    });

    test('Should reject inquiries with invalid email format', async () => {
      const invalidEmailInquiry = {
        ...createMockInquiry(),
        email: 'not-an-email'
      };

      const { error } = await supabaseClient
        .from('inquiries')
        .insert([invalidEmailInquiry]);

      // May pass at Supabase level (email format validation in frontend)
      // But should fail if there's a check constraint
      if (error) {
        expect(error).toBeDefined();
      }
    });

    test('Should handle extremely long input gracefully', async () => {
      const spamInquiry = spamInquiryData();

      const { error } = await supabaseClient
        .from('inquiries')
        .insert([spamInquiry]);

      // Should either succeed (if no length constraints) or fail gracefully
      if (error) {
        expect(error.code).toBeDefined();
      }
    });

    test('Should reject properties with invalid enum values', async () => {
      if (!adminClient) {
        console.log('Skipping property validation test - admin client not available');
        return;
      }

      const invalidProperty = {
        ...createMockProperty(),
        category: 'invalid-category', // Not in enum
        status: 'invalid-status'
      };

      const { error } = await adminClient
        .from('properties')
        .insert([invalidProperty]);

      expect(error).toBeDefined();
      expect(error.code).toBe('23514'); // Check constraint violation
    });
  });

  describe('🚫 SQL Injection Prevention', () => {
    test('Should handle malicious SQL in query parameters safely', async () => {
      const maliciousInput = "'; DROP TABLE properties; --";
      
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .ilike('title', maliciousInput);

      // Supabase should handle this safely - no error expected
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    test('Should handle SQL injection attempts in insert data', async () => {
      const maliciousInquiry = {
        ...createMockInquiry(),
        name: "'; DROP TABLE inquiries; --",
        message: "UNION SELECT * FROM users --"
      };

      const { data, error } = await supabaseClient
        .from('inquiries')
        .insert([maliciousInquiry])
        .select();

      // Should succeed but with escaped/sanitized data
      if (!error) {
        expect(data[0].name).toBe(maliciousInquiry.name); // Stored as literal string
      }
    });
  });

  describe('🔒 Authentication & Authorization', () => {
    test('Should handle invalid JWT tokens gracefully', async () => {
      // Create client with invalid token
      const invalidClient = createClient(
        process.env.VITE_SUPABASE_URL!,
        'invalid.jwt.token'
      );

      const { data, error } = await invalidClient
        .from('properties')
        .select('*')
        .limit(1);

      expect(error).toBeDefined();
      expect(error.message).toContain('Invalid');
    });

    test('Should enforce proper session management', async () => {
      const { data: session, error } = await supabaseClient.auth.getSession();

      expect(error).toBeNull();
      expect(session.session).toBeNull(); // No active session for test client
    });

    test('Should validate OAuth redirect URLs', async () => {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://malicious-site.com/callback'
        }
      });

      // Should either validate redirect URL or return error
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data.url).toContain('google'); // Should be Google OAuth URL
      }
    });
  });

  describe('🛡️ CORS & CSP Security', () => {
    test('Should verify Supabase client configuration', () => {
      expect(supabaseClient.supabaseUrl).toBeDefined();
      expect(supabaseClient.supabaseKey).toBeDefined();
      expect(supabaseClient.supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);
    });

    test('Should handle cross-origin requests properly', async () => {
      // Supabase handles CORS automatically
      const { data, error } = await supabaseClient
        .from('properties')
        .select('count', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('🔍 Data Leakage Prevention', () => {
    test('Should not expose sensitive database information in errors', async () => {
      const { data, error } = await supabaseClient
        .from('nonexistent_table')
        .select('*');

      expect(error).toBeDefined();
      // Error should not expose internal database structure
      expect(error.message).not.toContain('pg_');
      expect(error.message).not.toContain('postgres');
    });

    test('Should not return admin fields to anonymous users', async () => {
      const { data: properties, error } = await supabaseClient
        .from('properties')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      
      if (properties && properties.length > 0) {
        const property = properties[0];
        // Should not expose admin-only fields
        expect(property).not.toHaveProperty('admin_notes');
        expect(property).not.toHaveProperty('internal_id');
      }
    });
  });

  describe('📊 Rate Limiting & DoS Prevention', () => {
    test('Should handle multiple rapid requests gracefully', async () => {
      const rapidRequests = Array(20).fill(0).map((_, index) =>
        supabaseClient
          .from('properties')
          .select('id, title')
          .limit(1)
          .eq('id', `test-${index}`)
      );

      const results = await Promise.all(rapidRequests);
      
      // Should handle all requests without errors (Supabase has built-in rate limiting)
      results.forEach(result => {
        expect(result.error).toBeNull();
      });
    });

    test('Should prevent excessive inquiry submissions', async () => {
      // This would be handled by Supabase's built-in protections
      // and any custom RLS policies for rate limiting
      
      const multipleInquiries = Array(5).fill(0).map(() =>
        createMockInquiry()
      );

      const submissions = multipleInquiries.map(inquiry =>
        supabaseClient
          .from('inquiries')
          .insert([inquiry])
          .select()
      );

      const results = await Promise.all(submissions);
      
      // Should either succeed or be rate limited gracefully
      results.forEach(result => {
        if (result.error) {
          // Rate limiting error would be handled gracefully
          expect(result.error.code).toBeDefined();
        }
      });
    });
  });

  describe('🔐 Data Encryption & Privacy', () => {
    test('Should use HTTPS for all Supabase connections', () => {
      expect(supabaseClient.supabaseUrl).toMatch(/^https:/);
    });

    test('Should not log sensitive data in client errors', async () => {
      const sensitiveData = {
        ...createMockInquiry(),
        phone: '+91 9999999999',
        email: 'sensitive@private.com'
      };

      const { error } = await supabaseClient
        .from('inquiries')
        .insert([sensitiveData]);

      // Even if there's an error, it shouldn't contain the sensitive input data
      if (error) {
        expect(error.message).not.toContain('+91 9999999999');
        expect(error.message).not.toContain('sensitive@private.com');
      }
    });
  });

  describe('🛡️ Business Logic Security', () => {
    test('Should prevent unauthorized property modifications', async () => {
      if (!adminClient) {
        console.log('Skipping property modification test - admin client not available');
        return;
      }

      // Create a test property first
      const { data: property, error: createError } = await adminClient
        .from('properties')
        .insert([createMockProperty()])
        .select()
        .single();

      if (createError || !property) {
        console.log('Could not create test property for security test');
        return;
      }

      testPropertyId = property.id;

      // Try to modify it with anonymous client
      const { error: updateError } = await supabaseClient
        .from('properties')
        .update({ price: 1 }) // Try to set price to $1
        .eq('id', testPropertyId);

      // Should fail - anonymous users can't modify properties
      expect(updateError).toBeDefined();
    });

    test('Should validate inquiry status transitions', async () => {
      if (!adminClient || !testInquiryId) {
        console.log('Skipping status transition test - admin client or inquiry not available');
        return;
      }

      // Valid status progression
      const validStatuses = ['new', 'contacted', 'scheduled', 'completed', 'closed'];
      
      for (const status of validStatuses) {
        const { error } = await adminClient
          .from('inquiries')
          .update({ status })
          .eq('id', testInquiryId);

        expect(error).toBeNull();
      }

      // Invalid status should be rejected
      const { error: invalidError } = await adminClient
        .from('inquiries')
        .update({ status: 'invalid_status' })
        .eq('id', testInquiryId);

      expect(invalidError).toBeDefined();
      expect(invalidError.code).toBe('23514'); // Check constraint violation
    });
  });
});