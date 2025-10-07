import { chromium } from 'playwright';

async function testAdminLogin() {
  console.log('🔍 Starting admin login and properties test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to localhost
    console.log('📍 Navigating to localhost...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    // Look for login link/button
    console.log('🔍 Looking for login option...');
    const loginSelectors = [
      'a:has-text("Login")',
      'button:has-text("Login")',
      'a:has-text("Sign In")',
      'button:has-text("Sign In")',
      '[href*="login"]',
      '[href*="auth"]',
      'text=/login|sign in/i'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found login element: ${selector}`);
          await element.click();
          loginFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!loginFound) {
      console.log('❌ No login element found, checking if already on login page...');
      // Check if we're already on a login page
      const isLoginPage = await page.locator('input[type="email"], input[type="password"], text=/email|password/i').count() > 0;
      if (!isLoginPage) {
        console.log('❌ Not on login page, trying to navigate directly...');
        await page.goto('http://localhost:5174/login');
        await page.waitForLoadState('networkidle');
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Fill in login credentials
    console.log('📝 Filling in credentials...');
    
    // Try multiple email field selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      '[data-testid="email"]',
      '#email'
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const emailField = page.locator(selector).first();
        if (await emailField.isVisible({ timeout: 2000 })) {
          await emailField.fill('demo-admin@gentlespacerealty.com');
          console.log(`✅ Email filled using: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!emailFilled) {
      console.log('❌ Could not find email field');
      await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/no-email-field.png' });
      return;
    }
    
    // Try multiple password field selectors
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      '[data-testid="password"]',
      '#password'
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const passwordField = page.locator(selector).first();
        if (await passwordField.isVisible({ timeout: 2000 })) {
          await passwordField.fill('DemoAdmin123!');
          console.log(`✅ Password filled using: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!passwordFilled) {
      console.log('❌ Could not find password field');
      await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/no-password-field.png' });
      return;
    }
    
    // Submit login form
    console.log('🔐 Submitting login form...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'input[type="submit"]',
      '[data-testid="login-button"]'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          console.log(`✅ Login submitted using: ${selector}`);
          submitted = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitted) {
      console.log('❌ Could not find submit button, trying Enter key...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation after login
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Checking login success...');
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:5174/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Count properties on admin page
    const propertySelectors = [
      '[data-testid="property-card"]',
      '.property-card',
      '[class*="property"]',
      '.grid > div:has(img)',
      'div:has(img[alt*="property" i])',
      'article',
      '.card:has(img)'
    ];
    
    let maxCount = 0;
    let usedSelector = '';
    
    for (const selector of propertySelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > maxCount) {
          maxCount = count;
          usedSelector = selector;
        }
        console.log(`🏠 ${selector}: ${count} properties found`);
      } catch (e) {
        console.log(`❌ ${selector}: failed to count`);
      }
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   Max properties found: ${maxCount}`);
    console.log(`   Using selector: ${usedSelector}`);
    console.log(`   Expected: 18 properties`);
    console.log(`   Status: ${maxCount === 18 ? '✅ SUCCESS' : maxCount > 0 ? '⚠️ PARTIAL' : '❌ FAILED'}`);
    
    // Take screenshot
    await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/admin-page-after-login.png' });
    console.log('📸 Screenshot saved: admin-page-after-login.png');
    
    // Check network requests
    const networkRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Refresh to capture network requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n🌐 API Requests after login:');
    networkRequests.forEach(req => {
      console.log(`   ${req.status} ${req.url}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/tests/error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testAdminLogin().catch(console.error);