import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const propertySearchCounter = new Counter('property_searches');
const inquirySubmissionCounter = new Counter('inquiry_submissions');

// Test configuration
export const options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - normal load
    load_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'load' },
    },
    
    // Stress test - high load
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '2m', target: 100 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at peak
        { duration: '2m', target: 200 }, // Ramp up more
        { duration: '3m', target: 200 }, // Peak load
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'stress' },
    },
    
    // Spike test - sudden load increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },   // Normal load
        { duration: '10s', target: 500 }, // Spike
        { duration: '1m', target: 500 },  // Maintain spike
        { duration: '10s', target: 10 },  // Back to normal
        { duration: '1m', target: 10 },   // Recovery
      ],
      tags: { test_type: 'spike' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.02'],   // Error rate under 2%
    error_rate: ['rate<0.05'],        // Custom error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testProperties = [];
const testUsers = [];

// Setup function - runs once
export function setup() {
  console.log('Starting load test setup...');
  
  // Create test data
  return {
    baseUrl: BASE_URL,
    testPropertyId: 'test-property-id-123',
    adminToken: 'test-admin-token',
  };
}

// Main test function
export default function(data) {
  const testScenario = Math.random();
  
  if (testScenario < 0.6) {
    // 60% - Property search and browsing
    testPropertySearch(data);
  } else if (testScenario < 0.8) {
    // 20% - Property details viewing
    testPropertyDetails(data);
  } else if (testScenario < 0.95) {
    // 15% - Inquiry submission
    testInquirySubmission(data);
  } else {
    // 5% - Admin operations
    testAdminOperations(data);
  }
  
  sleep(1); // Wait between requests
}

function testPropertySearch(data) {
  const searchQueries = [
    '',
    'apartment',
    'house',
    'commercial',
    'San Francisco',
    'New York',
    'luxury',
    '3 bedroom',
    'pool',
    'garden',
  ];
  
  const priceRanges = [
    { min: 200000, max: 500000 },
    { min: 500000, max: 1000000 },
    { min: 1000000, max: 2000000 },
  ];
  
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const priceRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
  
  const params = {
    search: query,
    'priceRange[min]': priceRange.min,
    'priceRange[max]': priceRange.max,
    page: Math.floor(Math.random() * 5) + 1,
    limit: 20,
  };
  
  const response = http.get(`${data.baseUrl}/api/properties`, { params });
  
  const isSuccess = check(response, {
    'property search status is 200': (r) => r.status === 200,
    'property search has data': (r) => r.json('data.properties') !== undefined,
    'property search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  propertySearchCounter.add(1);
  errorRate.add(!isSuccess);
}

function testPropertyDetails(data) {
  // Simulate viewing property details
  const propertyId = `property-${Math.floor(Math.random() * 500) + 1}`;
  
  const response = http.get(`${data.baseUrl}/api/properties/${propertyId}`);
  
  const isSuccess = check(response, {
    'property details status is 200 or 404': (r) => [200, 404].includes(r.status),
    'property details response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  if (response.status === 200) {
    check(response, {
      'property details has complete data': (r) => {
        const data = r.json('data');
        return data && data.title && data.price && data.location && data.features;
      }
    });
  }
  
  errorRate.add(!isSuccess);
}

function testInquirySubmission(data) {
  const inquiryData = {
    propertyId: data.testPropertyId,
    customerName: `Test Customer ${Math.floor(Math.random() * 10000)}`,
    customerEmail: `test${Math.floor(Math.random() * 10000)}@example.com`,
    customerPhone: '+1-555-0123',
    message: 'I am interested in this property. Please contact me to schedule a viewing.',
  };
  
  const response = http.post(
    `${data.baseUrl}/api/inquiries`,
    JSON.stringify(inquiryData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const isSuccess = check(response, {
    'inquiry submission status is 201': (r) => r.status === 201,
    'inquiry submission has id': (r) => r.json('data.id') !== undefined,
    'inquiry submission response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  inquirySubmissionCounter.add(1);
  errorRate.add(!isSuccess);
  
  // Check for rate limiting
  if (response.status === 429) {
    check(response, {
      'rate limit has proper error message': (r) => r.json('error').includes('Rate limit'),
      'rate limit has retry-after header': (r) => r.headers['Retry-After'] !== undefined,
    });
  }
}

function testAdminOperations(data) {
  // Simulate admin authentication
  const loginResponse = http.post(
    `${data.baseUrl}/api/admin/auth`,
    JSON.stringify({
      username: 'test_admin',
      password: 'TestPassword123!',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const isLoginSuccess = check(loginResponse, {
    'admin login status is 200 or 401': (r) => [200, 401].includes(r.status),
    'admin login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (loginResponse.status === 200) {
    const token = loginResponse.json('data.accessToken');
    
    // Test inquiry management
    const inquiriesResponse = http.get(
      `${data.baseUrl}/api/inquiries`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    check(inquiriesResponse, {
      'admin inquiries list status is 200': (r) => r.status === 200,
      'admin inquiries list has data': (r) => r.json('data.inquiries') !== undefined,
      'admin inquiries response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    // Test property management
    const propertiesResponse = http.get(
      `${data.baseUrl}/api/properties`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    check(propertiesResponse, {
      'admin properties list status is 200': (r) => r.status === 200,
      'admin properties response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  
  errorRate.add(!isLoginSuccess);
}

// Test large dataset performance
export function testLargeDataset() {
  // This function tests performance with 500+ properties
  const batchSize = 50;
  const totalProperties = 500;
  const batches = Math.ceil(totalProperties / batchSize);
  
  console.log(`Testing large dataset performance with ${totalProperties} properties in ${batches} batches`);
  
  for (let batch = 0; batch < batches; batch++) {
    const response = http.get(`${BASE_URL}/api/properties`, {
      params: {
        page: batch + 1,
        limit: batchSize,
      },
    });
    
    check(response, {
      [`large dataset batch ${batch + 1} status is 200`]: (r) => r.status === 200,
      [`large dataset batch ${batch + 1} response time < 1000ms`]: (r) => r.timings.duration < 1000,
      [`large dataset batch ${batch + 1} has properties`]: (r) => {
        const data = r.json('data');
        return data && Array.isArray(data.properties);
      },
    });
    
    sleep(0.1); // Small delay between batch requests
  }
}

// Database performance test
export function testDatabasePerformance() {
  console.log('Testing database performance with complex queries');
  
  // Test complex search with multiple filters
  const complexSearchResponse = http.get(`${BASE_URL}/api/properties`, {
    params: {
      search: 'luxury apartment',
      type: 'apartment',
      'priceRange[min]': 500000,
      'priceRange[max]': 2000000,
      location: 'San Francisco',
      bedrooms: 2,
      bathrooms: 2,
    },
  });
  
  check(complexSearchResponse, {
    'complex search status is 200': (r) => r.status === 200,
    'complex search response time < 800ms': (r) => r.timings.duration < 800,
    'complex search returns results': (r) => r.json('data.properties') !== undefined,
  });
  
  // Test property with many inquiries
  const propertyWithInquiriesResponse = http.get(`${BASE_URL}/api/properties/popular-property-123/inquiries`);
  
  check(propertyWithInquiriesResponse, {
    'property inquiries status is 200 or 404': (r) => [200, 404].includes(r.status),
    'property inquiries response time < 600ms': (r) => r.timings.duration < 600,
  });
}

// Memory usage test
export function testMemoryUsage() {
  console.log('Testing memory usage with large responses');
  
  // Request large datasets to test memory handling
  const largeDataResponse = http.get(`${BASE_URL}/api/properties`, {
    params: {
      limit: 100, // Large page size
      include: 'images,location,features', // Include all data
    },
  });
  
  check(largeDataResponse, {
    'large data response status is 200': (r) => r.status === 200,
    'large data response time < 2000ms': (r) => r.timings.duration < 2000,
    'large data response has complete data': (r) => {
      const data = r.json('data');
      return data && data.properties && data.properties.length > 0;
    },
  });
}

// Concurrent user simulation
export function testConcurrentUsers() {
  console.log('Testing concurrent user scenarios');
  
  const scenarios = [
    () => testPropertySearch({ baseUrl: BASE_URL }),
    () => testPropertyDetails({ baseUrl: BASE_URL, testPropertyId: 'test-123' }),
    () => testInquirySubmission({ baseUrl: BASE_URL, testPropertyId: 'test-123' }),
  ];
  
  // Simulate different user behaviors concurrently
  const scenarioIndex = Math.floor(Math.random() * scenarios.length);
  scenarios[scenarioIndex]();
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed. Cleaning up...');
  // Cleanup code would go here if needed
}

// Helper function to generate test data
function generateTestProperty(index) {
  return {
    title: `Load Test Property ${index}`,
    description: `This is a test property generated for load testing purposes. Property number ${index}.`,
    type: ['house', 'apartment', 'commercial'][index % 3],
    price: 200000 + (index * 10000),
    location: {
      address: `${1000 + index} Test Street`,
      city: ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Houston'][index % 5],
      state: ['CA', 'NY', 'IL', 'TX'][index % 4],
      zipcode: `${10000 + index}`,
    },
    features: {
      bedrooms: (index % 5) + 1,
      bathrooms: (index % 3) + 1,
      squareFootage: 800 + (index * 50),
      parking: index % 2 === 0,
      garden: index % 3 === 0,
      pool: index % 5 === 0,
    },
    status: 'available',
  };
}

// Export functions for specific test scenarios
export { testLargeDataset, testDatabasePerformance, testMemoryUsage, testConcurrentUsers };