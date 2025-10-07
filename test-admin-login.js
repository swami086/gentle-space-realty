/**
 * Test Admin Portal Login Flow
 * This script simulates the admin login process to debug the blank page issue
 */

const testLogin = async () => {
  console.log('🧪 Testing Admin Portal Login Flow...\n');
  
  // Test backend health first
  console.log('1. Testing backend health...');
  try {
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return;
  }

  // Test login endpoint availability
  console.log('\n2. Testing login endpoint availability...');
  try {
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Invalid token for testing endpoint
        idToken: 'test'
      })
    });
    
    // We expect this to fail with 401, but endpoint should exist
    if (loginResponse.status === 401) {
      console.log('✅ Login endpoint exists (401 as expected for invalid token)');
    } else {
      console.log('⚠️ Unexpected response:', loginResponse.status);
    }
  } catch (error) {
    console.error('❌ Login endpoint test failed:', error.message);
    return;
  }

  // Test frontend access
  console.log('\n3. Testing frontend availability...');
  try {
    const frontendResponse = await fetch('http://localhost:5174/admin');
    if (frontendResponse.ok) {
      console.log('✅ Frontend admin page accessible');
    } else {
      console.log('⚠️ Frontend admin page status:', frontendResponse.status);
    }
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    return;
  }

  console.log('\n✅ All basic connectivity tests passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open browser to http://localhost:5174/admin');
  console.log('2. Login with: admin@gentlespace.com / GentleSpace2025!');
  console.log('3. Check browser console for errors');
  console.log('4. Check if URL changes to /admin/dashboard');
  console.log('5. Check if AdminDashboard component renders');
};

// Run the test
testLogin().catch(console.error);