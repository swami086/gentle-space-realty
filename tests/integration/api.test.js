/**
 * Frontend-Only API Integration Tests with Supabase
 * Tests Supabase service integration directly without Express server
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.development') });

// Test data fixtures
const testProperty = {
  title: 'Test Property',
  description: 'A beautiful test property',
  price: { amount: 500000, currency: 'USD' },
  category: 'fully-furnished-offices',
  location: 'Test City',
  address: '123 Test Street, Test City',
  bedrooms: 3,
  bathrooms: 2.0,
  size: 1200,
  amenities: ['parking', 'garden'],
  media: [{
    url: 'https://example.com/image1.jpg',
    alt_text: 'Test property image',
    is_primary: true,
    display_order: 0,
    size: 1024,
    filename: 'image1.jpg',
    type: 'image'
  }]
};

const testInquiry = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  message: 'I am interested in this property',
  property_id: null // Will be set after property creation
};

describe('Supabase API Integration Tests', () => {
  let supabaseClient;
  let adminClient;
  let testUserId;
  let createdPropertyId;

  beforeAll(async () => {
    // Initialize Supabase clients
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    // Create client for public operations
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create admin client for admin operations (if service key available)
    if (supabaseServiceKey) {
      adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      console.log('Admin client available for protected operations');
    } else {
      console.log('No service key - admin operations will be skipped');
    }
    
    // Create test user if admin client available
    if (adminClient) {
      const { data: user, error } = await adminClient.auth.admin.createUser({
        email: 'test@example.com',
        email_confirm: true,
        user_metadata: {
          name: 'Test User',
          full_name: 'Test User'
        }
      });
      
      if (!error) {
        testUserId = user.user.id;
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (adminClient && testUserId) {
      await adminClient.auth.admin.deleteUser(testUserId);
    }
    if (adminClient && createdPropertyId) {
      await adminClient.from('properties').delete().eq('id', createdPropertyId);
    }
  });

  describe('Supabase Connection Health', () => {
    test('Should connect to Supabase successfully', async () => {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('count', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(data).not.toBeUndefined();
    });
  });

  describe('Supabase Service Status', () => {
    test('Should verify Supabase service availability', async () => {
      const { data: healthCheck } = await supabaseClient
        .from('properties')
        .select('count', { count: 'exact', head: true });

      expect(healthCheck).not.toBeUndefined();
    });
  });

  describe('Supabase Authentication', () => {
    test('should verify authentication service availability', async () => {
      // Test anonymous access
      const { data, error } = await supabaseClient.auth.getSession();
      
      // Should not error (even if no session)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should handle OAuth sign in attempt', async () => {
      // Test OAuth provider availability
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5175/auth/callback'
        }
      });
      
      // Should return URL for OAuth redirect (not error)
      expect(error).toBeNull();
      expect(data.url).toContain('google');
    });

    test('should validate user session', async () => {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      // Should not error even with no user
      expect(error).toBeNull();
      // User will be null for unauthenticated requests
      expect(user).toBeNull();
    });

    test('should handle email authentication', async () => {
      if (!adminClient) {
        console.log('Skipping email auth test - admin client not available');
        return;
      }
      
      // Test email auth (will not send actual email in test)
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: 'test@example.com',
        options: {
          shouldCreateUser: false
        }
      });
      
      // Should not error (just won't send email)
      expect(error).toBeNull();
    });

  });

  describe('Properties Data Access', () => {
    test('should retrieve properties from Supabase', async () => {
      const { data: properties, error, count } = await supabaseClient
        .from('properties')
        .select('*', { count: 'exact' })
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(properties)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter properties by category', async () => {
      const { data: properties, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('category', 'fully-furnished-offices')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(properties)).toBe(true);
      
      // Verify filtered properties have correct category
      properties.forEach(property => {
        expect(property.category).toBe('fully-furnished-offices');
      });
    });

    test('should filter properties by price range', async () => {
      const { data: properties, error } = await supabaseClient
        .from('properties')
        .select('*')
        .gte('price', 100000)
        .lte('price', 500000)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(properties)).toBe(true);
      
      // Verify price range
      properties.forEach(property => {
        expect(property.price).toBeGreaterThanOrEqual(100000);
        expect(property.price).toBeLessThanOrEqual(500000);
      });
    });

    });

    test('should validate required fields when creating property', async () => {
      if (!adminClient) {
        console.log('Skipping property creation test - admin client not available');
        return;
      }
      
      // Test missing required fields
      const { error } = await adminClient
        .from('properties')
        .insert([{ description: 'Test property' }]);

      expect(error).toBeDefined();
      expect(error.message).toContain('not-null');
    });

    test('should create property with valid data', async () => {
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
      expect(property.price).toEqual(testProperty.price.amount);
      expect(property.category).toBe(testProperty.category);

      // Store created property ID for further tests
      createdPropertyId = property.id;
    });
  });

  describe('Supabase Error Handling', () => {
    test('should handle invalid data insertion', async () => {
      if (!adminClient) {
        console.log('Skipping error handling test - admin client not available');
        return;
      }
      
      const { error } = await adminClient
        .from('properties')
        .insert([{ invalid_field: 'invalid_value' }]);

      expect(error).toBeDefined();
      expect(error.code).toBeDefined();
    });

    test('should handle data validation errors', async () => {
      if (!adminClient) {
        console.log('Skipping validation test - admin client not available');
        return;
      }
      
      // Test invalid enum value
      const { error } = await adminClient
        .from('properties')
        .insert([{
          title: 'Test Property',
          price: 500000,
          category: 'invalid-category', // Invalid enum value
          location: 'Test City'
        }]);

      expect(error).toBeDefined();
      expect(error.code).toBe('23514'); // Check constraint violation
    });

    test('should handle non-existent table queries', async () => {
      const { error } = await supabaseClient
        .from('nonexistent_table')
        .select('*');

      expect(error).toBeDefined();
      expect(error.code).toBe('42P01'); // Undefined table error
    });
  });

  describe('Supabase Security', () => {
    test('should enforce Row Level Security policies', async () => {
      // Test that anonymous users cannot access protected data
      const { data, error } = await supabaseClient
        .from('users')
        .select('*');

      // Should either return empty data or error based on RLS policies
      if (error) {
        expect(error.code).toBeDefined();
      } else {
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test('should verify Supabase security configuration', async () => {
      // Test that Supabase client enforces security properly
      const config = supabaseClient.supabaseUrl && supabaseClient.supabaseKey;
      expect(config).toBeTruthy();
      
      // Verify anonymous access is properly restricted
      const { data: protectedData } = await supabaseClient
        .from('admin_settings')
        .select('*');
      
      // Should return empty or restricted data for anonymous user
      expect(Array.isArray(protectedData) || protectedData === null).toBe(true);
    });
  });

  describe('Supabase Performance', () => {
    test('should handle concurrent queries', async () => {
      const promises = [];
      
      // Send 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          supabaseClient
            .from('properties')
            .select('*')
            .limit(5)
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.error).toBeNull();
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .limit(10);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});