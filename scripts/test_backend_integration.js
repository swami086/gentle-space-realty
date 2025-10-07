/**
 * Backend Integration Test for GCP Services
 * Tests the converted backend service with GCP integration
 */

import { DatabaseService, testConnection } from '../backend/src/services/supabaseService.ts';

class BackendIntegrationTester {
  constructor() {
    this.results = {
      connection: { status: 'pending', details: '' },
      apiTests: { status: 'pending', tests: [] },
      overall: { status: 'pending' }
    };
  }

  async testConnection() {
    console.log('🔌 Testing backend database connection...');
    
    try {
      const isConnected = await testConnection();
      this.results.connection = {
        status: isConnected ? 'passed' : 'failed',
        details: isConnected ? 'Backend successfully connected to GCP Cloud SQL' : 'Connection failed'
      };
      
      console.log(isConnected ? '✅ Backend connection successful' : '❌ Backend connection failed');
      return isConnected;
    } catch (error) {
      this.results.connection = {
        status: 'failed',
        details: error.message
      };
      console.error('❌ Connection test error:', error.message);
      return false;
    }
  }

  async testPropertiesAPI() {
    console.log('\n🏠 Testing Properties API...');
    
    try {
      // Test 1: Get all properties
      const allProperties = await DatabaseService.properties.getAll();
      this.results.apiTests.tests.push({
        name: 'Properties.getAll()',
        status: allProperties.error ? 'failed' : 'passed',
        details: allProperties.error ? allProperties.error.message : `Retrieved ${allProperties.data?.length || 0} properties`
      });

      // Test 2: Get single property (if exists)
      if (allProperties.data && allProperties.data.length > 0) {
        const firstProperty = allProperties.data[0];
        const singleProperty = await DatabaseService.properties.getById(firstProperty.id);
        this.results.apiTests.tests.push({
          name: 'Properties.getById()',
          status: singleProperty.error ? 'failed' : 'passed',
          details: singleProperty.error ? singleProperty.error.message : `Retrieved property: ${singleProperty.data?.title || 'Unknown'}`
        });

        // Test 3: Search properties
        const searchResults = await DatabaseService.properties.search('apartment');
        this.results.apiTests.tests.push({
          name: 'Properties.search()',
          status: searchResults.error ? 'failed' : 'passed',
          details: searchResults.error ? searchResults.error.message : `Found ${searchResults.data?.length || 0} matching properties`
        });
      }

    } catch (error) {
      this.results.apiTests.tests.push({
        name: 'Properties API',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testUsersAPI() {
    console.log('\n👥 Testing Users API...');
    
    try {
      const allUsers = await DatabaseService.users.getAll();
      this.results.apiTests.tests.push({
        name: 'Users.getAll()',
        status: allUsers.error ? 'failed' : 'passed',
        details: allUsers.error ? allUsers.error.message : `Retrieved ${allUsers.data?.length || 0} users`
      });

      if (allUsers.data && allUsers.data.length > 0) {
        const firstUser = allUsers.data[0];
        const singleUser = await DatabaseService.users.getById(firstUser.id);
        this.results.apiTests.tests.push({
          name: 'Users.getById()',
          status: singleUser.error ? 'failed' : 'passed',
          details: singleUser.error ? singleUser.error.message : `Retrieved user: ${singleUser.data?.name || 'Unknown'}`
        });
      }

    } catch (error) {
      this.results.apiTests.tests.push({
        name: 'Users API',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testTestimonialsAPI() {
    console.log('\n💬 Testing Testimonials API...');
    
    try {
      const approvedTestimonials = await DatabaseService.testimonials.getApproved();
      this.results.apiTests.tests.push({
        name: 'Testimonials.getApproved()',
        status: approvedTestimonials.error ? 'failed' : 'passed',
        details: approvedTestimonials.error ? approvedTestimonials.error.message : `Retrieved ${approvedTestimonials.data?.length || 0} approved testimonials`
      });

      const allTestimonials = await DatabaseService.testimonials.getAll();
      this.results.apiTests.tests.push({
        name: 'Testimonials.getAll()',
        status: allTestimonials.error ? 'failed' : 'passed',
        details: allTestimonials.error ? allTestimonials.error.message : `Retrieved ${allTestimonials.data?.length || 0} total testimonials`
      });

    } catch (error) {
      this.results.apiTests.tests.push({
        name: 'Testimonials API',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testInquiriesAPI() {
    console.log('\n📨 Testing Inquiries API...');
    
    try {
      const allInquiries = await DatabaseService.inquiries.getAll();
      this.results.apiTests.tests.push({
        name: 'Inquiries.getAll()',
        status: allInquiries.error ? 'failed' : 'passed',
        details: allInquiries.error ? allInquiries.error.message : `Retrieved ${allInquiries.data?.length || 0} inquiries`
      });

      if (allInquiries.data && allInquiries.data.length > 0) {
        const firstInquiry = allInquiries.data[0];
        const singleInquiry = await DatabaseService.inquiries.getById(firstInquiry.id);
        this.results.apiTests.tests.push({
          name: 'Inquiries.getById()',
          status: singleInquiry.error ? 'failed' : 'passed',
          details: singleInquiry.error ? singleInquiry.error.message : `Retrieved inquiry from: ${singleInquiry.data?.name || 'Unknown'}`
        });
      }

    } catch (error) {
      this.results.apiTests.tests.push({
        name: 'Inquiries API',
        status: 'failed',
        details: error.message
      });
    }
  }

  async testFAQsAPI() {
    console.log('\n❓ Testing FAQs API...');
    
    try {
      const allFAQs = await DatabaseService.faqs.getAll();
      this.results.apiTests.tests.push({
        name: 'FAQs.getAll()',
        status: allFAQs.error ? 'failed' : 'passed',
        details: allFAQs.error ? allFAQs.error.message : `Retrieved ${allFAQs.data?.length || 0} FAQs`
      });

      const categories = await DatabaseService.faqCategories.getAll();
      this.results.apiTests.tests.push({
        name: 'FAQCategories.getAll()',
        status: categories.error ? 'failed' : 'passed',
        details: categories.error ? categories.error.message : `Retrieved ${categories.data?.length || 0} FAQ categories`
      });

    } catch (error) {
      this.results.apiTests.tests.push({
        name: 'FAQs API',
        status: 'failed',
        details: error.message
      });
    }
  }

  generateReport() {
    console.log('\n📊 Backend Integration Test Report');
    console.log('=' .repeat(60));

    const totalTests = this.results.apiTests.tests.length + 1; // +1 for connection test
    const connectionPassed = this.results.connection.status === 'passed' ? 1 : 0;
    const apiTestsPassed = this.results.apiTests.tests.filter(t => t.status === 'passed').length;
    const totalPassed = connectionPassed + apiTestsPassed;
    
    const overallStatus = totalPassed === totalTests ? 'PASSED' : 'FAILED';
    
    console.log(`\n🎯 Overall Status: ${overallStatus}`);
    console.log(`📈 Tests Passed: ${totalPassed}/${totalTests} (${Math.round((totalPassed/totalTests) * 100)}%)`);
    
    console.log('\n📋 Test Results:');
    console.log(`   🔌 Connection: ${this.results.connection.status.toUpperCase()}`);
    console.log(`       ${this.results.connection.details}`);
    
    console.log(`   📡 API Tests: ${apiTestsPassed}/${this.results.apiTests.tests.length} passed`);
    
    // Show failed tests
    const failedTests = this.results.apiTests.tests.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }

    // Show successful tests
    const passedTests = this.results.apiTests.tests.filter(t => t.status === 'passed');
    if (passedTests.length > 0) {
      console.log('\n✅ Successful Tests:');
      passedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }

    this.results.overall = {
      status: overallStatus.toLowerCase(),
      totalTests,
      passedTests: totalPassed,
      successRate: Math.round((totalPassed/totalTests) * 100)
    };

    this.results.apiTests.status = apiTestsPassed === this.results.apiTests.tests.length ? 'passed' : 'failed';

    return this.results;
  }

  async runAllTests() {
    console.log('🚀 Starting Backend Integration Tests');
    console.log('🕒 Started at:', new Date().toISOString());
    console.log('=' .repeat(60));

    const startTime = Date.now();

    try {
      // Test connection first
      const connectionOk = await this.testConnection();
      
      if (connectionOk) {
        // Run API tests only if connection is successful
        await this.testPropertiesAPI();
        await this.testUsersAPI();
        await this.testTestimonialsAPI();
        await this.testInquiriesAPI();
        await this.testFAQsAPI();
      } else {
        console.log('\n⚠️ Skipping API tests due to connection failure');
      }

    } catch (error) {
      console.error('❌ Critical error during testing:', error.message);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n⏱️  Tests completed in ${duration} seconds`);
    
    const results = this.generateReport();
    
    console.log(`\n💾 Backend integration with GCP services: ${results.overall.status.toUpperCase()}`);

    return results;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BackendIntegrationTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.overall.status === 'passed' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

export default BackendIntegrationTester;