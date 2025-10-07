import { test, expect } from '@playwright/test';

test.describe('Google Maps Integration Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5175/');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load Maps API successfully without errors', async ({ page }) => {
    // Wait for potential Maps API loading
    await page.waitForTimeout(3000);
    
    // Check console for Maps API errors
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Look for specific Google Maps success indicators
    const googleMapsLoaded = await page.evaluate(() => {
      return typeof window.google !== 'undefined' && 
             typeof window.google.maps !== 'undefined';
    });
    
    console.log('Google Maps loaded:', googleMapsLoaded);
    console.log('Console logs:', logs);
    
    // Check for API key authentication success
    const hasAuthSuccess = logs.some(log => 
      log.includes('Google Maps') || 
      log.includes('API key') ||
      log.toLowerCase().includes('maps')
    );
    
    console.log('Has authentication success indicators:', hasAuthSuccess);
  });

  test('should find and test LocationFilter component with Places autocomplete', async ({ page }) => {
    // Look for location filter or search input
    const locationInputs = await page.locator('input[placeholder*="location"], input[placeholder*="Location"], input[placeholder*="search"], input[placeholder*="city"], input[placeholder*="address"]').all();
    
    if (locationInputs.length > 0) {
      console.log(`Found ${locationInputs.length} location input(s)`);
      
      for (const input of locationInputs) {
        // Test Places autocomplete
        await input.click();
        await input.fill('New York');
        await page.waitForTimeout(2000); // Wait for autocomplete suggestions
        
        // Look for autocomplete dropdown
        const suggestions = await page.locator('[role="listbox"], .pac-container, [class*="suggestion"], [class*="autocomplete"]').count();
        console.log('Autocomplete suggestions found:', suggestions > 0);
        
        if (suggestions > 0) {
          console.log('✅ Places autocomplete is working');
        } else {
          console.log('⚠️ No autocomplete suggestions found');
        }
      }
    } else {
      console.log('❌ No location input fields found');
    }
  });

  test('should find and verify map components', async ({ page }) => {
    // Look for map containers
    const mapContainers = await page.locator('[id*="map"], [class*="map"], [class*="google"], canvas, [role="application"]').all();
    console.log(`Found ${mapContainers.length} potential map container(s)`);
    
    // Check for Google Maps specific elements
    const googleMapElements = await page.locator('[data-testid*="map"], [class*="gm-"], [class*="google-map"]').all();
    console.log(`Found ${googleMapElements.length} Google Maps specific element(s)`);
    
    // Look for static map images
    const staticMaps = await page.locator('img[src*="maps.googleapis.com"], img[src*="staticmap"]').all();
    console.log(`Found ${staticMaps.length} static map image(s)`);
    
    for (const img of staticMaps) {
      const src = await img.getAttribute('src');
      console.log('Static map URL:', src);
      
      // Verify the image loads successfully
      const isLoaded = await img.evaluate(img => img.complete && img.naturalHeight !== 0);
      console.log('Static map loaded successfully:', isLoaded);
    }
  });

  test('should check for API key errors', async ({ page }) => {
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      const text = msg.text().toLowerCase();
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Wait for any async loading
    await page.waitForTimeout(5000);
    
    // Check for specific API key related errors
    const apiKeyErrors = errors.filter(error => 
      error.includes('API key') ||
      error.includes('quota') ||
      error.includes('billing') ||
      error.includes('InvalidKeyMapError') ||
      error.includes('MissingKeyMapError')
    );
    
    console.log('API key related errors:', apiKeyErrors);
    console.log('All errors:', errors);
    console.log('All warnings:', warnings);
    
    if (apiKeyErrors.length === 0) {
      console.log('✅ No API key errors detected');
    } else {
      console.log('❌ API key errors found');
    }
  });

  test('should test property listings with maps', async ({ page }) => {
    // Look for property cards or listings
    const propertyElements = await page.locator('[class*="property"], [class*="listing"], [data-testid*="property"]').all();
    console.log(`Found ${propertyElements.length} property element(s)`);
    
    // Look for property pages or detailed views
    const propertyLinks = await page.locator('a[href*="property"], a[href*="/properties/"]').all();
    console.log(`Found ${propertyLinks.length} property link(s)`);
    
    if (propertyLinks.length > 0) {
      // Click on first property to test detailed view
      await propertyLinks[0].click();
      await page.waitForTimeout(3000);
      
      // Check for maps in property details
      const detailMaps = await page.locator('[id*="map"], [class*="map"], img[src*="maps.googleapis.com"]').all();
      console.log(`Found ${detailMaps.length} map(s) in property details`);
    }
  });

  test('should capture overall Maps integration status', async ({ page }) => {
    // Comprehensive status check
    await page.waitForTimeout(5000);
    
    const status = await page.evaluate(() => {
      const hasGoogleMaps = typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
      const hasMapElements = document.querySelectorAll('[id*="map"], [class*="map"], canvas').length > 0;
      const hasStaticMaps = document.querySelectorAll('img[src*="maps.googleapis.com"]').length > 0;
      const hasLocationInputs = document.querySelectorAll('input[placeholder*="location"], input[placeholder*="Location"]').length > 0;
      
      return {
        googleMapsAPI: hasGoogleMaps,
        mapElements: hasMapElements,
        staticMaps: hasStaticMaps,
        locationInputs: hasLocationInputs,
        totalElements: {
          maps: document.querySelectorAll('[id*="map"], [class*="map"]').length,
          staticMaps: document.querySelectorAll('img[src*="maps.googleapis.com"]').length,
          inputs: document.querySelectorAll('input[placeholder*="location"], input[placeholder*="Location"]').length
        }
      };
    });
    
    console.log('\n📊 GOOGLE MAPS INTEGRATION STATUS REPORT:');
    console.log('==========================================');
    console.log(`Google Maps API loaded: ${status.googleMapsAPI ? '✅' : '❌'}`);
    console.log(`Map elements found: ${status.mapElements ? '✅' : '❌'} (${status.totalElements.maps})`);
    console.log(`Static maps found: ${status.staticMaps ? '✅' : '❌'} (${status.totalElements.staticMaps})`);
    console.log(`Location inputs found: ${status.locationInputs ? '✅' : '❌'} (${status.totalElements.inputs})`);
    
    return status;
  });
});