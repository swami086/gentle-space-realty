import { chromium } from 'playwright';

async function testAdminPortalLogin() {
  console.log('🔍 Starting admin portal login test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const request = networkRequests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        request.statusText = response.statusText();
      }
    }
  });
  
  try {
    // Navigate directly to admin portal
    console.log('📍 Navigating to admin portal...');
    await page.goto('http://localhost:5174/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Current page URL:', page.url());
    
    // Check if we're redirected to login or if there's a login form on this page
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")').count() > 0;
    
    console.log('📋 Page analysis:');
    console.log(`   Has login form: ${hasLoginForm}`);
    console.log(`   Has login button: ${hasLoginButton}`);
    
    if (!hasLoginForm && hasLoginButton) {
      console.log('🔍 Found login button, clicking it...');
      await page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Now check for login form again
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    
    if (!(await emailField.isVisible()) || !(await passwordField.isVisible())) {
      console.log('❌ Login form not found. Taking screenshot...');
      await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-portal-no-login.png' });
      
      // Check what's on the page
      const pageTitle = await page.title();
      const pageContent = await page.locator('body').textContent();
      console.log('📄 Page title:', pageTitle);
      console.log('📄 Page content (first 200 chars):', pageContent.substring(0, 200));
      
      await browser.close();
      return;
    }
    
    console.log('✅ Login form found! Filling in credentials...');
    
    // Fill in credentials
    await emailField.fill('demo-admin@gentlespacerealty.com');
    await passwordField.fill('DemoAdmin123!');
    
    console.log('📝 Credentials filled. Looking for submit button...');
    
    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await submitButton.isVisible()) {
      console.log('🔐 Clicking submit button...');
      await submitButton.click();
    } else {
      console.log('🔐 No submit button found, pressing Enter...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for login to process
    console.log('⏳ Waiting for login to process...');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Check current URL after login
    const currentUrl = page.url();
    console.log('📍 URL after login:', currentUrl);
    
    // Take screenshot after login
    await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-portal-after-login.png' });
    
    // If not already on admin page, navigate to it
    if (!currentUrl.includes('/admin')) {
      console.log('📍 Navigating to admin page...');
      await page.goto('http://localhost:5174/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // Look for property management or properties section
    console.log('🔍 Looking for properties section...');
    
    // Try different selectors for property management
    const propertyManagementSelectors = [
      'text=Property Management',
      'text=Properties',
      'a:has-text("Properties")',
      'button:has-text("Properties")',
      '[href*="properties"]',
      '[data-testid="property-management"]'
    ];
    
    let propertiesFound = false;
    for (const selector of propertyManagementSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found properties section: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          propertiesFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!propertiesFound) {
      console.log('🔍 No specific properties link found, checking if already on properties page...');
    }
    
    // Count properties on the page
    console.log('🏠 Counting properties on admin page...');
    
    const propertySelectors = [
      '[data-testid="property-card"]',
      '.property-card',
      'article:has(img)',
      '.card:has(img)',
      '.grid > div:has(img)',
      'div:has(img[alt*="property" i])',
      'div:has(h2, h3):has(img)', // Cards with titles and images
      'div[class*="property"]'
    ];
    
    let maxCount = 0;
    let usedSelector = '';
    
    console.log('📊 Property count by selector:');
    for (const selector of propertySelectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`   ${selector}: ${count} properties`);
        if (count > maxCount) {
          maxCount = count;
          usedSelector = selector;
        }
      } catch (e) {
        console.log(`   ${selector}: error counting`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-properties-final.png', fullPage: true });
    
    // Print network requests
    console.log('\\n🌐 Network requests made:');
    networkRequests.forEach(req => {
      console.log(`   ${req.method} ${req.url} - ${req.status || 'pending'}`);
    });
    
    // Final results
    console.log('\\n📊 FINAL RESULTS:');
    console.log(`   Properties displayed: ${maxCount}`);
    console.log(`   Best selector: ${usedSelector}`);
    console.log(`   Expected: 18 properties`);
    console.log(`   Success: ${maxCount >= 18 ? '✅ YES' : maxCount > 0 ? '⚠️ PARTIAL' : '❌ NO'}`);
    
    if (maxCount === 0) {
      // Check if there are any error messages
      const errorMessages = await page.locator('text=/error|failed|loading/i').allTextContents();
      if (errorMessages.length > 0) {
        console.log('⚠️ Error messages found:');
        errorMessages.forEach(msg => console.log(`   - ${msg}`));
      }
      
      // Check if still loading
      const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], text=/loading/i').count();
      console.log(`⏳ Loading elements: ${loadingElements}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-login-error.png' });
  } finally {
    await browser.close();
  }
}

testAdminPortalLogin().catch(console.error);