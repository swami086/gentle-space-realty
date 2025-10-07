#!/usr/bin/env node

/**
 * Debug script to trace admin authentication flow
 * Simulates browser behavior to identify issues
 */

console.log('🔍 Admin Flow Debug Script');
console.log('==========================');
console.log('This script will help identify why the admin page isn\'t loading after auth.\n');

async function debugAdminFlow() {
  const baseUrl = 'http://localhost:4173';
  
  console.log('🔸 Step 1: Test SPA routing for /admin');
  try {
    const adminResponse = await fetch(`${baseUrl}/admin`);
    console.log(`   Status: ${adminResponse.status}`);
    console.log(`   Content-Type: ${adminResponse.headers.get('content-type')}`);
    
    if (adminResponse.status === 200) {
      console.log('   ✅ Admin route serves HTML correctly');
    } else {
      console.log('   ❌ Admin route failed');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return;
  }
  
  console.log('\n🔸 Step 2: Test SPA routing for /admin/dashboard');
  try {
    const dashboardResponse = await fetch(`${baseUrl}/admin/dashboard`);
    console.log(`   Status: ${dashboardResponse.status}`);
    console.log(`   Content-Type: ${dashboardResponse.headers.get('content-type')}`);
    
    if (dashboardResponse.status === 200) {
      console.log('   ✅ Admin dashboard route serves HTML correctly');
    } else {
      console.log('   ❌ Admin dashboard route failed');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n🔸 Step 3: Test critical assets availability');
  const criticalAssets = [
    '/assets/index-Rih6EXXv.js',
    '/assets/vendor-CF2RtinK.js',
    '/assets/router-D_AbXUKv.js',
    '/assets/css/index.BpvnhEaV.css'
  ];
  
  for (const asset of criticalAssets) {
    try {
      const assetResponse = await fetch(`${baseUrl}${asset}`);
      const contentType = assetResponse.headers.get('content-type');
      
      if (assetResponse.status === 200) {
        console.log(`   ✅ ${asset} - ${contentType}`);
      } else {
        console.log(`   ❌ ${asset} - Status: ${assetResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${asset} - Error: ${error.message}`);
    }
  }
  
  console.log('\n🔸 Step 4: Test auth callback route');
  try {
    const callbackResponse = await fetch(`${baseUrl}/auth/callback`);
    console.log(`   Status: ${callbackResponse.status}`);
    
    if (callbackResponse.status === 200) {
      console.log('   ✅ Auth callback route works');
    } else {
      console.log('   ❌ Auth callback route failed');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n🔸 Step 5: Environment check');
  console.log(`   Server: http://localhost:4173/`);
  console.log(`   SPA Server: ✅ Running`);
  console.log(`   Asset Base Path: Absolute (/assets/)`);
  
  console.log('\n📋 Possible Issues:');
  console.log('   1. JavaScript execution errors in browser');
  console.log('   2. Authentication state not persisting after redirect');
  console.log('   3. React Router not handling nested routes properly');
  console.log('   4. Component rendering errors after auth');
  
  console.log('\n🔧 Debug Steps:');
  console.log('   1. Open browser to http://localhost:4173/admin');
  console.log('   2. Open Developer Tools (F12)');
  console.log('   3. Check Console tab for errors');
  console.log('   4. Check Network tab for failed requests');
  console.log('   5. Try direct access to http://localhost:4173/admin/dashboard');
  
  console.log('\n💡 If admin page appears blank after auth:');
  console.log('   • Check React DevTools for component state');
  console.log('   • Verify Supabase session persistence');
  console.log('   • Check if AdminLayout component is rendering');
  console.log('   • Look for JavaScript runtime errors');
}

debugAdminFlow().catch(console.error);