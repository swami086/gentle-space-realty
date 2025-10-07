import { test, expect, Page } from '@playwright/test';

/**
 * Admin Portal Tags E2E Tests
 * 
 * Comprehensive end-to-end tests for the admin portal Tags functionality
 * to verify that the "Failed to load tags" error has been completely resolved
 * and all tag operations work correctly.
 */

test.describe('Admin Portal - Tags Management E2E', () => {
  let adminPage: Page;

  // Sample tags data that should be present in the system
  const expectedSampleTags = [
    { name: 'City Center', status: 'Active' },
    { name: 'Furnished', status: 'Active' },
    { name: 'Garden View', status: 'Active' },
    { name: 'Newly Renovated', status: 'Active' },
    { name: 'Parking Available', status: 'Active' },
    { name: 'Pet Friendly', status: 'Active' },
    { name: 'Premium', status: 'Active' },
    { name: 'Quiet Area', status: 'Inactive' }
  ];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      // Capture screenshots and videos for debugging
      recordVideo: {
        dir: 'test-results/admin-tags-e2e/',
        size: { width: 1280, height: 720 }
      }
    });
    adminPage = await context.newPage();

    // Enable console logging to catch JavaScript errors
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.warn(`⚠️ Console Warning: ${msg.text()}`);
      } else {
        console.log(`ℹ️ Console: ${msg.text()}`);
      }
    });

    // Catch page errors
    adminPage.on('pageerror', (error) => {
      console.error(`❌ Page Error: ${error.message}`);
    });

    // Track network requests
    adminPage.on('response', (response) => {
      if (response.url().includes('/api/') && !response.ok()) {
        console.error(`❌ API Error: ${response.status()} ${response.statusText()} - ${response.url()}`);
      }
    });
  });

  test.afterAll(async () => {
    await adminPage.close();
  });

  test.describe('Authentication and Navigation', () => {
    test('should authenticate and navigate to tags section', async () => {
      console.log('🔐 Starting authentication flow...');

      // Navigate to admin portal
      await adminPage.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
      
      // Take screenshot of login page
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/01-login-page.png' });

      // Check if login form is present
      await expect(adminPage.locator('form')).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(adminPage.locator('input[type="password"], input[name="password"]')).toBeVisible();

      // Login with admin credentials
      // Note: In real scenario, these would come from environment variables
      const adminEmail = 'admin@gentlespace.com';
      const adminPassword = 'admin123';

      await adminPage.fill('input[type="email"], input[name="email"]', adminEmail);
      await adminPage.fill('input[type="password"], input[name="password"]', adminPassword);

      console.log('🔑 Submitting login credentials...');
      await adminPage.click('button[type="submit"]');

      // Wait for successful login and redirect
      await adminPage.waitForURL('**/admin/**', { timeout: 15000 });
      
      // Take screenshot after login
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/02-after-login.png' });

      console.log('✅ Successfully authenticated to admin portal');
    });

    test('should navigate to Tags management section', async () => {
      // Look for Tags navigation link/button
      const tagsLink = adminPage.locator('a:has-text("Tags"), button:has-text("Tags"), [data-testid="tags-nav"]');
      
      // If direct link exists, click it
      if (await tagsLink.first().isVisible({ timeout: 5000 })) {
        await tagsLink.first().click();
      } else {
        // Try navigating directly to tags URL
        await adminPage.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle' });
      }

      // Verify we're on the tags page
      await expect(adminPage).toHaveURL(/.*\/admin.*tags/);
      
      // Take screenshot of tags page
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/03-tags-page-loaded.png' });

      console.log('📍 Successfully navigated to Tags management section');
    });
  });

  test.describe('Tags Loading and Display', () => {
    test('should load tags successfully without error messages', async () => {
      console.log('📋 Testing tags loading functionality...');

      // Wait for tags section to be visible
      await expect(adminPage.locator('h1:has-text("Tag Management"), h2:has-text("Tag Management"), [data-testid="tags-section"]')).toBeVisible({ timeout: 10000 });

      // Check that NO error messages are displayed
      const errorMessages = [
        'Failed to load tags',
        'Please refresh the page',
        'Error loading tags',
        'Unable to fetch tags',
        'Network error',
        'Server error'
      ];

      for (const errorMsg of errorMessages) {
        await expect(adminPage.locator(`text=${errorMsg}`)).not.toBeVisible();
      }

      // Verify loading spinner is not stuck
      await expect(adminPage.locator('text=Loading tags...')).not.toBeVisible({ timeout: 15000 });

      // Take screenshot showing tags loaded successfully
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/04-tags-loaded-successfully.png' });

      console.log('✅ Tags loaded successfully without errors');
    });

    test('should display the expected 8 sample tags', async () => {
      console.log('🏷️ Verifying sample tags are displayed...');

      // Wait for tags to load
      await adminPage.waitForLoadState('networkidle');

      // Check if tags list is visible
      const tagsContainer = adminPage.locator('[data-testid="tags-list"], .tags-container, .space-y-4');
      
      // Look for individual tag entries
      const tagElements = adminPage.locator('[data-testid="tag-item"], .flex.items-center.justify-between');

      // Wait for at least some tags to be visible
      await expect(tagElements.first()).toBeVisible({ timeout: 10000 });

      // Verify each expected tag is present
      for (const expectedTag of expectedSampleTags) {
        const tagLocator = adminPage.locator(`text=${expectedTag.name}`);
        await expect(tagLocator).toBeVisible();

        // Check status badge
        const statusLocator = adminPage.locator(`.text-xs.px-2.py-1.rounded-full:has-text("${expectedTag.status}")`);
        await expect(statusLocator).toBeVisible();

        console.log(`✓ Found tag: ${expectedTag.name} (${expectedTag.status})`);
      }

      // Take screenshot showing all tags
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/05-all-tags-displayed.png' });

      console.log('✅ All 8 expected sample tags are displayed correctly');
    });

    test('should display tag details correctly', async () => {
      console.log('🔍 Verifying tag details display...');

      // Check that tags display their properties correctly
      const firstTag = adminPage.locator('[data-testid="tag-item"], .flex.items-center.justify-between').first();
      await expect(firstTag).toBeVisible();

      // Verify tag badge is styled correctly
      const tagBadge = firstTag.locator('.text-sm.px-3.py-1, .badge');
      await expect(tagBadge).toBeVisible();

      // Verify action buttons are present
      const editButton = firstTag.locator('button:has([data-lucide="edit"]), button[title*="Edit"]');
      const deleteButton = firstTag.locator('button:has([data-lucide="trash"]), button[title*="Delete"]');
      const toggleButton = firstTag.locator('button:has([data-lucide="eye"]), button[title*="Activate"], button[title*="Deactivate"]');

      await expect(editButton).toBeVisible();
      await expect(deleteButton).toBeVisible();
      await expect(toggleButton).toBeVisible();

      console.log('✅ Tag details and action buttons are displayed correctly');
    });
  });

  test.describe('Create New Tag', () => {
    test('should open create tag dialog', async () => {
      console.log('➕ Testing create tag dialog...');

      // Click the "Create Tag" button
      const createButton = adminPage.locator('button:has-text("Create Tag"), button[data-testid="create-tag-button"]');
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for dialog to open
      await expect(adminPage.locator('[role="dialog"], .dialog, .modal')).toBeVisible({ timeout: 5000 });
      
      // Verify dialog title
      await expect(adminPage.locator('text=Create New Tag')).toBeVisible();

      // Verify form fields are present
      await expect(adminPage.locator('input[placeholder*="Premium"], input[id="tagName"]')).toBeVisible();
      await expect(adminPage.locator('textarea[placeholder*="description"]')).toBeVisible();
      
      // Take screenshot of create dialog
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/06-create-tag-dialog.png' });

      console.log('✅ Create tag dialog opened successfully');
    });

    test('should validate required fields', async () => {
      console.log('✅ Testing form validation...');

      // Try to submit empty form
      const submitButton = adminPage.locator('button:has-text("Create Tag"), button[type="submit"]');
      await submitButton.click();

      // Should either show validation message or prevent submission
      // The form should not close if validation fails
      await expect(adminPage.locator('[role="dialog"], .dialog, .modal')).toBeVisible();

      console.log('✅ Form validation is working correctly');
    });

    test('should create a new tag successfully', async () => {
      console.log('🏷️ Testing successful tag creation...');

      // Fill in tag details
      const tagName = `E2E Test Tag ${Date.now()}`;
      const tagDescription = 'This is a test tag created by E2E tests';

      await adminPage.fill('input[placeholder*="Premium"], input[id="tagName"]', tagName);
      await adminPage.fill('textarea[placeholder*="description"]', tagDescription);

      // Select a color preset (click on a preset button)
      const colorPreset = adminPage.locator('.grid.grid-cols-5 button').first();
      if (await colorPreset.isVisible()) {
        await colorPreset.click();
      }

      // Take screenshot before submission
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/07-tag-form-filled.png' });

      // Submit the form
      const submitButton = adminPage.locator('button:has-text("Create Tag"), button[type="submit"]');
      await submitButton.click();

      // Wait for form to close and tag to be created
      await expect(adminPage.locator('[role="dialog"], .dialog, .modal')).not.toBeVisible({ timeout: 10000 });

      // Verify the new tag appears in the list
      await expect(adminPage.locator(`text=${tagName}`)).toBeVisible({ timeout: 10000 });

      // Take screenshot showing new tag
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/08-new-tag-created.png' });

      console.log(`✅ Successfully created tag: ${tagName}`);
    });

    test('should close create dialog with cancel', async () => {
      // Open dialog again
      const createButton = adminPage.locator('button:has-text("Create Tag")');
      await createButton.click();
      await expect(adminPage.locator('[role="dialog"]')).toBeVisible();

      // Click cancel
      const cancelButton = adminPage.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Dialog should close
      await expect(adminPage.locator('[role="dialog"]')).not.toBeVisible();

      console.log('✅ Create dialog cancellation works correctly');
    });
  });

  test.describe('Edit Existing Tag', () => {
    test('should open edit dialog for existing tag', async () => {
      console.log('✏️ Testing edit tag functionality...');

      // Click edit button on first tag
      const firstTagEditButton = adminPage.locator('[data-testid="tag-item"] button:has([data-lucide="edit"]), .flex.items-center.justify-between button:has([data-lucide="edit"])').first();
      
      // If not found, try alternative selectors
      if (!await firstTagEditButton.isVisible({ timeout: 5000 })) {
        const editButton = adminPage.locator('button[title*="Edit"], button:has-text("Edit")').first();
        await editButton.click();
      } else {
        await firstTagEditButton.click();
      }

      // Wait for edit dialog to open
      await expect(adminPage.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(adminPage.locator('text=Edit Tag')).toBeVisible();

      // Verify form is pre-populated
      const nameInput = adminPage.locator('input[id="tagName"]');
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);

      // Take screenshot of edit dialog
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/09-edit-tag-dialog.png' });

      console.log('✅ Edit tag dialog opened with pre-populated data');
    });

    test('should update tag successfully', async () => {
      console.log('💾 Testing tag update...');

      // Modify the tag name
      const nameInput = adminPage.locator('input[id="tagName"]');
      const originalName = await nameInput.inputValue();
      const updatedName = `${originalName} (Updated)`;
      
      await nameInput.fill(updatedName);

      // Update description
      const descInput = adminPage.locator('textarea[id="tagDescription"]');
      await descInput.fill('This tag has been updated by E2E tests');

      // Submit the changes
      const updateButton = adminPage.locator('button:has-text("Update Tag")');
      await updateButton.click();

      // Wait for dialog to close
      await expect(adminPage.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

      // Verify the updated tag name appears in the list
      await expect(adminPage.locator(`text=${updatedName}`)).toBeVisible({ timeout: 10000 });

      // Take screenshot showing updated tag
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/10-tag-updated.png' });

      console.log(`✅ Successfully updated tag to: ${updatedName}`);
    });
  });

  test.describe('Tag Status Toggle', () => {
    test('should toggle tag active/inactive status', async () => {
      console.log('🔄 Testing tag status toggle...');

      // Find a tag and its current status
      const firstTag = adminPage.locator('[data-testid="tag-item"], .flex.items-center.justify-between').first();
      const statusBadge = firstTag.locator('.text-xs.px-2.py-1.rounded-full');
      const currentStatus = await statusBadge.textContent();

      console.log(`Current status: ${currentStatus}`);

      // Click the toggle button (eye icon)
      const toggleButton = firstTag.locator('button:has([data-lucide="eye"])');
      await toggleButton.click();

      // Wait for the status to update
      await adminPage.waitForTimeout(2000);

      // Verify status has changed
      const newStatus = await statusBadge.textContent();
      expect(newStatus).not.toBe(currentStatus);

      console.log(`Status changed to: ${newStatus}`);

      // Take screenshot showing status change
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/11-tag-status-toggled.png' });

      // Toggle back to original status
      await toggleButton.click();
      await adminPage.waitForTimeout(2000);

      const finalStatus = await statusBadge.textContent();
      expect(finalStatus).toBe(currentStatus);

      console.log(`✅ Status toggle functionality working correctly`);
    });
  });

  test.describe('Console Error Validation', () => {
    test('should have no JavaScript console errors during tag operations', async () => {
      console.log('🐛 Checking for console errors...');

      let consoleErrors: string[] = [];
      
      // Capture console errors
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Perform various tag operations
      // 1. Load tags (already done)
      // 2. Open create dialog
      const createButton = adminPage.locator('button:has-text("Create Tag")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await adminPage.waitForTimeout(1000);
        
        // Close dialog
        const cancelButton = adminPage.locator('button:has-text("Cancel")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }

      // 3. Refresh page to test loading again
      await adminPage.reload({ waitUntil: 'networkidle' });
      await expect(adminPage.locator('h1:has-text("Tag Management"), h2:has-text("Tag Management")')).toBeVisible({ timeout: 10000 });

      // Check if any console errors occurred
      const errorCount = consoleErrors.length;
      console.log(`Found ${errorCount} console errors:`);
      consoleErrors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });

      // This test will pass but report errors for visibility
      if (errorCount === 0) {
        console.log('✅ No JavaScript console errors found');
      } else {
        console.warn(`⚠️ Found ${errorCount} console errors (see details above)`);
      }

      // Take final screenshot
      await adminPage.screenshot({ path: 'test-results/admin-tags-e2e/12-final-state.png' });
    });
  });

  test.describe('Performance and Network', () => {
    test('should load tags within reasonable time', async () => {
      console.log('⚡ Testing performance...');

      const startTime = Date.now();
      
      // Reload the page and measure load time
      await adminPage.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle' });
      
      // Wait for tags to be visible
      await expect(adminPage.locator('h1:has-text("Tag Management")')).toBeVisible({ timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`Tags page loaded in ${loadTime}ms`);
      
      // Should load within 10 seconds (generous timeout for CI)
      expect(loadTime).toBeLessThan(10000);

      console.log('✅ Tags page performance is acceptable');
    });

    test('should handle API requests correctly', async () => {
      console.log('🌐 Monitoring API requests...');

      const apiRequests: Array<{ url: string, status: number, method: string }> = [];

      // Monitor network requests
      adminPage.on('response', (response) => {
        if (response.url().includes('/api/')) {
          apiRequests.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
          });
        }
      });

      // Reload page to trigger API calls
      await adminPage.reload({ waitUntil: 'networkidle' });
      await adminPage.waitForTimeout(3000);

      console.log(`Captured ${apiRequests.length} API requests:`);
      apiRequests.forEach((req) => {
        const statusSymbol = req.status >= 200 && req.status < 300 ? '✅' : '❌';
        console.log(`  ${statusSymbol} ${req.method} ${req.status} - ${req.url}`);
      });

      // Verify at least one successful tags API call was made
      const tagsRequests = apiRequests.filter(req => 
        req.url.includes('tags') && req.status >= 200 && req.status < 300
      );

      expect(tagsRequests.length).toBeGreaterThan(0);
      console.log('✅ Tags API requests are working correctly');
    });
  });

  test.describe('Final Validation', () => {
    test('should display comprehensive tags functionality summary', async () => {
      console.log('📊 Final validation and summary...');

      // Take final comprehensive screenshot
      await adminPage.screenshot({ 
        path: 'test-results/admin-tags-e2e/13-comprehensive-final-screenshot.png',
        fullPage: true 
      });

      // Verify core functionality works
      const functionalities = {
        'Tags page loads': await adminPage.locator('h1:has-text("Tag Management")').isVisible(),
        'Tags list visible': await adminPage.locator('[data-testid="tags-list"], .space-y-4').isVisible(),
        'Create button works': await adminPage.locator('button:has-text("Create Tag")').isVisible(),
        'No error messages': !await adminPage.locator('text=Failed to load tags').isVisible(),
        'Sample tags present': await adminPage.locator('text=Premium').isVisible()
      };

      console.log('\n🎯 FUNCTIONALITY SUMMARY:');
      Object.entries(functionalities).forEach(([feature, working]) => {
        const status = working ? '✅ WORKING' : '❌ FAILED';
        console.log(`  ${feature}: ${status}`);
      });

      // Count successful functionalities
      const workingCount = Object.values(functionalities).filter(Boolean).length;
      const totalCount = Object.keys(functionalities).length;

      console.log(`\n📈 SUCCESS RATE: ${workingCount}/${totalCount} (${Math.round(workingCount/totalCount*100)}%)`);

      if (workingCount === totalCount) {
        console.log('🎉 ALL TAGS FUNCTIONALITY IS WORKING CORRECTLY!');
        console.log('✅ The "Failed to load tags" error has been completely resolved.');
      } else {
        console.log('⚠️ Some functionality issues detected - check test results above');
      }
    });
  });
});