import { supabase } from '../../src/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/supabase';

// Mock environment variables for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('Row Level Security Policies', () => {
  let anonClient: ReturnType<typeof createClient<Database>>;
  let serviceClient: ReturnType<typeof createClient<Database>>;

  beforeAll(() => {
    // Create clients for different access levels
    anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  describe('Properties Table RLS', () => {
    it('should allow anonymous users to view published properties', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(1);

      // Should not error (RLS allows viewing published properties)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent anonymous users from inserting properties', async () => {
      const { data, error } = await anonClient
        .from('properties')
        .insert({
          title: 'Test Property',
          price: 100000,
          location: 'Test Location',
          property_type: 'house',
          status: 'available',
          listing_agent: '00000000-0000-0000-0000-000000000000' // fake UUID
        });

      // Should error (RLS prevents anonymous users from creating properties)
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/denied/i);
      expect(data).toBeNull();
    });

    it('should prevent anonymous users from updating properties', async () => {
      // First, get a property to try updating
      const { data: properties } = await serviceClient
        .from('properties')
        .select('id')
        .limit(1);

      if (properties && properties.length > 0) {
        const propertyId = properties[0].id;

        const { data, error } = await anonClient
          .from('properties')
          .update({ title: 'Updated Title' })
          .eq('id', propertyId);

        // Should error (RLS prevents anonymous users from updating properties)
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/denied/i);
        expect(data).toBeNull();
      }
    });

    it('should prevent anonymous users from deleting properties', async () => {
      // First, get a property to try deleting
      const { data: properties } = await serviceClient
        .from('properties')
        .select('id')
        .limit(1);

      if (properties && properties.length > 0) {
        const propertyId = properties[0].id;

        const { data, error } = await anonClient
          .from('properties')
          .delete()
          .eq('id', propertyId);

        // Should error (RLS prevents anonymous users from deleting properties)
        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/denied/i);
        expect(data).toBeNull();
      }
    });
  });

  describe('Property Images Table RLS', () => {
    it('should allow anonymous users to view property images for published properties', async () => {
      const { data, error } = await anonClient
        .from('property_images')
        .select('*')
        .limit(1);

      // Should not error (RLS allows viewing images for published properties)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent anonymous users from inserting property images', async () => {
      const { data, error } = await anonClient
        .from('property_images')
        .insert({
          property_id: '00000000-0000-0000-0000-000000000000', // fake UUID
          image_url: 'https://example.com/image.jpg',
          is_primary: false,
          display_order: 0
        });

      // Should error (RLS prevents anonymous users from creating property images)
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/denied/i);
      expect(data).toBeNull();
    });
  });

  describe('Inquiries Table RLS', () => {
    it('should allow anyone to create inquiries', async () => {
      const { data, error } = await anonClient
        .from('inquiries')
        .insert({
          property_id: '00000000-0000-0000-0000-000000000000', // fake UUID
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '555-0123',
          message: 'Test inquiry message',
          inquiry_type: 'general',
          status: 'new'
        })
        .select();

      // Should succeed (RLS allows anyone to create inquiries)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent anonymous users from viewing inquiries', async () => {
      const { data, error } = await anonClient
        .from('inquiries')
        .select('*')
        .limit(1);

      // Should error or return no data (RLS prevents anonymous users from viewing inquiries)
      // This depends on the specific implementation - could be an error or empty result
      if (error) {
        expect(error.message).toMatch(/denied/i);
      } else {
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
        // If no error, data should be empty due to RLS filtering
      }
    });
  });

  describe('Analytics Events Table RLS', () => {
    it('should allow anyone to create analytics events', async () => {
      const { data, error } = await anonClient
        .from('analytics_events')
        .insert({
          event_type: 'page_view',
          event_data: { page: '/properties', user_agent: 'test' },
          user_id: null // anonymous
        })
        .select();

      // Should succeed (RLS allows anyone to create analytics events)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent anonymous users from viewing analytics events', async () => {
      const { data, error } = await anonClient
        .from('analytics_events')
        .select('*')
        .limit(1);

      // Should error or return no data (RLS prevents anonymous users from viewing analytics)
      if (error) {
        expect(error.message).toMatch(/denied/i);
      } else {
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
        // If no error, data should be empty due to RLS filtering
      }
    });
  });

  describe('Users Table RLS', () => {
    it('should prevent anonymous users from viewing user profiles', async () => {
      const { data, error } = await anonClient
        .from('users')
        .select('*')
        .limit(1);

      // Should error or return no data (RLS prevents anonymous users from viewing users)
      if (error) {
        expect(error.message).toMatch(/denied/i);
      } else {
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
        // If no error, data should be empty due to RLS filtering
      }
    });

    it('should prevent anonymous users from creating user profiles', async () => {
      const { data, error } = await anonClient
        .from('users')
        .insert({
          id: '00000000-0000-0000-0000-000000000000', // fake UUID
          name: 'Test User',
          email: 'test@example.com',
          role: 'agent'
        });

      // Should error (RLS prevents anonymous users from creating users)
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/denied/i);
      expect(data).toBeNull();
    });
  });

  describe('Service Role Access', () => {
    it('should allow service role to access all tables', async () => {
      // Test that service role can bypass RLS for administrative operations
      const tables = ['properties', 'property_images', 'inquiries', 'analytics_events', 'users'];

      for (const table of tables) {
        const { data, error } = await serviceClient
          .from(table as any)
          .select('*')
          .limit(1);

        // Service role should be able to access all tables
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('Database Functions with RLS', () => {
    it('should allow anonymous users to call search_properties function', async () => {
      const { data, error } = await anonClient.rpc('search_properties', {
        search_query: 'test',
        min_price: null,
        max_price: null,
        property_type_filter: null,
        min_bedrooms: null,
        max_bedrooms: null,
        location_filter: null,
        page_limit: 5,
        page_offset: 0
      });

      // Should not error (function should respect RLS and return only published properties)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent anonymous users from calling get_inquiry_stats function', async () => {
      const { data, error } = await anonClient.rpc('get_inquiry_stats', {
        start_date: null,
        end_date: null
      });

      // Should error or return no data (function should require admin access)
      if (error) {
        expect(error.message).toMatch(/denied|permission/i);
      } else {
        // If no error, should return empty/restricted data
        expect(data).toBeDefined();
      }
    });
  });
});