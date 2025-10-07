import { chromium, FullConfig } from '@playwright/test';
import { MockAccountService } from '../../src/services/mockAccountServiceCLI';

/**
 * Global setup for Playwright tests
 * Prepares test environment and creates necessary test accounts
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Playwright Global Setup: Starting...');
  
  try {
    // Clean up any existing test accounts before starting tests
    console.log('🧹 Cleaning up existing test accounts...');
    const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
    console.log(`✅ Cleaned up ${cleanupResult.deletedAccounts} existing test accounts`);
    
    // Create test accounts for Playwright tests
    console.log('👥 Creating test accounts for Playwright tests...');
    
    const testAccounts = await Promise.all([
      MockAccountService.createQuickTestAccount('admin', 'playwright-admin'),
      MockAccountService.createQuickTestAccount('super_admin', 'playwright-super-admin'),
      MockAccountService.createQuickTestAccount('user', 'playwright-user')
    ]);
    
    const successfulAccounts = testAccounts.filter(account => account.success);
    console.log(`✅ Created ${successfulAccounts.length}/3 test accounts for Playwright`);
    
    // Store test credentials in global state
    const testCredentials = {
      admin: {
        email: 'playwright-admin@test.gentlespacerealty.local',
        password: 'TestPass123!',
        accountId: testAccounts[0].accountId
      },
      superAdmin: {
        email: 'playwright-super-admin@test.gentlespacerealty.local',
        password: 'TestPass123!',
        accountId: testAccounts[1].accountId
      },
      user: {
        email: 'playwright-user@test.gentlespacerealty.local',
        password: 'TestPass123!',
        accountId: testAccounts[2].accountId
      }
    };
    
    // Store credentials for tests to use
    process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL = testCredentials.admin.email;
    process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD = testCredentials.admin.password;
    process.env.PLAYWRIGHT_TEST_ADMIN_ID = testCredentials.admin.accountId || '';
    
    process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_EMAIL = testCredentials.superAdmin.email;
    process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_PASSWORD = testCredentials.superAdmin.password;
    process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_ID = testCredentials.superAdmin.accountId || '';
    
    process.env.PLAYWRIGHT_TEST_USER_EMAIL = testCredentials.user.email;
    process.env.PLAYWRIGHT_TEST_USER_PASSWORD = testCredentials.user.password;
    process.env.PLAYWRIGHT_TEST_USER_ID = testCredentials.user.accountId || '';
    
    console.log('✅ Playwright Global Setup: Completed successfully');
    
  } catch (error) {
    console.error('❌ Playwright Global Setup: Failed:', error);
    throw error;
  }
}

export default globalSetup;