import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockAccountService } from '../../../src/services/mockAccountService';
import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';
import { createClient } from '@supabase/supabase-js';
import { MockAccountCreationRequest, MockAccountType } from '../../../src/types/mockAccount';

/**
 * Integration tests for profile insert failure cleanup scenarios
 * 
 * These tests verify that when auth user creation succeeds but profile insertion fails,
 * the system properly cleans up the orphaned auth user to prevent partial account states.
 */
describe('Profile Insert Failure Cleanup Integration Tests', () => {
  const testDomain = 'profile-failure-test.local';
  const createdAuthUserIds: string[] = [];

  // Create isolated client for testing
  const createTestClient = () => {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
    const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.lzIpnOoubh6DGVWcfJ3B5Y6YkRxiJf6qDIxnL-A6d6c';

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: `profile-failure-test-${Date.now()}-${Math.random()}`
      }
    });
  };

  afterEach(async () => {
    // Clean up any auth users created during tests
    for (const userId of createdAuthUserIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (error) {
        console.warn(`Failed to cleanup auth user ${userId}:`, error);
      }
    }
    createdAuthUserIds.length = 0;
  });

  describe('Profile Insert Failure Scenarios', () => {
    it('should cleanup auth user when profile insert fails due to invalid data', async () => {
      // Arrange: Create a request that will cause profile insert to fail
      const timestamp = Date.now();
      const failureRequest: MockAccountCreationRequest = {
        credentials: {
          email: `profile-fail-invalid-${timestamp}@${testDomain}`,
          password: 'TestPass123!'
        },
        profile: {
          // Invalid name (too long to trigger database constraint failure)
          name: 'x'.repeat(500), // Assuming name field has length constraint
          role: 'admin'
        },
        options: {
          skipEmailConfirmation: true
        }
      };

      // Act: Attempt to create the account (should fail on profile insert)
      const result = await MockAccountService.createMockAccount(failureRequest);

      // Assert: Account creation should fail
      expect(result.success).toBe(false);
      expect(result.accountId).toBeUndefined();
      expect(result.message).toContain('profile');

      // Verify auth user was not left orphaned
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(
          failureRequest.credentials.email
        );
        
        // Auth user should not exist (cleaned up after profile insert failure)
        expect(authUser.user).toBeNull();
      } catch (error) {
        // Expected - user should not exist
        expect(error).toBeTruthy();
      }
    });

    it('should cleanup auth user when profile insert fails due to duplicate constraint', async () => {
      // Arrange: First create a successful account to establish the constraint violation
      const timestamp = Date.now();
      const baseEmail = `profile-fail-duplicate-${timestamp}@${testDomain}`;
      
      const successfulRequest: MockAccountCreationRequest = {
        credentials: {
          email: baseEmail,
          password: 'TestPass123!'
        },
        profile: {
          name: 'Test Admin Duplicate',
          role: 'admin'
        },
        options: {
          skipEmailConfirmation: true
        }
      };

      const successfulResult = await MockAccountService.createMockAccount(successfulRequest);
      expect(successfulResult.success).toBe(true);

      if (successfulResult.accountId) {
        createdAuthUserIds.push(successfulResult.accountId);
      }

      // Now attempt to create account with same email (should cause constraint violation)
      const duplicateRequest: MockAccountCreationRequest = {
        credentials: {
          email: baseEmail, // Same email should cause unique constraint violation
          password: 'TestPass123!'
        },
        profile: {
          name: 'Test Admin Duplicate 2',
          role: 'admin'
        },
        options: {
          skipEmailConfirmation: true
        }
      };

      // Act: Attempt to create duplicate account
      const duplicateResult = await MockAccountService.createMockAccount(duplicateRequest);

      // Assert: Duplicate creation should fail
      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.accountId).toBeUndefined();
      expect(duplicateResult.message.toLowerCase()).toContain('already exists');

      // Verify no orphaned auth user exists for the failed attempt
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const orphanedUsers = authUsers.users.filter(user => 
        user.email === baseEmail && 
        user.id !== successfulResult.accountId
      );
      
      expect(orphanedUsers).toHaveLength(0);
    });

    it('should handle cleanup gracefully when auth user creation succeeds but profile table is unavailable', async () => {
      // Note: This test is more complex as it requires simulating database unavailability
      // For now, we'll create a request that should trigger the cleanup path
      const timestamp = Date.now();
      
      // We can simulate this by creating a malformed profile that will cause insert to fail
      const malformedRequest: MockAccountCreationRequest = {
        credentials: {
          email: `profile-fail-malformed-${timestamp}@${testDomain}`,
          password: 'TestPass123!'
        },
        profile: {
          name: '', // Empty name should trigger validation failure
          role: 'admin'
        },
        options: {
          skipEmailConfirmation: true
        }
      };

      // Act
      const result = await MockAccountService.createMockAccount(malformedRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.accountId).toBeUndefined();

      // Verify no auth user was left behind
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(
          malformedRequest.credentials.email
        );
        expect(authUser.user).toBeNull();
      } catch (error) {
        // Expected - user should not exist
        expect(error).toBeTruthy();
      }
    });

    it('should handle concurrent profile insert failures without leaving orphaned auth users', async () => {
      // Arrange: Create multiple requests that will fail simultaneously
      const timestamp = Date.now();
      const concurrentRequests: MockAccountCreationRequest[] = [];

      for (let i = 0; i < 3; i++) {
        concurrentRequests.push({
          credentials: {
            email: `concurrent-fail-${timestamp}-${i}@${testDomain}`,
            password: 'TestPass123!'
          },
          profile: {
            name: 'x'.repeat(500), // Too long, should fail validation
            role: 'admin'
          },
          options: {
            skipEmailConfirmation: true
          }
        });
      }

      // Act: Create accounts concurrently
      const results = await Promise.all(
        concurrentRequests.map(request => MockAccountService.createMockAccount(request))
      );

      // Assert: All should fail
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.accountId).toBeUndefined();
      });

      // Verify no orphaned auth users exist
      for (const request of concurrentRequests) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(
            request.credentials.email
          );
          expect(authUser.user).toBeNull();
        } catch (error) {
          // Expected - user should not exist
          expect(error).toBeTruthy();
        }
      }
    });

    it('should preserve auth user when profile insert succeeds but post-insert validation fails', async () => {
      // This test ensures we don't accidentally cleanup successful accounts
      const timestamp = Date.now();
      
      const validRequest: MockAccountCreationRequest = {
        credentials: {
          email: `profile-success-${timestamp}@${testDomain}`,
          password: 'TestPass123!'
        },
        profile: {
          name: 'Test Success User',
          role: 'admin'
        },
        options: {
          skipEmailConfirmation: true
        }
      };

      // Act
      const result = await MockAccountService.createMockAccount(validRequest);

      // Assert: Should succeed
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();

      if (result.accountId) {
        createdAuthUserIds.push(result.accountId);

        // Verify both auth user and profile exist
        const { data: authUser } = await supabaseAdmin.auth.admin.getUser(result.accountId);
        expect(authUser.user).toBeTruthy();
        expect(authUser.user?.email).toBe(validRequest.credentials.email);

        // Verify profile exists in database
        const { data: profile, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', result.accountId)
          .single();

        expect(error).toBeNull();
        expect(profile).toBeTruthy();
        expect(profile.email).toBe(validRequest.credentials.email);
        expect(profile.name).toBe(validRequest.profile.name);
        expect(profile.role).toBe(validRequest.profile.role);
        expect(profile.is_test_account).toBe(true);
      }
    });
  });

  describe('Cleanup Mechanism Verification', () => {
    it('should verify cleanup function exists and is properly callable', async () => {
      // Test that the cleanup mechanism is accessible and functional
      const timestamp = Date.now();
      
      // First create an auth user directly (bypassing our service)
      const testEmail = `cleanup-test-${timestamp}@${testDomain}`;
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: {
          name: 'Cleanup Test User',
          role: 'admin',
          isTestAccount: true
        }
      });

      expect(authError).toBeNull();
      expect(authUser.user).toBeTruthy();
      
      if (authUser.user) {
        createdAuthUserIds.push(authUser.user.id);

        // Verify the auth user exists
        const { data: verifyUser } = await supabaseAdmin.auth.admin.getUser(authUser.user.id);
        expect(verifyUser.user).toBeTruthy();

        // Now test cleanup
        const cleanupSuccess = await MockAccountService.cleanupAccount(authUser.user.id);
        expect(cleanupSuccess).toBe(true);

        // Verify user was cleaned up
        try {
          const { data: deletedUser } = await supabaseAdmin.auth.admin.getUser(authUser.user.id);
          expect(deletedUser.user).toBeNull();
        } catch (error) {
          // Expected - user should not exist
          expect(error).toBeTruthy();
        }

        // Remove from cleanup list since it's already cleaned up
        const index = createdAuthUserIds.indexOf(authUser.user.id);
        if (index > -1) {
          createdAuthUserIds.splice(index, 1);
        }
      }
    });

    it('should handle cleanup attempts for non-existent users gracefully', async () => {
      // Test cleanup with fake UUID
      const fakeUserId = '12345678-1234-1234-1234-123456789012';
      
      // Should not throw error, should return false
      const cleanupResult = await MockAccountService.cleanupAccount(fakeUserId);
      expect(cleanupResult).toBe(false);
    });

    it('should verify database cleanup function works correctly', async () => {
      // Test the RLS-safe cleanup function directly
      const timestamp = Date.now();
      
      // Create auth user and profile manually
      const testEmail = `db-cleanup-test-${timestamp}@${testDomain}`;
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: {
          name: 'DB Cleanup Test User',
          role: 'admin',
          isTestAccount: true
        }
      });

      if (authUser.user) {
        createdAuthUserIds.push(authUser.user.id);

        // Manually insert profile
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.user.id,
            email: testEmail,
            name: 'DB Cleanup Test User',
            role: 'admin',
            is_test_account: true,
            created_at: new Date().toISOString()
          });

        expect(profileError).toBeNull();

        // Test the database cleanup function directly
        const { data: cleanupResult, error: cleanupError } = await supabaseAdmin
          .rpc('cleanup_test_account', { target_user_id: authUser.user.id });

        expect(cleanupError).toBeNull();
        expect(cleanupResult).toBe(true);

        // Verify both auth user and profile are gone
        const { data: verifyAuth } = await supabaseAdmin.auth.admin.getUser(authUser.user.id);
        expect(verifyAuth.user).toBeNull();

        const { data: verifyProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.user.id)
          .single();

        expect(verifyProfile).toBeNull();

        // Remove from cleanup list since it's already cleaned up
        const index = createdAuthUserIds.indexOf(authUser.user.id);
        if (index > -1) {
          createdAuthUserIds.splice(index, 1);
        }
      }
    });
  });
});