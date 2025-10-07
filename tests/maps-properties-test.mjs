import { chromium } from 'playwright';

async function testMapsOnPropertiesPage() {
  console.log('🚀 Testing Google Maps on Properties Page...\n');
  
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
    if (text.toLowerCase().includes('google') || 
        text.toLowerCase().includes('maps') || 
        text.toLowerCase().includes('api') ||
        text.toLowerCase().includes('places')) {
      console.log(`📝 Console: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to Properties page...');
    await page.goto('http://localhost:5175/properties', { waitUntil: 'networkidle' });
    
    // Wait longer for API loading and components to mount
    console.log('⏳ Waiting for components to load and API to initialize...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔍 Checking Google Maps API Status...');
    const googleMapsStatus = await page.evaluate(() => {
      return {
        googleObject: typeof window.google !== 'undefined',
        mapsAPI: typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined',
        placesAPI: typeof window.google !== 'undefined' && 
                  typeof window.google.maps !== 'undefined' && 
                  typeof window.google.maps.places !== 'undefined',
        apiKey: window.GOOGLE_MAPS_API_KEY || import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || 'Not found'
      };
    });
    
    console.log(`Google Object Available: ${googleMapsStatus.googleObject ? '✅' : '❌'}`);
    console.log(`Maps API Loaded: ${googleMapsStatus.mapsAPI ? '✅' : '❌'}`);
    console.log(`Places API Available: ${googleMapsStatus.placesAPI ? '✅' : '❌'}`);
    
    console.log('\n🔍 Looking for Location Input Fields...');
    const locationInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll(
        'input[placeholder*="location"], input[placeholder*="Location"], ' +
        'input[placeholder*="Search"], input[placeholder*="search"], ' +
        'input[type="search"]'
      );
      
      return {
        count: inputs.length,
        placeholders: Array.from(inputs).map((input, i) => ({
          index: i,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className
        }))
      };
    });
    
    console.log(`Location Input Fields Found: ${locationInputs.count}`);
    locationInputs.placeholders.forEach(input => {
      console.log(`  ${input.index + 1}. "${input.placeholder}" (id: ${input.id || 'none'})`);
    });
    
    // Test Places Autocomplete
    if (locationInputs.count > 0) {
      console.log('\n🧪 Testing Places Autocomplete...');
      
      // Try the first location input
      const firstInput = page.locator('input').first();
      if (await firstInput.count() > 0) {
        console.log('Clicking first input and typing...');
        await firstInput.click();
        await firstInput.fill('Koramangala');
        await page.waitForTimeout(3000);
        
        const autocompleteElements = await page.evaluate(() => {
          const containers = document.querySelectorAll(
            '.pac-container, [role="listbox"], [class*="suggestion"], ' +
            '[class*="autocomplete"], [class*="dropdown"], [class*="place"]'
          );
          
          const suggestions = document.querySelectorAll(
            '.pac-item, [class*="suggestion"], [class*="place"], li'
          );
          
          return {
            containers: containers.length,
            suggestions: suggestions.length,
            containerClasses: Array.from(containers).map(el => el.className).slice(0, 3),
            suggestionTexts: Array.from(suggestions).map(el => el.textContent).slice(0, 5)
          };
        });
        
        console.log(`Autocomplete containers: ${autocompleteElements.containers}`);
        console.log(`Autocomplete suggestions: ${autocompleteElements.suggestions}`);
        if (autocompleteElements.suggestionTexts.length > 0) {
          console.log('Sample suggestions:', autocompleteElements.suggestionTexts);
        }
        
        if (autocompleteElements.containers > 0 || autocompleteElements.suggestions > 0) {
          console.log('✅ Places Autocomplete is working!');
        } else {
          console.log('⚠️ No autocomplete suggestions detected');
        }
      }
    }
    
    console.log('\n🗺️ Looking for Map Toggle Button...');
    const mapToggle = await page.locator('button:has-text("Map")').first();
    if (await mapToggle.count() > 0) {
      console.log('✅ Found Map view toggle button');
      
      console.log('🖱️ Clicking Map view...');
      await mapToggle.click();
      await page.waitForTimeout(5000); // Wait for map to load
      
      const mapElements = await page.evaluate(() => {
        const mapContainers = document.querySelectorAll('[id*="map"], [class*="map"], [data-testid*="map"]');
        const canvasElements = document.querySelectorAll('canvas');
        const gmElements = document.querySelectorAll('[class*="gm-"]');
        const staticMaps = document.querySelectorAll('img[src*="maps.googleapis.com"]');
        
        return {
          mapContainers: mapContainers.length,
          canvasElements: canvasElements.length,
          gmElements: gmElements.length,
          staticMaps: staticMaps.length,
          mapStyles: Array.from(mapContainers).map(el => ({
            id: el.id,
            className: el.className,
            hasChildren: el.children.length > 0
          })).slice(0, 3)
        };
      });
      
      console.log(`Map Containers: ${mapElements.mapContainers}`);
      console.log(`Canvas Elements: ${mapElements.canvasElements}`);
      console.log(`Google Maps Elements: ${mapElements.gmElements}`);
      console.log(`Static Maps: ${mapElements.staticMaps}`);
      
      if (mapElements.mapStyles.length > 0) {
        console.log('Map container details:', mapElements.mapStyles);
      }
      
      if (mapElements.mapContainers > 0 || mapElements.canvasElements > 0) {
        console.log('✅ Map view is displaying!');
      } else {
        console.log('⚠️ Map view may not be rendering properly');
      }
    } else {
      console.log('❌ Map toggle button not found');
    }
    
    console.log('\n🔍 Testing Filters Panel...');
    const filtersButton = page.locator('button:has-text("Filters")').first();
    if (await filtersButton.count() > 0) {
      console.log('✅ Found Filters button');
      await filtersButton.click();
      await page.waitForTimeout(2000);
      
      // Look for MultiLocationFilter
      const locationFilters = await page.evaluate(() => {
        const locationInputsInFilters = document.querySelectorAll(
          '[class*="filter"] input, .card input[placeholder*="location"]'
        );
        
        return {
          count: locationInputsInFilters.length,
          placeholders: Array.from(locationInputsInFilters).map(input => input.placeholder).slice(0, 3)
        };
      });
      
      console.log(`Location inputs in filters: ${locationFilters.count}`);
      if (locationFilters.placeholders.length > 0) {
        console.log('Filter placeholders:', locationFilters.placeholders);
      }
    }
    
    console.log('\n🚨 Checking for API Key Errors...');
    const apiKeyErrors = errors.filter(error => 
      error.toLowerCase().includes('api key') ||
      error.toLowerCase().includes('quota') ||
      error.toLowerCase().includes('billing') ||
      error.toLowerCase().includes('invalidkeymapError') ||
      error.toLowerCase().includes('missingkeymapError') ||
      error.toLowerCase().includes('unauthorized')
    );
    
    const loadingErrors = logs.filter(log => 
      log.toLowerCase().includes('failed') && 
      (log.toLowerCase().includes('google') || log.toLowerCase().includes('maps'))
    );
    
    console.log(`API Key Errors: ${apiKeyErrors.length === 0 ? '✅ None' : `❌ ${apiKeyErrors.length}`}`);
    if (apiKeyErrors.length > 0) {
      apiKeyErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (loadingErrors.length > 0) {
      console.log('⚠️ Loading Issues:');
      loadingErrors.forEach(log => console.log(`  - ${log}`));
    }
    
    console.log('\n📊 PROPERTIES PAGE MAPS INTEGRATION STATUS:');
    console.log('==============================================');
    console.log(`✅ Google Maps API Loaded: ${googleMapsStatus.mapsAPI ? 'YES' : 'NO'}`);
    console.log(`✅ Places API Available: ${googleMapsStatus.placesAPI ? 'YES' : 'NO'}`);
    console.log(`✅ Location Input Fields: ${locationInputs.count > 0 ? `YES (${locationInputs.count})` : 'NO'}`);
    console.log(`✅ API Key Errors: ${apiKeyErrors.length === 0 ? 'NONE' : `${apiKeyErrors.length} FOUND`}`);
    
    const overallStatus = googleMapsStatus.mapsAPI && googleMapsStatus.placesAPI && apiKeyErrors.length === 0 ? 
      '🎉 FULLY WORKING' : '⚠️ ISSUES DETECTED';
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
    
    if (!googleMapsStatus.mapsAPI) {
      console.log('\n💡 ISSUE: Google Maps API not loaded');
      console.log('- Check if API key is set in environment variables');
      console.log('- Check if components are properly importing the API');
      console.log('- Look for console errors during API loading');
    }
    
    if (!googleMapsStatus.placesAPI) {
      console.log('\n💡 ISSUE: Places API not available');
      console.log('- Places library may not be loaded with Maps API');
      console.log('- Check API script includes "libraries=places"');
    }
    
    // Wait longer to see if there are delayed loading issues
    console.log('\n⏳ Waiting for any delayed API loading...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testMapsOnPropertiesPage().catch(console.error);