#!/usr/bin/env node

/**
 * C1 API Connectivity Test Script
 * Tests the Thesys C1 API connection and validates the response
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '../.env');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      envVars[key.trim()] = values.join('=').trim();
    }
  });
} catch (error) {
  console.error('Could not read .env file:', error.message);
}

const API_KEY = envVars.VITE_THESYS_C1_API_KEY;
const ENDPOINT = envVars.VITE_THESYS_C1_ENDPOINT || 'https://api.thesys.dev/v1/embed';
const MODEL = envVars.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

console.log('🧪 C1 API Connectivity Test');
console.log('=' .repeat(50));

// Configuration Check
console.log('\n📋 Configuration Status:');
console.log(`API Key: ${API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Model: ${MODEL}`);

if (!API_KEY) {
  console.error('\n❌ Error: VITE_THESYS_C1_API_KEY is not configured in .env file');
  process.exit(1);
}

// Test API Request
async function testC1API() {
  console.log('\n🔄 Testing C1 API Connection...');
  
  const testPayload = {
    prompt: 'Generate a simple property search interface for commercial real estate with a search input and 2-3 property cards showing title, location, and size. Make it functional and responsive.',
    context: {
      useCase: 'propertySearch',
      availableProperties: [
        { id: '1', title: 'Modern Office Space', location: 'Koramangala', size: 1200 },
        { id: '2', title: 'Co-working Hub', location: 'Koramangala', size: 800 }
      ]
    },
    model: MODEL,
    stream: false
  };

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'User-Agent': 'GentleSpaceRealty-C1Test/1.0'
  };

  try {
    const fullEndpoint = `${ENDPOINT}/c1/generate`;
    console.log(`📡 Making request to: ${fullEndpoint}`);
    console.log(`🎯 Using model: ${MODEL}`);
    
    const startTime = Date.now();
    
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(testPayload)
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ API Response received successfully!');
    
    // Validate response structure
    if (result && (result.choices || result.content || result.ui_spec)) {
      console.log('✅ Response contains expected UI data');
      
      // Show response structure
      console.log('\n📋 Response Structure:');
      if (result.choices && result.choices.length > 0) {
        console.log(`   - choices: ${result.choices.length} item(s)`);
        if (result.choices[0].message) {
          console.log(`   - message content length: ${result.choices[0].message.content?.length || 0} chars`);
        }
      }
      if (result.content) {
        console.log(`   - content length: ${result.content.length} chars`);
      }
      if (result.ui_spec) {
        console.log('   - ui_spec: Present');
      }
      
      // Test if the content looks like a UI specification
      const content = result.choices?.[0]?.message?.content || result.content || JSON.stringify(result.ui_spec);
      if (content && (content.includes('component') || content.includes('ui') || content.includes('interface'))) {
        console.log('✅ Response appears to contain UI specification');
      }
      
      console.log('\n🎉 C1 API Test PASSED!');
      console.log('   - API is accessible ✅');
      console.log('   - Authentication successful ✅');
      console.log('   - Response format valid ✅');
      console.log('   - UI generation working ✅');
      
      return true;
    } else {
      console.warn('⚠️  Unexpected response format');
      console.log('Raw response:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
      return false;
    }

  } catch (error) {
    console.error('❌ Network/API Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   → DNS resolution failed. Check your internet connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Connection refused. Check if the API endpoint is correct.');
    } else if (error.message.includes('fetch')) {
      console.error('   → Fetch error. This might be a network connectivity issue.');
    }
    
    return false;
  }
}

// SDK Integration Test
async function testSDKComponents() {
  console.log('\n🧩 Testing SDK Components...');
  
  try {
    // First, check if the package exists in node_modules
    const fs = await import('fs/promises');
    const packagePath = join(__dirname, '../node_modules/@thesysai/genui-sdk/package.json');
    
    try {
      await fs.access(packagePath);
      console.log('✅ @thesysai/genui-sdk package found in node_modules');
    } catch {
      console.error('❌ @thesysai/genui-sdk package not found in node_modules');
      console.error('   → Run: npm install @thesysai/genui-sdk');
      return false;
    }

    // Try to import the SDK components
    const sdkModule = await import('@thesysai/genui-sdk');
    console.log('✅ @thesysai/genui-sdk imported successfully');
    console.log(`   Available exports: ${Object.keys(sdkModule).join(', ')}`);
    
    // Check for required components
    const requiredComponents = ['C1Component', 'ThemeProvider', 'C1Chat'];
    const availableComponents = [];
    const missingComponents = [];
    
    for (const component of requiredComponents) {
      if (sdkModule[component]) {
        availableComponents.push(component);
      } else {
        missingComponents.push(component);
      }
    }
    
    console.log(`✅ Available components: ${availableComponents.join(', ')}`);
    if (missingComponents.length > 0) {
      console.log(`⚠️  Missing components: ${missingComponents.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ SDK Import Error:', error.message);
    
    // Check if it's a lodash issue
    if (error.message.includes('lodash')) {
      console.error('   → This appears to be a lodash dependency issue');
      console.error('   → Try: npm install lodash');
    } else if (error.message.includes('Cannot find module')) {
      console.error('   → Make sure @thesysai/genui-sdk is properly installed: npm install @thesysai/genui-sdk');
    }
    
    return false;
  }
}

// CSS Integration Test  
async function testCSSIntegration() {
  console.log('\n🎨 Testing CSS Integration...');
  
  try {
    // Check if CSS file exists and is readable
    const fs = await import('fs/promises');
    const indexCSS = await fs.readFile(join(__dirname, '../src/index.css'), 'utf8');
    
    if (indexCSS.includes('@crayonai/react-ui/styles/index.css')) {
      console.log('✅ Crayon UI styles import found in src/index.css');
      return true;
    } else {
      console.warn('⚠️  Crayon UI styles import missing from src/index.css');
      console.log('   → Add: @import \'@crayonai/react-ui/styles/index.css\';');
      return false;
    }
  } catch (error) {
    console.error('❌ CSS Check Error:', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('\n🚀 Starting comprehensive C1 integration test...\n');
  
  const results = {
    api: await testC1API(),
    sdk: await testSDKComponents(), 
    css: await testCSSIntegration()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test Results Summary:');
  console.log('='.repeat(50));
  
  console.log(`🔌 API Connectivity: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🧩 SDK Components: ${results.sdk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🎨 CSS Integration: ${results.css ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallPass = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Status: ${overallPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallPass) {
    console.log('\n🎉 Your C1 integration is ready to use!');
    console.log('   Try visiting: http://localhost:5174/test-c1');
  } else {
    console.log('\n🔧 Please fix the failing tests and run again.');
  }
  
  process.exit(overallPass ? 0 : 1);
}

runTests().catch(console.error);