#!/usr/bin/env node

/**
 * Test script to verify C1 API + GenUI SDK integration
 * This script tests the complete flow from backend API to frontend GenUI rendering
 */

console.log('🧪 C1 + GenUI SDK Integration Test');
console.log('==================================');

const baseUrl = 'http://localhost:3001/api';

async function testC1ApiEndpoint() {
  console.log('\n📡 Testing C1 API endpoint...');
  
  try {
    const response = await fetch(`${baseUrl}/v1/c1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Generate a simple property recommendation for office space in Koramangala',
        context: { location: 'Koramangala' },
        systemPrompt: 'You are a real estate assistant. Keep responses concise.'
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📊 Transfer-Encoding: ${response.headers.get('transfer-encoding')}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    console.log('✅ C1 API endpoint is reachable');

    // Test streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream');
    }

    const decoder = new TextDecoder();
    let chunkCount = 0;
    let totalContent = '';

    console.log('\n🔄 Testing streaming response...');
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log(`✅ Stream completed successfully (${chunkCount} chunks)`);
        break;
      }

      chunkCount++;
      const chunk = decoder.decode(value, { stream: true });
      
      if (chunkCount <= 3) {
        console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes`);
        console.log(`📝 Preview: "${chunk.substring(0, 100)}..."`);
      }

      // Parse streaming data
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                totalContent += content;
              }
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    }

    console.log(`📊 Total content received: ${totalContent.length} characters`);
    
    if (totalContent.length > 0) {
      console.log('✅ Streaming content extraction successful');
      console.log(`📝 Sample content: "${totalContent.substring(0, 200)}..."`);
      return true;
    } else {
      console.log('❌ No content extracted from stream');
      return false;
    }

  } catch (error) {
    console.error('❌ C1 API Test Failed:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n🌐 Testing frontend accessibility...');
  
  try {
    const response = await fetch('http://localhost:5175/');
    console.log(`📊 Frontend Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('\n🎯 Running Complete Integration Test...');
  console.log('===========================================');

  const frontendOk = await testFrontendAccess();
  const apiOk = await testC1ApiEndpoint();

  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Frontend:        ${frontendOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`C1 API Streaming: ${apiOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall:         ${frontendOk && apiOk ? '✅ READY FOR TESTING' : '❌ ISSUES DETECTED'}`);

  if (frontendOk && apiOk) {
    console.log('\n🎉 Integration test PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('1. Navigate to http://localhost:5175/');
    console.log('2. Go to Properties page');
    console.log('3. Click on "C1 AI" tab');
    console.log('4. Test a query like: "Show me co-working spaces in Koramangala under 50K budget"');
    console.log('5. Verify that GenUI SDK renders the C1 response properly');
    
    return true;
  } else {
    console.log('\n❌ Integration test FAILED - check the issues above');
    return false;
  }
}

// Run the test
runIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution error:', error);
    process.exit(1);
  });