/**
 * Supabase Test Helper
 * Provides utilities for testing with Supabase in frontend-only architecture
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Property, PropertyMedia, PropertyTag } from '../../../src/types/property';
import type { Testimonial } from '../../../src/types/testimonial';

export interface TestProperty {
  id?: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  category: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  amenities?: string[];
  features?: string[];
  status: string;
  coordinates?: { lat: number; lng: number };
}

export interface TestInquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id?: string | null;
  inquiry_type: 'general' | 'viewing' | 'purchase' | 'rental';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
}

export interface TestUser {
  id?: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role?: string;
  is_active?: boolean;
}

export class SupabaseTestHelper {
  public readonly anonClient: SupabaseClient;
  public readonly adminClient: SupabaseClient | null;
  private createdPropertyIds: string[] = [];
  private createdInquiryIds: string[] = [];
  private createdTagIds: string[] = [];
  private createdTestimonialIds: string[] = [];
  private createdUserIds: string[] = [];

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing. Please check your environment variables.');
    }

    // Create anonymous client (simulates frontend user)
    this.anonClient = createClient(supabaseUrl, supabaseAnonKey);

    // Create admin client if service key is available
    if (supabaseServiceKey) {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    } else {
      this.adminClient = null;
      console.warn('⚠️ No service key available - admin operations will be skipped in tests');
    }
  }

  // ======================
  // Connection & Health
  // ======================

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.anonClient
        .from('properties')
        .select('count', { count: 'exact', head: true });
      
      return !error;
    } catch {
      return false;
    }
  }

  async getServerHealth(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.testConnection();
      return { healthy: true };
    } catch (error: any) {
      return { 
        healthy: false, 
        message: error.message 
      };
    }
  }

  // ======================
  // Property Test Helpers
  // ======================

  async createTestProperty(propertyData: Partial<TestProperty> = {}): Promise<Property | null> {
    if (!this.adminClient) {
      console.log('Skipping property creation - no admin client available');
      return null;
    }

    const defaultProperty: TestProperty = {
      title: `Test Property ${Date.now()}`,
      description: 'Test property for integration testing',
      price: 150000,
      location: 'Test Location, Bengaluru',
      address: 'Test Address, Bengaluru',
      category: 'fully-furnished-offices',
      bedrooms: 2,
      bathrooms: 1,
      size: 1200,
      amenities: ['parking', 'wifi'],
      features: ['furnished'],
      status: 'available',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      ...propertyData
    };

    try {
      const { data, error } = await this.adminClient
        .from('properties')
        .insert([defaultProperty])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        this.createdPropertyIds.push(data.id);
        return data;
      }
    } catch (error: any) {
      console.log('Property creation failed:', error.message);
    }

    return null;
  }

  async createTestProperties(count: number): Promise<Property[]> {
    const properties: Property[] = [];
    
    for (let i = 0; i < count; i++) {
      const property = await this.createTestProperty({
        title: `Test Property ${i + 1} - ${Date.now()}`,
        price: 100000 + (i * 10000)
      });
      
      if (property) {
        properties.push(property);
      }
    }

    return properties;
  }

  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const { data, error } = await this.anonClient
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  async updateTestProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    if (!this.adminClient) return null;

    try {
      const { data, error } = await this.adminClient
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.log('Property update failed:', error.message);
      return null;
    }
  }

  // ======================
  // Inquiry Test Helpers
  // ======================

  async createTestInquiry(inquiryData: Partial<TestInquiry> = {}): Promise<TestInquiry | null> {
    const defaultInquiry: TestInquiry = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: '+91 9876543210',
      message: 'Test inquiry for integration testing',
      inquiry_type: 'general',
      priority: 'medium',
      ...inquiryData
    };

    try {
      const { data, error } = await this.anonClient
        .from('inquiries')
        .insert([defaultInquiry])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        this.createdInquiryIds.push(data.id);
        return data;
      }
    } catch (error: any) {
      console.log('Inquiry creation failed:', error.message);
    }

    return null;
  }

  async createTestInquiries(count: number, propertyId?: string): Promise<TestInquiry[]> {
    const inquiries: TestInquiry[] = [];
    
    for (let i = 0; i < count; i++) {
      const inquiry = await this.createTestInquiry({
        name: `Test User ${i + 1}`,
        email: `test${i + 1}@example.com`,
        property_id: propertyId,
        message: `Test inquiry ${i + 1} for integration testing`
      });
      
      if (inquiry) {
        inquiries.push(inquiry);
      }
    }

    return inquiries;
  }

  async getInquiryById(id: string): Promise<TestInquiry | null> {
    if (!this.adminClient) return null;

    try {
      const { data, error } = await this.adminClient
        .from('inquiries')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  // ======================
  // Tag Test Helpers
  // ======================

  async createTestTag(tagData: Partial<PropertyTag> = {}): Promise<PropertyTag | null> {
    if (!this.adminClient) {
      console.log('Skipping tag creation - no admin client available');
      return null;
    }

    const defaultTag = {
      name: `Test Tag ${Date.now()}`,
      description: 'Test tag for integration testing',
      color: '#3B82F6',
      text_color: '#FFFFFF',
      is_active: true,
      ...tagData
    };

    try {
      const { data, error } = await this.adminClient
        .from('property_tags')
        .insert([defaultTag])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        this.createdTagIds.push(data.id);
        return data;
      }
    } catch (error: any) {
      console.log('Tag creation failed:', error.message);
    }

    return null;
  }

  // ======================
  // User Test Helpers
  // ======================

  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser | null> {
    if (!this.adminClient) {
      console.log('Skipping user creation - no admin client available');
      return null;
    }

    const defaultUser: TestUser = {
      firebase_uid: `test-uid-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      full_name: `Test User ${Date.now()}`,
      role: 'user',
      is_active: true,
      ...userData
    };

    try {
      const { data, error } = await this.adminClient
        .from('users')
        .insert([defaultUser])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        this.createdUserIds.push(data.id);
        return data;
      }
    } catch (error: any) {
      console.log('User creation failed:', error.message);
    }

    return null;
  }

  // ======================
  // Authentication Helpers
  // ======================

  async testAnonymousAuth(): Promise<{ success: boolean; session: any }> {
    const { data, error } = await this.anonClient.auth.getSession();
    
    return {
      success: !error,
      session: data.session
    };
  }

  async testOAuthProvider(provider: 'google' | 'github' = 'google'): Promise<{ success: boolean; url?: string }> {
    try {
      const { data, error } = await this.anonClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'http://localhost:5174/auth/callback'
        }
      });

      return {
        success: !error,
        url: data?.url
      };
    } catch (error: any) {
      return {
        success: false
      };
    }
  }

  // ======================
  // RLS Policy Testing
  // ======================

  async testRLSPolicies(): Promise<{
    canReadProperties: boolean;
    canCreateInquiries: boolean;
    canReadInquiries: boolean;
    canUpdateInquiries: boolean;
  }> {
    const results = {
      canReadProperties: false,
      canCreateInquiries: false,
      canReadInquiries: false,
      canUpdateInquiries: false
    };

    // Test reading properties
    try {
      const { error } = await this.anonClient
        .from('properties')
        .select('id')
        .limit(1);
      results.canReadProperties = !error;
    } catch {
      results.canReadProperties = false;
    }

    // Test creating inquiries
    try {
      const testInquiry = {
        name: 'RLS Test User',
        email: 'rls@test.com',
        phone: '+91 1234567890',
        message: 'RLS test inquiry',
        inquiry_type: 'general' as const,
        priority: 'medium' as const
      };

      const { data, error } = await this.anonClient
        .from('inquiries')
        .insert([testInquiry])
        .select()
        .single();

      results.canCreateInquiries = !error;
      
      if (data) {
        this.createdInquiryIds.push(data.id);
      }
    } catch {
      results.canCreateInquiries = false;
    }

    // Test reading inquiries
    try {
      const { error } = await this.anonClient
        .from('inquiries')
        .select('id')
        .limit(1);
      results.canReadInquiries = !error;
    } catch {
      results.canReadInquiries = false;
    }

    // Test updating inquiries
    if (this.createdInquiryIds.length > 0) {
      try {
        const { error } = await this.anonClient
          .from('inquiries')
          .update({ priority: 'high' })
          .eq('id', this.createdInquiryIds[0]);
        results.canUpdateInquiries = !error;
      } catch {
        results.canUpdateInquiries = false;
      }
    }

    return results;
  }

  // ======================
  // Performance Testing
  // ======================

  async measureQueryPerformance(tableName: string, limit: number = 10): Promise<{
    responseTime: number;
    success: boolean;
    recordCount: number;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.anonClient
        .from(tableName)
        .select('*')
        .limit(limit);

      const responseTime = Date.now() - startTime;

      return {
        responseTime,
        success: !error,
        recordCount: data?.length || 0
      };
    } catch {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        recordCount: 0
      };
    }
  }

  async testConcurrentQueries(tableName: string, concurrency: number = 5): Promise<{
    averageResponseTime: number;
    successRate: number;
    totalQueries: number;
  }> {
    const startTime = Date.now();
    
    const queries = Array(concurrency).fill(0).map(() =>
      this.anonClient
        .from(tableName)
        .select('*')
        .limit(5)
    );

    const results = await Promise.allSettled(queries);
    const endTime = Date.now();

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const averageResponseTime = (endTime - startTime) / concurrency;
    const successRate = (successCount / concurrency) * 100;

    return {
      averageResponseTime,
      successRate,
      totalQueries: concurrency
    };
  }

  // ======================
  // Error Simulation
  // ======================

  async simulateNetworkError(): Promise<boolean> {
    try {
      // Create a client with invalid URL to simulate network issues
      const invalidClient = createClient('https://invalid.supabase.co', 'invalid-key');
      
      const { error } = await invalidClient
        .from('properties')
        .select('*')
        .limit(1);

      return !!error;
    } catch {
      return true;
    }
  }

  async testInvalidQueries(): Promise<{
    invalidTable: boolean;
    invalidColumn: boolean;
    malformedQuery: boolean;
  }> {
    const results = {
      invalidTable: false,
      invalidColumn: false,
      malformedQuery: false
    };

    // Test invalid table
    try {
      const { error } = await this.anonClient
        .from('nonexistent_table')
        .select('*');
      results.invalidTable = !!error;
    } catch {
      results.invalidTable = true;
    }

    // Test invalid column
    try {
      const { error } = await this.anonClient
        .from('properties')
        .select('nonexistent_column');
      results.invalidColumn = !!error;
    } catch {
      results.invalidColumn = true;
    }

    // Test malformed query
    try {
      const { error } = await this.anonClient
        .from('properties')
        .select('*')
        .eq('id', 'invalid-uuid-format');
      results.malformedQuery = !!error;
    } catch {
      results.malformedQuery = true;
    }

    return results;
  }

  // ======================
  // Cleanup Methods
  // ======================

  async cleanupTestData(): Promise<void> {
    if (!this.adminClient) {
      console.log('Skipping cleanup - no admin client available');
      return;
    }

    console.log('🧹 Cleaning up test data...');

    // Cleanup inquiries
    if (this.createdInquiryIds.length > 0) {
      await this.adminClient
        .from('inquiries')
        .delete()
        .in('id', this.createdInquiryIds);
      console.log(`Cleaned up ${this.createdInquiryIds.length} test inquiries`);
    }

    // Cleanup tags
    if (this.createdTagIds.length > 0) {
      await this.adminClient
        .from('property_tags')
        .delete()
        .in('id', this.createdTagIds);
      console.log(`Cleaned up ${this.createdTagIds.length} test tags`);
    }

    // Cleanup properties
    if (this.createdPropertyIds.length > 0) {
      await this.adminClient
        .from('properties')
        .delete()
        .in('id', this.createdPropertyIds);
      console.log(`Cleaned up ${this.createdPropertyIds.length} test properties`);
    }

    // Cleanup users
    if (this.createdUserIds.length > 0) {
      await this.adminClient
        .from('users')
        .delete()
        .in('id', this.createdUserIds);
      console.log(`Cleaned up ${this.createdUserIds.length} test users`);
    }

    // Clear tracking arrays
    this.createdPropertyIds = [];
    this.createdInquiryIds = [];
    this.createdTagIds = [];
    this.createdTestimonialIds = [];
    this.createdUserIds = [];

    console.log('✅ Cleanup completed');
  }

  async cleanupAllTestData(): Promise<void> {
    if (!this.adminClient) {
      console.log('Skipping cleanup - no admin client available');
      return;
    }

    console.log('🧹 Cleaning up ALL test data...');

    // Delete all test data (be careful with this in production!)
    const tables = ['inquiries', 'property_tags', 'properties', 'users'];
    
    for (const table of tables) {
      try {
        const { error } = await this.adminClient
          .from(table)
          .delete()
          .like('name', 'Test%')
          .or('title.like.Test%,email.like.test%');
        
        if (error) {
          console.log(`Warning: Could not clean up ${table}:`, error.message);
        }
      } catch (error: any) {
        console.log(`Error cleaning up ${table}:`, error.message);
      }
    }

    console.log('✅ Cleanup completed');
  }

  // ======================
  // Validation Helpers
  // ======================

  async validateDatabaseSchema(): Promise<{
    hasRequiredTables: boolean;
    missingTables: string[];
  }> {
    const requiredTables = ['properties', 'inquiries', 'property_tags', 'testimonials'];
    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await this.anonClient
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          missingTables.push(table);
        }
      } catch {
        missingTables.push(table);
      }
    }

    return {
      hasRequiredTables: missingTables.length === 0,
      missingTables
    };
  }

  async getTableRowCounts(): Promise<Record<string, number>> {
    const tables = ['properties', 'inquiries', 'property_tags', 'testimonials'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const { count, error } = await this.anonClient
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        counts[table] = error ? -1 : (count || 0);
      } catch {
        counts[table] = -1;
      }
    }

    return counts;
  }
}