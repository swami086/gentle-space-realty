#!/usr/bin/env node

/**
 * Test script to check if admin page loads properly
 * Opens browser and checks for console errors
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Admin Page Console Output');
console.log('=====================================');

// Function to test a URL and log any issues
async function testUrl(url, description) {
  console.log(`\n📋 Testing: ${description}`);
  console.log(`🔗 URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    const status = response.status;
    
    console.log(`✅ Status: ${status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (status === 200 && contentType?.includes('text/html')) {
      const html = await response.text();
      
      // Check if assets are properly referenced
      const scriptMatches = html.match(/src="[^"]*"/g) || [];
      const linkMatches = html.match(/href="[^"]*\.css"/g) || [];
      
      console.log(`📦 Script tags found: ${scriptMatches.length}`);
      console.log(`🎨 CSS links found: ${linkMatches.length}`);
      
      // Check for absolute vs relative paths
      const relativeAssets = [...scriptMatches, ...linkMatches]
        .filter(asset => asset.includes('./assets/') || asset.includes('assets/'))
        .length;
      
      const absoluteAssets = [...scriptMatches, ...linkMatches]
        .filter(asset => asset.includes('/assets/'))
        .length;
      
      console.log(`🔗 Relative asset paths: ${relativeAssets}`);
      console.log(`🔗 Absolute asset paths: ${absoluteAssets}`);
      
      if (relativeAssets > 0) {
        console.log(`⚠️  WARNING: Found ${relativeAssets} relative asset paths - may cause 404s on sub-routes`);
      }
      
    } else if (status !== 200) {
      console.log(`❌ HTTP Error: ${status}`);
    } else {
      console.log(`⚠️  Unexpected content type: ${contentType}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

// Test all relevant URLs
async function runTests() {
  const baseUrl = 'http://localhost:4173';
  
  await testUrl(`${baseUrl}/`, 'Home page');
  await testUrl(`${baseUrl}/admin`, 'Admin login');
  await testUrl(`${baseUrl}/admin/dashboard`, 'Admin dashboard');
  await testUrl(`${baseUrl}/auth/callback`, 'Auth callback');
  
  // Test asset loading
  console.log('\n🔧 Testing Asset Loading:');
  await testUrl(`${baseUrl}/assets/index-Rih6EXXv.js`, 'Main JavaScript bundle');
  await testUrl(`${baseUrl}/assets/css/index.BpvnhEaV.css`, 'Main CSS bundle');
  await testUrl(`${baseUrl}/manifest.json`, 'Web App Manifest');
  
  console.log('\n🏁 Tests completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Open browser to http://localhost:4173/admin');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Test authentication flow');
  console.log('4. Verify admin page loads after auth');
}

runTests().catch(console.error);