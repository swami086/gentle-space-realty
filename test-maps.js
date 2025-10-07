import puppeteer from 'puppeteer';

async function testGoogleMapsIntegration() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting Google Maps Integration Test...\n');
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    page = await browser.newPage();
    
    // Set up console monitoring
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Navigate to localhost
    console.log('📡 Navigating to http://localhost:5176...');
    await page.goto('http://localhost:5176', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // Wait a bit for any async API loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if Google Maps API is loaded
    const googleMapsLoaded = await page.evaluate(() => {
      return !!(window.google && window.google.maps);
    });
    
    console.log(`📍 Google Maps API loaded: ${googleMapsLoaded ? '✅ YES' : '❌ NO'}`);
    
    // Check if Places API is loaded
    const placesApiLoaded = await page.evaluate(() => {
      return !!(window.google && window.google.maps && window.google.maps.places);
    });
    
    console.log(`🏢 Google Places API loaded: ${placesApiLoaded ? '✅ YES' : '❌ NO'}`);
    
    // Check for API key errors
    const hasApiKeyErrors = consoleMessages.some(msg => 
      msg.text.toLowerCase().includes('invalidkeymaperror') ||
      msg.text.toLowerCase().includes('your-google-maps-api-key') ||
      msg.text.toLowerCase().includes('api key') && msg.type === 'error'
    );
    
    console.log(`🔑 API Key Errors: ${hasApiKeyErrors ? '❌ FOUND' : '✅ NONE'}`);
    
    // Check for location filter components
    const locationFilterExists = await page.$('input[placeholder*="location"], input[placeholder*="Location"], [data-testid*="location"]');
    console.log(`📍 Location Input Component: ${locationFilterExists ? '✅ FOUND' : '⚠️  NOT FOUND'}`);
    
    // Check for map containers
    const mapContainers = await page.$$eval('[id*="map"], [class*="map"], [data-testid*="map"]', 
      elements => elements.length
    );
    console.log(`🗺️  Map Containers: ${mapContainers > 0 ? `✅ FOUND (${mapContainers})` : '⚠️  NONE'}`);
    
    // Test static map images
    const staticMapImages = await page.$$eval('img[src*="maps.googleapis.com"]', 
      images => images.map(img => ({
        src: img.src,
        loaded: img.complete && img.naturalHeight > 0
      }))
    );
    
    console.log(`📷 Static Map Images: ${staticMapImages.length > 0 ? `✅ FOUND (${staticMapImages.length})` : '⚠️  NONE'}`);
    
    if (staticMapImages.length > 0) {
      const loadedImages = staticMapImages.filter(img => img.loaded).length;
      console.log(`   - Loaded: ${loadedImages}/${staticMapImages.length}`);
    }
    
    // Check for network errors
    const networkErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && (
        msg.text.includes('failed to load') ||
        msg.text.includes('403') ||
        msg.text.includes('401') ||
        msg.text.includes('net::')
      )
    );
    
    console.log(`🌐 Network Errors: ${networkErrors.length > 0 ? `❌ FOUND (${networkErrors.length})` : '✅ NONE'}`);
    
    // Try to find search functionality
    const searchInputs = await page.$$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
    console.log(`🔍 Search Inputs: ${searchInputs.length > 0 ? `✅ FOUND (${searchInputs.length})` : '⚠️  NONE'}`);
    
    // Summary
    console.log('\n=== INTEGRATION TEST SUMMARY ===');
    console.log(`Google Maps API: ${googleMapsLoaded ? '✅' : '❌'}`);
    console.log(`Places API: ${placesApiLoaded ? '✅' : '❌'}`);
    console.log(`API Key Issues: ${hasApiKeyErrors ? '❌' : '✅'}`);
    console.log(`Location Components: ${locationFilterExists ? '✅' : '⚠️'}`);
    console.log(`Map Containers: ${mapContainers > 0 ? '✅' : '⚠️'}`);
    console.log(`Static Maps: ${staticMapImages.length > 0 ? '✅' : '⚠️'}`);
    console.log(`Network Errors: ${networkErrors.length === 0 ? '✅' : '❌'}`);
    
    // Show important console messages
    if (consoleMessages.length > 0) {
      console.log('\n=== IMPORTANT CONSOLE MESSAGES ===');
      const importantMessages = consoleMessages.filter(msg => 
        msg.text.toLowerCase().includes('google') ||
        msg.text.toLowerCase().includes('map') ||
        msg.text.toLowerCase().includes('api') ||
        msg.type === 'error'
      );
      
      importantMessages.slice(0, 10).forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
      
      if (importantMessages.length > 10) {
        console.log(`... and ${importantMessages.length - 10} more messages`);
      }
    }
    
    if (errors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      errors.forEach(error => {
        console.log(`❌ ${error}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testGoogleMapsIntegration();