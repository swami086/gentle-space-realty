import { chromium } from 'playwright';

async function testFrontendBackendInteractions() {
  console.log('🚀 Starting comprehensive frontend-backend interaction tests...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging to capture frontend errors
  const consoleMessages = [];
  const networkErrors = [];
  const jsErrors = [];
  
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('pageerror', (error) => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', (response) => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    // Test 1: Homepage Loading
    console.log('\n📄 Testing Homepage Loading...');
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Allow time for all data to load
    
    // Test 2: Check Company Logos Loading
    console.log('\n🏢 Testing Company Logos Loading...');
    const companyLogos = await page.$$('.company-logo, img[alt*="logo"]');
    console.log(`Found ${companyLogos.length} company logos`);
    
    // Test 3: Check FAQ Section Loading  
    console.log('\n❓ Testing FAQ Section Loading...');
    const faqSection = await page.$('#faq');
    const faqItems = await page.$$('[data-testid*="faq"], .accordion-item, [class*="faq"]');
    console.log(`FAQ section present: ${!!faqSection}, FAQ items found: ${faqItems.length}`);
    
    // Test 4: Check Testimonials Loading
    console.log('\n💬 Testing Testimonials Loading...');
    const testimonials = await page.$$('[class*="testimonial"], .testimonial-card');
    console.log(`Found ${testimonials.length} testimonials`);
    
    // Test 5: Check Property Listings (if any)
    console.log('\n🏠 Testing Property Listings...');
    const properties = await page.$$('[class*="property"], .property-card');
    console.log(`Found ${properties.length} property listings`);
    
    // Test 6: Test Contact Form Interactions
    console.log('\n📞 Testing Contact Form...');
    const contactSection = await page.$('#contact');
    if (contactSection) {
      const contactForm = await page.$('form');
      if (contactForm) {
        console.log('Contact form found - testing interactions...');
        // Try to fill out form
        const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
        const emailInput = await page.$('input[name="email"], input[type="email"]');
        
        if (nameInput) {
          await nameInput.fill('Test User');
          console.log('✅ Name input functional');
        }
        if (emailInput) {
          await emailInput.fill('test@example.com');
          console.log('✅ Email input functional');
        }
      }
    }
    
    // Test 7: Test Admin Panel (if accessible)
    console.log('\n⚙️ Testing Admin Panel Access...');
    try {
      await page.goto('http://localhost:5175/admin', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const adminPanel = await page.$('.admin-panel, [class*="admin"]');
      if (adminPanel) {
        console.log('✅ Admin panel accessible');
        
        // Test company management
        const addCompanyBtn = await page.locator('text="Add Company"').first();
        if (addCompanyBtn) {
          console.log('🧪 Testing Add Company button...');
          await addCompanyBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if form appears
          const companyForm = await page.$('form, [class*="form"]');
          console.log(`Company form appeared: ${!!companyForm}`);
        }
      } else {
        console.log('ℹ️ Admin panel not found or not accessible');
      }
    } catch (error) {
      console.log(`⚠️ Admin panel test failed: ${error.message}`);
    }
    
    // Test 8: API Endpoint Tests
    console.log('\n🌐 Testing API Endpoints...');
    const apiTests = [
      '/api/companies',
      '/api/faqs', 
      '/api/testimonials',
      '/api/properties'
    ];
    
    for (const endpoint of apiTests) {
      try {
        const response = await page.goto(`http://localhost:5175${endpoint}`, { waitUntil: 'networkidle' });
        console.log(`${endpoint}: ${response.status()} - ${response.ok() ? 'OK' : 'ERROR'}`);
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
  }

  // Report Results
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  console.log('\n🔴 JavaScript Errors:');
  if (jsErrors.length > 0) {
    jsErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.message}`);
      if (error.stack) console.log(`   Stack: ${error.stack.split('\n')[0]}`);
    });
  } else {
    console.log('✅ No JavaScript errors detected');
  }
  
  console.log('\n🌐 Network Errors:');
  if (networkErrors.length > 0) {
    networkErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.url} - ${error.status} ${error.statusText}`);
    });
  } else {
    console.log('✅ No network errors detected');
  }
  
  console.log('\n📝 Console Messages Summary:');
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
  const logMessages = consoleMessages.filter(msg => msg.type === 'log');
  
  console.log(`Errors: ${errorMessages.length}`);
  console.log(`Warnings: ${warningMessages.length}`);
  console.log(`Logs: ${logMessages.length}`);
  
  if (errorMessages.length > 0) {
    console.log('\n🔴 Console Errors:');
    errorMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.text}`);
    });
  }
  
  if (warningMessages.length > 0) {
    console.log('\n⚠️ Console Warnings:');
    warningMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.text}`);
    });
  }

  await browser.close();
  console.log('\n✅ Testing completed!');
}

// Run the tests
testFrontendBackendInteractions().catch(console.error);