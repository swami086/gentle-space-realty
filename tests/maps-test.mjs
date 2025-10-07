import { chromium } from 'playwright';

async function testGoogleMapsIntegration() {
  console.log('🚀 Starting Google Maps Integration Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'] 
  });
  
  const page = await browser.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.toLowerCase().includes('google') || text.toLowerCase().includes('maps') || text.toLowerCase().includes('api')) {
      console.log(`📝 Console: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
    
    // Wait for potential Maps API loading
    await page.waitForTimeout(5000);
    
    console.log('\n🔍 Checking Google Maps API Status...');
    const googleMapsStatus = await page.evaluate(() => {
      const hasGoogle = typeof window.google !== 'undefined';
      const hasMaps = hasGoogle && typeof window.google.maps !== 'undefined';
      const hasPlaces = hasMaps && typeof window.google.maps.places !== 'undefined';
      
      return {
        googleObject: hasGoogle,
        mapsAPI: hasMaps,
        placesAPI: hasPlaces,
        apiKey: window.GOOGLE_MAPS_API_KEY || 'Not found',
        loadingStatus: window.googleMapsLoadingStatus || 'Unknown'
      };
    });
    
    console.log(`Google Object Available: ${googleMapsStatus.googleObject ? '✅' : '❌'}`);
    console.log(`Maps API Loaded: ${googleMapsStatus.mapsAPI ? '✅' : '❌'}`);
    console.log(`Places API Available: ${googleMapsStatus.placesAPI ? '✅' : '❌'}`);
    
    console.log('\n🗺️ Looking for Map Elements...');
    const mapElements = await page.evaluate(() => {
      const mapContainers = document.querySelectorAll('[id*="map"], [class*="map"], [data-testid*="map"]');
      const staticMaps = document.querySelectorAll('img[src*="maps.googleapis.com"], img[src*="staticmap"]');
      const canvasElements = document.querySelectorAll('canvas');
      const googleElements = document.querySelectorAll('[class*="gm-"], [class*="google"]');
      
      return {
        mapContainers: mapContainers.length,
        staticMaps: staticMaps.length,
        canvasElements: canvasElements.length,
        googleElements: googleElements.length,
        staticMapUrls: Array.from(staticMaps).map(img => img.src).slice(0, 3)
      };
    });
    
    console.log(`Map Containers Found: ${mapElements.mapContainers}`);
    console.log(`Static Maps Found: ${mapElements.staticMaps}`);
    console.log(`Canvas Elements: ${mapElements.canvasElements}`);
    console.log(`Google-specific Elements: ${mapElements.googleElements}`);
    
    if (mapElements.staticMapUrls.length > 0) {
      console.log('📸 Static Map URLs:');
      mapElements.staticMapUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 100)}...`);
      });
    }
    
    console.log('\n🔍 Testing Location Input Fields...');
    const locationInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll(
        'input[placeholder*="location"], input[placeholder*="Location"], ' +
        'input[placeholder*="search"], input[placeholder*="city"], ' +
        'input[placeholder*="address"], input[type="search"]'
      );
      
      return {
        count: inputs.length,
        placeholders: Array.from(inputs).map(input => input.placeholder).slice(0, 5)
      };
    });
    
    console.log(`Location Input Fields Found: ${locationInputs.count}`);
    if (locationInputs.placeholders.length > 0) {
      console.log('Input Placeholders:', locationInputs.placeholders);
    }
    
    // Test Places Autocomplete if input fields exist
    if (locationInputs.count > 0) {
      console.log('\n📝 Testing Places Autocomplete...');
      const firstInput = page.locator('input[placeholder*="location"], input[placeholder*="Location"], input[type="search"]').first();
      
      if (await firstInput.count() > 0) {
        await firstInput.click();
        await firstInput.fill('New York');
        await page.waitForTimeout(3000);
        
        const autocompleteElements = await page.evaluate(() => {
          const suggestions = document.querySelectorAll(
            '.pac-container, [role="listbox"], [class*="suggestion"], [class*="autocomplete"], [class*="dropdown"]'
          );
          return suggestions.length;
        });
        
        console.log(`Autocomplete Suggestions Found: ${autocompleteElements > 0 ? '✅' : '❌'} (${autocompleteElements} elements)`);
      }
    }
    
    console.log('\n📄 Looking for Property Pages...');
    const propertyElements = await page.evaluate(() => {
      const properties = document.querySelectorAll('[class*="property"], [class*="listing"], [data-testid*="property"]');
      const propertyLinks = document.querySelectorAll('a[href*="property"], a[href*="/properties/"]');
      
      return {
        propertyElements: properties.length,
        propertyLinks: propertyLinks.length,
        firstLinkHref: propertyLinks[0]?.href || null
      };
    });
    
    console.log(`Property Elements: ${propertyElements.propertyElements}`);
    console.log(`Property Links: ${propertyElements.propertyLinks}`);
    
    // Test property page if available
    if (propertyElements.propertyLinks > 0 && propertyElements.firstLinkHref) {
      console.log('\n🏠 Testing Property Detail Page...');
      await page.goto(propertyElements.firstLinkHref, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const propertyMaps = await page.evaluate(() => {
        const maps = document.querySelectorAll('[id*="map"], [class*="map"], img[src*="maps.googleapis.com"]');
        return maps.length;
      });
      
      console.log(`Maps on Property Page: ${propertyMaps}`);
    }
    
    console.log('\n🚨 Checking for API Key Errors...');
    const apiKeyErrors = errors.filter(error => 
      error.toLowerCase().includes('api key') ||
      error.toLowerCase().includes('quota') ||
      error.toLowerCase().includes('billing') ||
      error.toLowerCase().includes('invalidkeymapError') ||
      error.toLowerCase().includes('missingkeymapError')
    );
    
    const apiKeyWarnings = logs.filter(log => 
      log.toLowerCase().includes('api key') ||
      log.toLowerCase().includes('billing') ||
      log.toLowerCase().includes('quota')
    );
    
    console.log(`API Key Errors: ${apiKeyErrors.length === 0 ? '✅ None' : `❌ ${apiKeyErrors.length}`}`);
    if (apiKeyErrors.length > 0) {
      apiKeyErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (apiKeyWarnings.length > 0) {
      console.log('⚠️ API Key Warnings:');
      apiKeyWarnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n📊 GOOGLE MAPS INTEGRATION STATUS REPORT:');
    console.log('==========================================');
    console.log(`✅ Google Maps API Loaded: ${googleMapsStatus.mapsAPI ? 'YES' : 'NO'}`);
    console.log(`✅ Places API Available: ${googleMapsStatus.placesAPI ? 'YES' : 'NO'}`);
    console.log(`✅ Map Elements Found: ${mapElements.mapContainers + mapElements.staticMaps + mapElements.canvasElements > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Location Inputs Found: ${locationInputs.count > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ API Key Errors: ${apiKeyErrors.length === 0 ? 'NONE' : `${apiKeyErrors.length} FOUND`}`);
    
    const overallStatus = googleMapsStatus.mapsAPI && apiKeyErrors.length === 0 ? '🎉 WORKING' : '⚠️ ISSUES DETECTED';
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
    
    if (!googleMapsStatus.mapsAPI) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('- Check if Google Maps JavaScript API is enabled');
      console.log('- Verify API key is correctly configured');
      console.log('- Check browser console for loading errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testGoogleMapsIntegration().catch(console.error);