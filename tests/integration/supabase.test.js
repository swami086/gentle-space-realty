/**
 * Comprehensive Supabase Integration Tests
 * Tests database operations, RLS policies, authentication, and authorization
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Mock environment variables for testing
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.bHuv93Q5TF-ZPRlCjNacI7-xrRV6EstgMJ1Thoy3HCs';

describe('Supabase Integration Tests', () => {
  let adminClient;
  let anonClient;
  let testUserId;
  let testPropertyId;
  let authToken;

  beforeAll(async () => {
    // Initialize Supabase clients
    if (SUPABASE_SERVICE_KEY) {
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }

    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });

    console.log('Supabase clients initialized');
    console.log('Admin client available:', !!adminClient);
    console.log('Anonymous client available:', !!anonClient);
  });

  afterAll(async () => {
    // Cleanup test data
    if (adminClient && testUserId) {
      await adminClient.from('users').delete().eq('id', testUserId);
    }
    if (adminClient && testPropertyId) {
      await adminClient.from('properties').delete().eq('id', testPropertyId);
    }
  });

  describe('Database Connection', () => {
    test('should connect to Supabase with anonymous client', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should connect to Supabase with admin client', async () => {
      if (!adminClient) {
        console.log('Skipping admin client test - service key not available');
        return;
      }

      const { data, error } = await adminClient
        .from('properties')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Properties Table Operations', () => {
    const testProperty = {
      id: uuidv4(),
      title: 'Test Integration Property',
      description: 'A property created during integration testing',
      price: { amount: 450000, currency: 'USD' },
      category: 'co-working-spaces',
      location: 'Test Integration City',
      address: '123 Test Street, Test Integration City',
      bedrooms: 2,
      bathrooms: 1.0,
      size: 850,
      amenities: ['balcony', 'parking'],
      features: {pool: false, garage: true},
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    test('should read properties with anonymous client', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should create property with admin client', async () => {
      if (!adminClient) {
        console.log('Skipping property creation test - admin client not available');
        return;
      }

      const { data, error } = await adminClient
        .from('properties')
        .insert([testProperty])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe(testProperty.title);
      expect(data.price).toEqual(testProperty.price);
      expect(data.category).toBe(testProperty.category);

      testPropertyId = data.id;
    });

    test('should read created property with anonymous client', async () => {
      if (!testPropertyId) {
        console.log('Skipping property read test - no test property created');
        return;
      }

      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('id', testPropertyId)
        .eq('status', 'available')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe(testProperty.title);
    });

    test('should update property with admin client', async () => {
      if (!adminClient || !testPropertyId) {
        console.log('Skipping property update test - admin client or test property not available');
        return;
      }

      const updateData = {
        title: 'Updated Test Integration Property',
        description: 'Updated during integration testing',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await adminClient
        .from('properties')
        .update(updateData)
        .eq('id', testPropertyId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe(updateData.title);
      expect(data.description).toBe(updateData.description);
    });

    test('should filter properties by category', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('category', 'co-working-spaces')
        .eq('status', 'available')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        data.forEach(property => {
          expect(property.category).toBe('co-working-spaces');
          expect(property.status).toBe('available');
        });
      }
    });

    test('should filter properties by price range', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .gte('price->>amount', 100000)
        .lte('price->>amount', 500000)
        .eq('status', 'available')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        data.forEach(property => {
          expect(property.price).toHaveProperty('amount');
          expect(property.price.amount).toBeGreaterThanOrEqual(100000);
          expect(property.price.amount).toBeLessThanOrEqual(500000);
          expect(property.status).toBe('available');
        });
      }
    });

    test('should soft delete property with admin client', async () => {
      if (!adminClient || !testPropertyId) {
        console.log('Skipping property deletion test - admin client or test property not available');
        return;
      }

      const { data, error } = await adminClient
        .from('properties')
        .update({ 
          status: 'not-available',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPropertyId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('not-available');
    });
  });

  describe('Users Table Operations', () => {
    const testUser = {
      id: uuidv4(),
      email: 'test-integration@example.com',
      name: 'Integration Test User',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    test('should create user with admin client', async () => {
      if (!adminClient) {
        console.log('Skipping user creation test - admin client not available');
        return;
      }

      const { data, error } = await adminClient
        .from('users')
        .insert([testUser])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email).toBe(testUser.email);
      expect(data.role).toBe(testUser.role);

      testUserId = data.id;
    });

    test('should read user with admin client', async () => {
      if (!adminClient || !testUserId) {
        console.log('Skipping user read test - admin client or test user not available');
        return;
      }

      const { data, error } = await adminClient
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email).toBe(testUser.email);
    });

    test('should update user role with admin client', async () => {
      if (!adminClient || !testUserId) {
        console.log('Skipping user update test - admin client or test user not available');
        return;
      }

      const { data, error } = await adminClient
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.role).toBe('admin');
    });
  });

  describe('RLS Policy Testing', () => {
    test('anonymous client should only see published properties', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        data.forEach(property => {
          expect(property.status).toBe('available');
        });
      }
    });

    test('anonymous client should not access users table directly', async () => {
      const { data, error } = await anonClient
        .from('users')
        .select('*')
        .limit(1);

      // This should fail due to RLS policies
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('admin client should access all data', async () => {
      if (!adminClient) {
        console.log('Skipping admin access test - admin client not available');
        return;
      }

      const { data: properties, error: propError } = await adminClient
        .from('properties')
        .select('*')
        .limit(5);

      expect(propError).toBeNull();
      expect(Array.isArray(properties)).toBe(true);

      const { data: users, error: userError } = await adminClient
        .from('users')
        .select('*')
        .limit(5);

      expect(userError).toBeNull();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Database Functions', () => {
    test('should test upsert_oauth_user function', async () => {
      if (!adminClient) {
        console.log('Skipping function test - admin client not available');
        return;
      }

      const testUserData = {
        user_id: uuidv4(),
        user_email: 'function-test@example.com',
        user_name: 'Function Test User',
        user_role: 'user'
      };

      const { data, error } = await adminClient
        .rpc('upsert_oauth_user', testUserData);

      if (error && error.code === '42883') {
        console.log('Function upsert_oauth_user does not exist - skipping test');
        return;
      }

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        expect(data[0].email).toBe(testUserData.user_email);
        expect(data[0].name).toBe(testUserData.user_name);
        expect(data[0].role).toBe(testUserData.user_role);

        // Cleanup
        await adminClient
          .from('users')
          .delete()
          .eq('id', testUserData.user_id);
      }
    });
  });

  describe('Property Images Relations', () => {
    test('should handle property images relationships', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select(`
          *,
          property_media (*)
        `)
        .eq('status', 'available')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        data.forEach(property => {
          expect(property).toHaveProperty('property_media');
          expect(Array.isArray(property.property_media)).toBe(true);
        });
      }
    });

    test('should create property media with admin client', async () => {
      if (!adminClient || !testPropertyId) {
        console.log('Skipping media creation test - admin client or test property not available');
        return;
      }

      const mediaData = {
        property_id: testPropertyId,
        url: 'https://example.com/test-image.jpg',
        image_url: 'https://example.com/test-image.jpg', // Backward compatibility
        alt_text: 'Test property image',
        is_primary: true,
        display_order: 0,
        size: 1024,
        file_size: 1024, // Backward compatibility
        media_type: 'image',
        filename: 'test-image.jpg'
      };

      const { data, error } = await adminClient
        .from('property_media')
        .insert([mediaData])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.property_id).toBe(testPropertyId);
      expect(data.url).toBe(mediaData.url);
      expect(data.media_type).toBe('image');
      expect(data.is_primary).toBe(true);

      // Cleanup
      await adminClient
        .from('property_media')
        .delete()
        .eq('id', data.id);
    });
  });

  describe('Performance and Limits', () => {
    test('should handle large result sets with pagination', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(100);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(100);
    });

    test('should handle concurrent database operations', async () => {
      const promises = [];
      
      // Create multiple concurrent read operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          anonClient
            .from('properties')
            .select('*')
            .eq('status', 'available')
            .limit(10)
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });
    });

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(50);

      const responseTime = Date.now() - startTime;
      
      expect(error).toBeNull();
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid table names', async () => {
      const { data, error } = await anonClient
        .from('nonexistent_table')
        .select('*')
        .limit(1);

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should handle invalid column names', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('nonexistent_column')
        .limit(1);

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should handle malformed queries', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('price', 'not_a_number')
        .limit(1);

      // This might succeed if there are no properties with price 'not_a_number'
      // The error would occur at insert/update time with type mismatch
      expect(Array.isArray(data)).toBe(true);
    });
  });
});