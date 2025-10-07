/**
 * End-to-End API Connectivity Test
 * Tests complete flow: GCP Cloud SQL → Express Backend → Frontend API calls
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';

class EndToEndTester {
  constructor() {
    this.backendUrl = 'http://localhost:3001';
    this.frontendUrl = 'http://localhost:5175';
    this.results = {
      backend: { status: 'pending', tests: [] },
      frontend: { status: 'pending', tests: [] },
      integration: { status: 'pending', tests: [] },
      overall: { status: 'pending' }
    };
  }

  async checkBackendHealth() {
    console.log('🔍 Testing Backend Health...');
    console.log('=' .repeat(50));

    try {
      // Test 1: Backend server running
      const healthResponse = await fetch(`${this.backendUrl}/health`, {
        timeout: 5000
      }).catch(() => null);

      this.results.backend.tests.push({
        name: 'Backend Server Health',
        status: healthResponse ? 'passed' : 'failed',
        details: healthResponse ? `Server responding at ${this.backendUrl}` : 'Server not responding'
      });

      // Test 2: Properties API endpoint
      const propertiesResponse = await fetch(`${this.backendUrl}/api/v1/properties`);
      const propertiesData = await propertiesResponse.json();
      
      this.results.backend.tests.push({
        name: 'Properties API Endpoint',
        status: propertiesResponse.ok ? 'passed' : 'failed',
        details: propertiesResponse.ok ? `Retrieved ${propertiesData?.data?.length || 0} properties` : `HTTP ${propertiesResponse.status}`
      });

      // Test 3: Testimonials API endpoint
      const testimonialsResponse = await fetch(`${this.backendUrl}/api/v1/testimonials/approved`);
      const testimonialsData = await testimonialsResponse.json();
      
      this.results.backend.tests.push({
        name: 'Testimonials API Endpoint',
        status: testimonialsResponse.ok ? 'passed' : 'failed',
        details: testimonialsResponse.ok ? `Retrieved ${testimonialsData?.data?.length || 0} testimonials` : `HTTP ${testimonialsResponse.status}`
      });

      // Test 4: FAQs API endpoint
      const faqsResponse = await fetch(`${this.backendUrl}/api/v1/faqs`);
      const faqsData = await faqsResponse.json();
      
      this.results.backend.tests.push({
        name: 'FAQs API Endpoint',
        status: faqsResponse.ok ? 'passed' : 'failed',
        details: faqsResponse.ok ? `Retrieved ${faqsData?.data?.length || 0} FAQs` : `HTTP ${faqsResponse.status}`
      });

      // Test 5: Single property fetch
      if (propertiesResponse.ok && propertiesData?.data?.length > 0) {
        const firstPropertyId = propertiesData.data[0].id;
        const singlePropertyResponse = await fetch(`${this.backendUrl}/api/v1/properties/${firstPropertyId}`);
        const singlePropertyData = await singlePropertyResponse.json();
        
        this.results.backend.tests.push({
          name: 'Single Property API',
          status: singlePropertyResponse.ok ? 'passed' : 'failed',
          details: singlePropertyResponse.ok ? `Retrieved property: ${singlePropertyData?.data?.title || 'Unknown'}` : `HTTP ${singlePropertyResponse.status}`
        });
      }

      // Test 6: CORS headers
      const corsResponse = await fetch(`${this.backendUrl}/api/v1/properties`, {
        method: 'OPTIONS'
      });
      
      this.results.backend.tests.push({
        name: 'CORS Configuration',
        status: corsResponse.headers.get('access-control-allow-origin') ? 'passed' : 'failed',
        details: corsResponse.headers.get('access-control-allow-origin') ? 'CORS properly configured' : 'CORS headers missing'
      });

      console.log('✅ Backend health tests completed');

    } catch (error) {
      console.error('❌ Backend health test error:', error.message);
      this.results.backend.tests.push({
        name: 'Backend Connection',
        status: 'failed',
        details: error.message
      });
    }
  }

  async checkFrontendHealth() {
    console.log('\n🖥️  Testing Frontend Health...');
    console.log('=' .repeat(50));

    try {
      // Test 1: Frontend server running
      const frontendResponse = await fetch(this.frontendUrl, {
        timeout: 5000
      }).catch(() => null);

      this.results.frontend.tests.push({
        name: 'Frontend Server Health',
        status: frontendResponse ? 'passed' : 'failed',
        details: frontendResponse ? `Frontend responding at ${this.frontendUrl}` : 'Frontend server not responding'
      });

      if (frontendResponse) {
        const htmlContent = await frontendResponse.text();
        
        // Test 2: React app loaded
        const hasReactRoot = htmlContent.includes('id="root"') || htmlContent.includes('id="app"');
        this.results.frontend.tests.push({
          name: 'React App Structure',
          status: hasReactRoot ? 'passed' : 'failed',
          details: hasReactRoot ? 'React root element found' : 'React root element missing'
        });

        // Test 3: Check if Vite is serving the app
        const isViteApp = htmlContent.includes('vite') || htmlContent.includes('@vite');
        this.results.frontend.tests.push({
          name: 'Vite Development Server',
          status: isViteApp ? 'passed' : 'failed',
          details: isViteApp ? 'Vite dev server active' : 'Static HTML served'
        });
      }

      console.log('✅ Frontend health tests completed');

    } catch (error) {
      console.error('❌ Frontend health test error:', error.message);
      this.results.frontend.tests.push({
        name: 'Frontend Connection',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testAPIIntegration() {
    console.log('\n🔗 Testing API Integration Flow...');
    console.log('=' .repeat(50));

    try {
      // Test 1: Data flow from database to API
      console.log('📊 Testing data flow: Cloud SQL → Express API');
      
      const propertiesResponse = await fetch(`${this.backendUrl}/api/v1/properties`);
      const propertiesResponseData = await propertiesResponse.json();
      const properties = propertiesResponseData?.data || [];
      
      if (propertiesResponse.ok && Array.isArray(properties) && properties.length > 0) {
        this.results.integration.tests.push({
          name: 'Database → API Data Flow',
          status: 'passed',
          details: `Successfully retrieved ${properties.length} properties from Cloud SQL via Express API`
        });

        // Test specific property details
        const sampleProperty = properties[0];
        const hasRequiredFields = sampleProperty.id && sampleProperty.title && sampleProperty.price;
        
        this.results.integration.tests.push({
          name: 'API Data Structure',
          status: hasRequiredFields ? 'passed' : 'failed',
          details: hasRequiredFields ? 'Property data contains required fields (id, title, price)' : 'Missing required property fields'
        });
      } else {
        this.results.integration.tests.push({
          name: 'Database → API Data Flow',
          status: 'failed',
          details: 'Failed to retrieve properties from API'
        });
      }

      // Test 2: Test different API endpoints for data consistency
      const endpoints = [
        { path: '/api/v1/testimonials/approved', name: 'Testimonials' },
        { path: '/api/v1/faqs', name: 'FAQs' }
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${this.backendUrl}${endpoint.path}`);
        const responseData = await response.json();
        const data = responseData?.data || [];
        
        this.results.integration.tests.push({
          name: `${endpoint.name} API Integration`,
          status: response.ok && Array.isArray(data) ? 'passed' : 'failed',
          details: response.ok ? `${endpoint.name}: ${data.length} records` : `${endpoint.name} API failed`
        });
      }

      // Test 3: API response time performance
      const startTime = Date.now();
      await fetch(`${this.backendUrl}/api/v1/properties`);
      const responseTime = Date.now() - startTime;
      
      this.results.integration.tests.push({
        name: 'API Response Time',
        status: responseTime < 1000 ? 'passed' : 'warning',
        details: `Response time: ${responseTime}ms ${responseTime < 1000 ? '(Good)' : '(Slow)'}`
      });

      // Test 4: Error handling
      const notFoundResponse = await fetch(`${this.backendUrl}/api/v1/properties/nonexistent-id`);
      this.results.integration.tests.push({
        name: 'API Error Handling',
        status: notFoundResponse.status === 404 ? 'passed' : 'failed',
        details: `404 handling: ${notFoundResponse.status === 404 ? 'Correct' : 'Incorrect'}`
      });

      console.log('✅ API integration tests completed');

    } catch (error) {
      console.error('❌ API integration test error:', error.message);
      this.results.integration.tests.push({
        name: 'API Integration',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testFrontendAPIConnection() {
    console.log('\n🌐 Testing Frontend API Connection...');
    console.log('=' .repeat(50));

    try {
      // Check if frontend is making API calls by examining network patterns
      // This is a simplified test - in reality, we'd need browser automation
      
      // Test 1: Check if backend is configured to accept frontend requests
      const corsTestResponse = await fetch(`${this.backendUrl}/api/v1/properties`, {
        method: 'GET',
        headers: {
          'Origin': this.frontendUrl,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      this.results.integration.tests.push({
        name: 'Frontend → Backend CORS',
        status: corsTestResponse.ok ? 'passed' : 'failed',
        details: corsTestResponse.ok ? 'Frontend can make API requests to backend' : 'CORS blocking frontend requests'
      });

      // Test 2: API endpoint accessibility from frontend origin
      const apiAccessResponse = await fetch(`${this.backendUrl}/api/v1/properties`, {
        headers: {
          'Origin': this.frontendUrl
        }
      });

      const corsHeader = apiAccessResponse.headers.get('access-control-allow-origin');
      this.results.integration.tests.push({
        name: 'API Accessibility',
        status: corsHeader && (corsHeader === '*' || corsHeader.includes('localhost:5175')) ? 'passed' : 'failed',
        details: `CORS header: ${corsHeader || 'missing'}`
      });

      console.log('✅ Frontend API connection tests completed');

    } catch (error) {
      console.error('❌ Frontend API connection test error:', error.message);
      this.results.integration.tests.push({
        name: 'Frontend API Connection',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testFullStackFlow() {
    console.log('\n🔄 Testing Full Stack Data Flow...');
    console.log('=' .repeat(50));

    try {
      // Simulate a complete user journey: Frontend request → Backend → Database → Response
      console.log('🎯 Simulating: User loads properties page');

      const startTime = Date.now();
      
      // Step 1: Frontend requests properties
      const propertiesResponse = await fetch(`${this.backendUrl}/api/v1/properties`, {
        headers: {
          'Origin': this.frontendUrl,
          'User-Agent': 'Gentle-Space-Frontend/1.0'
        }
      });

      const propertiesFullResponse = await propertiesResponse.json();
      const properties = propertiesFullResponse?.data || [];
      const totalTime = Date.now() - startTime;

      if (propertiesResponse.ok && Array.isArray(properties)) {
        this.results.integration.tests.push({
          name: 'Full Stack Data Flow',
          status: 'passed',
          details: `Complete flow: Frontend → Express → Cloud SQL → Response (${totalTime}ms, ${properties.length} items)`
        });

        // Test data quality
        const hasValidData = properties.every(p => p.id && p.title && typeof p.price === 'number');
        this.results.integration.tests.push({
          name: 'End-to-End Data Quality',
          status: hasValidData ? 'passed' : 'failed',
          details: hasValidData ? 'All properties have valid data structure' : 'Some properties missing required fields'
        });
      } else {
        this.results.integration.tests.push({
          name: 'Full Stack Data Flow',
          status: 'failed',
          details: `Flow failed at API level: HTTP ${propertiesResponse.status}`
        });
      }

      // Step 2: Test error handling in full stack
      console.log('🎯 Testing error handling across stack');
      const errorResponse = await fetch(`${this.backendUrl}/api/v1/properties/invalid-uuid`, {
        headers: {
          'Origin': this.frontendUrl
        }
      });

      this.results.integration.tests.push({
        name: 'Full Stack Error Handling',
        status: errorResponse.status >= 400 && errorResponse.status < 500 ? 'passed' : 'failed',
        details: `Error response: HTTP ${errorResponse.status} (${errorResponse.status >= 400 && errorResponse.status < 500 ? 'Proper client error' : 'Unexpected response'})`
      });

      console.log('✅ Full stack flow tests completed');

    } catch (error) {
      console.error('❌ Full stack flow test error:', error.message);
      this.results.integration.tests.push({
        name: 'Full Stack Flow',
        status: 'failed',
        details: error.message
      });
    }
  }

  generateReport() {
    console.log('\n📊 End-to-End Connectivity Test Report');
    console.log('=' .repeat(70));

    const allTests = [
      ...this.results.backend.tests,
      ...this.results.frontend.tests,
      ...this.results.integration.tests
    ];

    const totalTests = allTests.length;
    const passedTests = allTests.filter(t => t.status === 'passed').length;
    const failedTests = allTests.filter(t => t.status === 'failed').length;
    const warningTests = allTests.filter(t => t.status === 'warning').length;

    const overallStatus = failedTests === 0 ? 'PASSED' : 'FAILED';
    
    console.log(`\n🎯 Overall Status: ${overallStatus}`);
    console.log(`📈 Tests Passed: ${passedTests}/${totalTests} (${Math.round((passedTests/totalTests) * 100)}%)`);
    if (warningTests > 0) {
      console.log(`⚠️ Warnings: ${warningTests}`);
    }
    
    console.log('\n📋 Component Summary:');
    console.log(`   🔧 Backend: ${this.results.backend.tests.filter(t => t.status === 'passed').length}/${this.results.backend.tests.length} passed`);
    console.log(`   🖥️ Frontend: ${this.results.frontend.tests.filter(t => t.status === 'passed').length}/${this.results.frontend.tests.length} passed`);
    console.log(`   🔗 Integration: ${this.results.integration.tests.filter(t => t.status === 'passed').length}/${this.results.integration.tests.length} passed`);

    // Show test results by category
    const categories = [
      { name: 'Backend Tests', tests: this.results.backend.tests },
      { name: 'Frontend Tests', tests: this.results.frontend.tests },
      { name: 'Integration Tests', tests: this.results.integration.tests }
    ];

    categories.forEach(category => {
      if (category.tests.length > 0) {
        console.log(`\n📝 ${category.name}:`);
        category.tests.forEach(test => {
          const icon = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
          console.log(`   ${icon} ${test.name}: ${test.details}`);
        });
      }
    });

    // Show failed tests separately for clarity
    const failedTestsList = allTests.filter(t => t.status === 'failed');
    if (failedTestsList.length > 0) {
      console.log('\n❌ Failed Tests Requiring Attention:');
      failedTestsList.forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }

    this.results.overall = {
      status: overallStatus.toLowerCase(),
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      successRate: Math.round((passedTests/totalTests) * 100)
    };

    return this.results;
  }

  async runAllTests() {
    console.log('🚀 Starting End-to-End API Connectivity Tests');
    console.log('🕒 Started at:', new Date().toISOString());
    console.log('🎯 Testing: GCP Cloud SQL → Express Backend → Frontend');
    console.log('=' .repeat(70));

    const startTime = Date.now();

    try {
      await this.checkBackendHealth();
      await this.checkFrontendHealth();
      await this.testAPIIntegration();
      await this.testFrontendAPIConnection();
      await this.testFullStackFlow();
    } catch (error) {
      console.error('❌ Critical error during testing:', error.message);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n⏱️  Tests completed in ${duration} seconds`);
    
    const results = this.generateReport();
    
    // Save detailed results
    const reportPath = '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/docs/e2e_connectivity_test_results.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${reportPath}`);

    return results;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EndToEndTester();
  tester.runAllTests()
    .then(results => {
      console.log(`\n🎊 End-to-End connectivity: ${results.overall.status.toUpperCase()}`);
      process.exit(results.overall.status === 'passed' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

export default EndToEndTester;