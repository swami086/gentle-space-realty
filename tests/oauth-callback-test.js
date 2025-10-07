#!/usr/bin/env node

/**
 * OAuth Callback Test Script
 * Tests the improved OAuth callback handling logic
 */

const { mcp__playwright__playwright_navigate, mcp__playwright__playwright_evaluate, mcp__playwright__playwright_console_logs } = require('playwright');

async function testOAuthCallback() {
  console.log('🧪 Testing OAuth Callback Handling...');
  console.log('=====================================');
  
  try {
    // Navigate to a mock callback URL with authorization code
    const mockCallbackUrl = 'http://localhost:5173/auth/callback?code=mock_auth_code_12345&state=mock_state';
    
    console.log('📍 Navigating to mock callback URL...');
    console.log(`   URL: ${mockCallbackUrl}`);
    
    // This will test our improved callback handling logic
    const result = await mcp__playwright__playwright_navigate({
      url: mockCallbackUrl,
      headless: false
    });
    
    console.log('✅ Navigation successful');
    
    // Wait for callback processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check console logs for callback processing
    const logs = await mcp__playwright__playwright_console_logs({
      type: 'all',
      limit: 30
    });
    
    console.log('📋 Callback Processing Logs:');
    console.log('============================');
    
    logs.forEach(log => {
      if (log.includes('GoogleAuthService') || log.includes('AuthCallback') || log.includes('OAuth')) {
        console.log(`   ${log}`);
      }
    });
    
    // Test the improved session handling
    const sessionTest = await mcp__playwright__playwright_evaluate({
      script: `
        (async () => {
          const { GoogleAuthService } = await import('/src/services/googleAuthService.ts');
          
          try {
            console.log('🔄 Testing improved callback handling...');
            const result = await GoogleAuthService.handleAuthCallback();
            
            return {
              success: !!result.user,
              error: result.error?.message,
              userEmail: result.user?.email
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              userEmail: null
            };
          }
        })();
      `
    });
    
    console.log('🔬 Callback Test Results:');
    console.log('=========================');
    console.log(`   Success: ${sessionTest.success ? '✅' : '❌'}`);
    console.log(`   Error: ${sessionTest.error || 'None'}`);
    console.log(`   User Email: ${sessionTest.userEmail || 'Not detected'}`);
    
    return sessionTest;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Export for use in other tests
module.exports = { testOAuthCallback };

// Run test if called directly
if (require.main === module) {
  testOAuthCallback()
    .then(result => {
      console.log('');
      console.log('🎯 Final Test Result:');
      console.log(`   Status: ${result.success ? 'PASSED ✅' : 'FAILED ❌'}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}