import { test, expect, Page } from '@playwright/test';

interface NetworkRequest {
  url: string;
  method: string;
  response?: any;
  status?: number;
}

test.describe('Admin Properties Management Debug', () => {
  let networkRequests: NetworkRequest[] = [];
  let consoleMessages: string[] = [];
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset arrays for each test
    networkRequests = [];
    consoleMessages = [];
    errors = [];

    // Listen to all network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });

    // Listen to network responses
    page.on('response', async response => {
      const request = networkRequests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        try {
          if (response.url().includes('/api/') && response.status() === 200) {
            const responseBody = await response.json();
            request.response = responseBody;
          }
        } catch (e) {
          // Response might not be JSON
        }
      }
    });

    // Listen to console messages
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Listen to page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  test('Debug admin properties page display issue', async ({ page }) => {
    console.log('🔍 Starting admin properties debug test...');

    // Navigate to the main properties page first to establish baseline
    await page.goto('http://localhost:5174/properties');
    await page.waitForLoadState('networkidle');
    
    // Count properties on main page
    const mainPageProperties = await page.locator('[data-testid="property-card"], .property-card, [class*="property"], .grid > div').count();
    console.log(`📊 Properties on main page: ${mainPageProperties}`);

    // Check the main properties API call
    const mainPropertiesApiCall = networkRequests.find(req => 
      req.url.includes('/api/v1/properties') && req.method === 'GET'
    );

    if (mainPropertiesApiCall && mainPropertiesApiCall.response) {
      const mainApiCount = Array.isArray(mainPropertiesApiCall.response) 
        ? mainPropertiesApiCall.response.length 
        : mainPropertiesApiCall.response.data?.length || 0;
      console.log(`📡 Main API returned ${mainApiCount} properties`);
    }

    // Clear network requests array for admin page
    networkRequests = [];
    
    // Navigate to admin page - try multiple possible routes
    const adminRoutes = ['/admin', '/admin/properties', '/dashboard/admin', '/dashboard/properties'];
    let adminPageFound = false;
    let adminUrl = '';

    for (const route of adminRoutes) {
      try {
        console.log(`🔍 Trying admin route: ${route}`);
        await page.goto(`http://localhost:5174${route}`, { waitUntil: 'networkidle', timeout: 10000 });
        
        // Check if we're on an admin page (look for admin indicators)
        const isAdminPage = await page.locator('text=/admin|manage|dashboard/i').first().isVisible({ timeout: 5000 });
        const hasPropertyList = await page.locator('[data-testid="property-card"], .property-card, [class*="property"], .grid > div, table tr, .admin-property').count() > 0;
        
        if (isAdminPage || hasPropertyList) {
          adminPageFound = true;
          adminUrl = route;
          console.log(`✅ Found admin page at: ${route}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Route ${route} failed: ${error.message}`);
        continue;
      }
    }

    if (!adminPageFound) {
      console.log('❌ Could not find admin properties page. Checking available routes...');
      
      // Check what routes are available by inspecting navigation links
      const navLinks = await page.locator('a[href*="/"]').all();
      const availableRoutes = [];
      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        if (href) availableRoutes.push(href);
      }
      console.log('🔗 Available routes:', availableRoutes);
      
      // Also check for any admin-related elements on current page
      const adminElements = await page.locator('text=/admin|manage|dashboard|properties/i').all();
      console.log(`🎯 Found ${adminElements.length} admin-related elements on page`);
      
      return; // Exit if no admin page found
    }

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for dynamic content

    console.log(`📍 Successfully loaded admin page: ${adminUrl}`);

    // 1. Count visible properties on admin page
    const adminPropertySelectors = [
      '[data-testid="property-card"]',
      '.property-card',
      '[class*="property"]',
      '.grid > div',
      'table tr:not(:first-child)', // Table rows excluding header
      '.admin-property',
      '[data-testid="admin-property"]',
      '.property-item',
      '.property-list-item'
    ];

    let adminPageProperties = 0;
    let usedSelector = '';

    for (const selector of adminPropertySelectors) {
      const count = await page.locator(selector).count();
      if (count > adminPageProperties) {
        adminPageProperties = count;
        usedSelector = selector;
      }
    }

    console.log(`📊 Properties visible on admin page: ${adminPageProperties} (using selector: ${usedSelector})`);

    // 2. Analyze network requests to admin page
    console.log('\n🌐 Network Requests Analysis:');
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    
    apiRequests.forEach(req => {
      console.log(`📡 ${req.method} ${req.url} - Status: ${req.status || 'pending'}`);
      if (req.response && req.url.includes('properties')) {
        const dataCount = Array.isArray(req.response) 
          ? req.response.length 
          : req.response.data?.length || req.response.properties?.length || 0;
        console.log(`   └── Response contains ${dataCount} properties`);
      }
    });

    // 3. Look for pagination controls
    const paginationElements = await page.locator('text=/page|next|previous|more|load/i, [class*="pagination"], [class*="pager"], button[class*="load"], .load-more').count();
    console.log(`📄 Pagination elements found: ${paginationElements}`);

    if (paginationElements > 0) {
      console.log('🔍 Pagination controls detected - checking pagination settings');
      
      // Look for items per page controls
      const itemsPerPageControl = await page.locator('select[name*="limit"], select[name*="page"], input[name*="limit"], text=/items per page/i').first();
      if (await itemsPerPageControl.isVisible()) {
        const currentLimit = await itemsPerPageControl.inputValue();
        console.log(`📋 Items per page limit: ${currentLimit}`);
      }
    }

    // 4. Check for filtering controls
    const filterElements = await page.locator('input[placeholder*="search"], input[placeholder*="filter"], select[name*="filter"], [class*="filter"], [class*="search"]').count();
    console.log(`🔍 Filter/search elements found: ${filterElements}`);

    if (filterElements > 0) {
      console.log('🎛️ Filter controls detected - checking active filters');
      
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="filter"]').first();
      if (await searchInput.isVisible()) {
        const searchValue = await searchInput.inputValue();
        console.log(`🔍 Search filter value: "${searchValue}"`);
      }
      
      const selectFilters = page.locator('select[name*="filter"], select[class*="filter"]');
      const selectCount = await selectFilters.count();
      for (let i = 0; i < selectCount; i++) {
        const select = selectFilters.nth(i);
        const value = await select.inputValue();
        const name = await select.getAttribute('name') || `filter-${i}`;
        console.log(`📝 Filter ${name}: "${value}"`);
      }
    }

    // 5. Check console errors and logs
    console.log('\n🐛 Console Messages:');
    consoleMessages.forEach(msg => console.log(`   ${msg}`));
    
    console.log('\n❌ JavaScript Errors:');
    errors.forEach(error => console.log(`   ${error}`));

    // 6. Compare API data with displayed properties
    const propertiesApiCall = networkRequests.find(req => 
      req.url.includes('/api/v1/properties') && req.method === 'GET'
    );

    if (propertiesApiCall && propertiesApiCall.response) {
      const apiCount = Array.isArray(propertiesApiCall.response) 
        ? propertiesApiCall.response.length 
        : propertiesApiCall.response.data?.length || propertiesApiCall.response.properties?.length || 0;
      
      console.log(`\n📊 Data Comparison:`);
      console.log(`   API returned: ${apiCount} properties`);
      console.log(`   Page displays: ${adminPageProperties} properties`);
      console.log(`   Difference: ${apiCount - adminPageProperties} missing properties`);

      // If there's a mismatch, let's investigate further
      if (apiCount !== adminPageProperties && apiCount > 0) {
        console.log('\n🔍 Investigating data mismatch...');
        
        // Check if response is paginated
        if (propertiesApiCall.response.pagination || propertiesApiCall.response.meta) {
          console.log('📄 API response includes pagination metadata');
          const pagination = propertiesApiCall.response.pagination || propertiesApiCall.response.meta;
          console.log(`   Total items: ${pagination.total || pagination.totalItems || 'unknown'}`);
          console.log(`   Current page: ${pagination.page || pagination.currentPage || 'unknown'}`);
          console.log(`   Items per page: ${pagination.limit || pagination.itemsPerPage || 'unknown'}`);
        }
        
        // Sample some property data
        const properties = Array.isArray(propertiesApiCall.response) 
          ? propertiesApiCall.response 
          : propertiesApiCall.response.data || propertiesApiCall.response.properties || [];
          
        if (properties.length > 0) {
          console.log('\n📋 Sample property data from API:');
          console.log(`   First property ID: ${properties[0]?.id || 'unknown'}`);
          console.log(`   Last property ID: ${properties[properties.length - 1]?.id || 'unknown'}`);
          console.log(`   Property fields: ${Object.keys(properties[0] || {}).join(', ')}`);
        }
      }
    } else {
      console.log('\n❌ No properties API call found in network requests');
    }

    // 7. Check for loading states or skeleton placeholders
    const loadingElements = await page.locator('text=/loading|skeleton/, [class*="loading"], [class*="skeleton"], .spinner').count();
    console.log(`⏳ Loading/skeleton elements: ${loadingElements}`);

    // 8. Take a screenshot for visual inspection
    await page.screenshot({ 
      path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-properties-debug.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as admin-properties-debug.png');

    // 9. Try to interact with pagination if it exists
    const loadMoreButton = page.locator('button:has-text("Load More"), button:has-text("Show More"), button[class*="load"]');
    if (await loadMoreButton.isVisible()) {
      console.log('🔄 Found "Load More" button, clicking it...');
      await loadMoreButton.click();
      await page.waitForTimeout(2000);
      
      const newCount = await page.locator(usedSelector).count();
      console.log(`📊 After clicking "Load More": ${newCount} properties visible`);
    }

    // 10. Final summary
    console.log('\n📋 DEBUGGING SUMMARY:');
    console.log(`   Expected properties: 18`);
    console.log(`   Actually displayed: ${adminPageProperties}`);
    console.log(`   Admin page URL: ${adminUrl}`);
    console.log(`   API calls made: ${apiRequests.length}`);
    console.log(`   Console errors: ${errors.length}`);
    console.log(`   Pagination controls: ${paginationElements > 0 ? 'Yes' : 'No'}`);
    console.log(`   Filter controls: ${filterElements > 0 ? 'Yes' : 'No'}`);

    // Assertions for the test
    expect(adminPageProperties).toBeGreaterThan(0); // Should show some properties
    expect(errors.length).toBe(0); // Should not have JavaScript errors
  });
});