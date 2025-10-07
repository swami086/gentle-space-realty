import { FullConfig } from '@playwright/test';
import { MockAccountService } from '../../src/services/mockAccountServiceCLI';

/**
 * Global teardown for Playwright tests
 * Cleans up test accounts and environment
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Playwright Global Teardown: Starting...');
  
  try {
    // Clean up all test accounts created during Playwright tests
    console.log('🧹 Cleaning up all Playwright test accounts...');
    const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
    
    if (cleanupResult.success) {
      console.log(`✅ Successfully cleaned up ${cleanupResult.deletedAccounts} test accounts`);
    } else {
      console.error('❌ Some cleanup operations failed:');
      cleanupResult.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
    }
    
    // Clear environment variables
    delete process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL;
    delete process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD;
    delete process.env.PLAYWRIGHT_TEST_ADMIN_ID;
    
    delete process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_EMAIL;
    delete process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_PASSWORD;
    delete process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_ID;
    
    delete process.env.PLAYWRIGHT_TEST_USER_EMAIL;
    delete process.env.PLAYWRIGHT_TEST_USER_PASSWORD;
    delete process.env.PLAYWRIGHT_TEST_USER_ID;
    
    console.log('✅ Playwright Global Teardown: Completed successfully');
    
  } catch (error) {
    console.error('❌ Playwright Global Teardown: Failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;