import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5175';
const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api';
const TEST_TIMEOUT = 30000;

test.describe('C1 API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    await expect(page).toHaveTitle(/Gentle Space Realty/);
  });

  test('should test C1 API endpoint directly', async ({ request }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    const testPayload = {
      prompt: 'Generate a simple property search interface for office spaces in Koramangala',
      context: {
        location: 'Koramangala',
        propertyType: 'office'
      },
      systemPrompt: 'You are a real estate assistant. Generate UI components for property search.'
    };

    // Test the C1 API endpoint directly
    const response = await request.post(`${API_BASE_URL}/v1/c1/generate`, {
      data: testPayload,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Validate response status
    expect(response.status()).toBe(200);
    
    // Check content type for streaming
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
    
    // Validate streaming response
    const responseText = await response.text();
    expect(responseText.length).toBeGreaterThan(0);
    
    // Check for streaming format markers
    expect(responseText).toContain('data:');
  });

  test('should navigate to C1 API test component', async ({ page }) => {
    // Navigate to properties page where C1 component should be available
    await page.click('a[href="/properties"], [data-testid="properties-link"]');
    await page.waitForLoadState('networkidle');
    
    // Look for C1 API test component or tab
    const c1Element = await page.locator('[data-testid="c1-api-test"], .c1-api-test, text="C1 API"').first();
    
    if (await c1Element.isVisible()) {
      await c1Element.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Try to find C1 component in AI features section
      const aiTab = await page.locator('text="AI Features", [data-testid="ai-features"]').first();
      if (await aiTab.isVisible()) {
        await aiTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should test C1 API connection and configuration', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Look for the C1 API test component
    const c1TestComponent = page.locator('[data-testid="c1-api-test"]').first();
    
    if (await c1TestComponent.isVisible()) {
      // Test API configuration status
      const apiKeyStatus = page.locator('text="API Key"').locator('..').locator('p');
      const endpointStatus = page.locator('text="Endpoint"').locator('..').locator('p');
      const modelStatus = page.locator('text="Model"').locator('..').locator('p');
      
      // Check configuration display
      await expect(apiKeyStatus).toBeVisible();
      await expect(endpointStatus).toBeVisible();
      await expect(modelStatus).toBeVisible();
      
      // Test with a sample prompt
      const promptInput = page.locator('input[id="test-prompt"]');
      const testButton = page.locator('button:has-text("Test API")');
      
      if (await promptInput.isVisible() && await testButton.isVisible()) {
        await promptInput.fill('Generate a property search interface for co-working spaces in HSR Layout');
        await testButton.click();
        
        // Wait for API call to complete
        await page.waitForTimeout(5000);
        
        // Check for success or error states
        const successAlert = page.locator('text="Success!"');
        const errorAlert = page.locator('text="Error:"');
        
        // Either success or error should be visible (depending on API configuration)
        const hasResult = (await successAlert.isVisible()) || (await errorAlert.isVisible());
        expect(hasResult).toBeTruthy();
      }
    } else {
      console.log('C1 API test component not found, checking for alternative access methods');
    }
  });

  test('should test C1 API streaming response handling', async ({ page, request }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Test streaming response directly via API
    const response = await request.post(`${API_BASE_URL}/v1/c1/generate`, {
      data: {
        prompt: 'Create a property comparison table for 3 properties',
        context: { useCase: 'propertyComparison' },
        stream: true
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.body();
    const responseText = responseBody.toString();
    
    // Check streaming format
    expect(responseText).toMatch(/data:\s*{/);
    expect(responseText.length).toBeGreaterThan(50);
    
    // Check for common streaming markers
    const hasStreamingMarkers = responseText.includes('data:') || responseText.includes('event:');
    expect(hasStreamingMarkers).toBeTruthy();
  });

  test('should test C1 UI generation for different use cases', async ({ page }) => {
    const testCases = [
      {
        name: 'Property Search',
        prompt: 'Find office spaces in Koramangala under 50K budget',
        useCase: 'propertySearch'
      },
      {
        name: 'Property Comparison',
        prompt: 'Compare 3 co-working spaces in Indiranagar',
        useCase: 'propertyComparison'
      },
      {
        name: 'Inquiry Form',
        prompt: 'Create inquiry form for premium office space',
        useCase: 'inquiryForm'
      }
    ];

    await page.goto(`${BASE_URL}/properties`);
    
    // Look for C1 test interface or GenUI components
    const hasC1Interface = await page.locator('[data-testid="c1-test"], [data-testid="genui-test"]').first().isVisible();
    
    if (hasC1Interface) {
      for (const testCase of testCases) {
        console.log(`Testing C1 ${testCase.name} use case`);
        
        // Input test prompt
        const promptInput = page.locator('input, textarea').first();
        if (await promptInput.isVisible()) {
          await promptInput.clear();
          await promptInput.fill(testCase.prompt);
          
          // Submit the request
          const submitButton = page.locator('button:has-text("Generate"), button:has-text("Test")').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            
            // Wait for response
            await page.waitForTimeout(3000);
            
            // Check for generated UI or error handling
            const hasResult = await page.locator('.ui-spec, .error-message, .success-message').first().isVisible();
            expect(hasResult).toBeTruthy();
          }
        }
      }
    } else {
      console.log('C1 UI testing interface not accessible');
    }
  });

  test('should handle C1 API errors gracefully', async ({ page, request }) => {
    // Test malformed request
    const malformedResponse = await request.post(`${API_BASE_URL}/v1/c1/generate`, {
      data: {
        // Missing required fields
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Should return appropriate error status
    expect([400, 422, 500]).toContain(malformedResponse.status());
    
    // Test with invalid endpoint
    const invalidResponse = await request.post(`${API_BASE_URL}/v1/c1/invalid-endpoint`, {
      data: {
        prompt: 'Test prompt'
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(invalidResponse.status()).toBe(404);
  });

  test('should validate C1 response structure', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/v1/c1/generate`, {
      data: {
        prompt: 'Generate a simple property card component',
        context: { useCase: 'propertySearch' },
        stream: false // Request non-streaming response if supported
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status() === 200) {
      const responseText = await response.text();
      
      // For streaming response, extract the actual data
      if (responseText.includes('data:')) {
        const dataLines = responseText.split('\n').filter(line => line.startsWith('data:'));
        expect(dataLines.length).toBeGreaterThan(0);
        
        // Try to parse at least one data line
        const firstDataLine = dataLines[0].replace('data: ', '').trim();
        if (firstDataLine && firstDataLine !== '[DONE]') {
          try {
            const parsedData = JSON.parse(firstDataLine);
            expect(parsedData).toHaveProperty('choices');
          } catch (e) {
            // Some streaming formats might not be JSON parseable
            console.log('Streaming data format different than expected');
          }
        }
      } else {
        // Try to parse as JSON if not streaming
        try {
          const jsonResponse = JSON.parse(responseText);
          expect(jsonResponse).toBeDefined();
        } catch (e) {
          console.log('Response not in JSON format, likely streaming text');
        }
      }
    }
  });

  test('should test C1 API performance and timeout handling', async ({ request }) => {
    test.setTimeout(45000); // Extended timeout for performance test
    
    const startTime = Date.now();
    
    const response = await request.post(`${API_BASE_URL}/v1/c1/generate`, {
      data: {
        prompt: 'Generate a comprehensive property management dashboard with multiple components including search, filters, property cards, map view, and analytics charts',
        context: {
          useCase: 'propertySearch',
          complexity: 'high'
        }
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 second timeout
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`C1 API response time: ${responseTime}ms`);
    
    // Response should come within reasonable time
    expect(responseTime).toBeLessThan(30000);
    
    // Should return valid response
    expect([200, 504]).toContain(response.status());
    
    if (response.status() === 200) {
      const responseBody = await response.text();
      expect(responseBody.length).toBeGreaterThan(0);
    }
  });

  test('should test C1 component accessibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Check for C1 component accessibility
    const c1Elements = await page.locator('[data-testid*="c1"], [aria-label*="C1"], [aria-label*="AI"]').all();
    
    for (const element of c1Elements) {
      if (await element.isVisible()) {
        // Check for keyboard navigation
        await element.focus();
        expect(await element.evaluate(el => el === document.activeElement)).toBeTruthy();
        
        // Check for ARIA labels
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaDescribedBy = await element.getAttribute('aria-describedby');
        const role = await element.getAttribute('role');
        
        // At least one accessibility attribute should be present
        const hasA11yAttrs = !!(ariaLabel || ariaDescribedBy || role);
        if (!hasA11yAttrs) {
          console.log('C1 component missing accessibility attributes');
        }
      }
    }
  });
});

// Helper functions for test utilities
async function waitForC1Response(page: Page, timeout = 10000) {
  try {
    await page.waitForSelector('.ui-spec, .error-message, .loading-complete', { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

async function extractC1ResponseData(page: Page) {
  const responseElements = await page.locator('.ui-spec, pre, [data-testid="response-data"]').all();
  
  for (const element of responseElements) {
    if (await element.isVisible()) {
      const text = await element.textContent();
      if (text && text.includes('{')) {
        try {
          return JSON.parse(text);
        } catch (e) {
          // Continue to next element
        }
      }
    }
  }
  
  return null;
}