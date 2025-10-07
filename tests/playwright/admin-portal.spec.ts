import { test, expect } from '@playwright/test';

/**
 * Admin Portal Mock Account Integration Tests
 * 
 * This test suite validates the integration between the mock account system
 * and the admin portal interface using real browser automation.
 */

test.describe('Admin Portal - Mock Account Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication Flow', () => {
    test('should allow admin login through main portal', async ({ page }) => {
      // Navigate to admin portal
      await page.click('text=Admin Portal');
      
      // Should redirect to admin login page
      await expect(page).toHaveURL(/\/admin/);
      
      // Check if login form is present
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Fill in admin credentials
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Should redirect to admin dashboard after successful login
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      
      // Should show admin interface elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should reject regular user from admin portal', async ({ page }) => {
      // Navigate to admin portal
      await page.click('text=Admin Portal');
      
      // Fill in user credentials (should not have admin access)
      const userEmail = process.env.PLAYWRIGHT_TEST_USER_EMAIL!;
      const userPassword = process.env.PLAYWRIGHT_TEST_USER_PASSWORD!;
      
      await page.fill('input[type="email"]', userEmail);
      await page.fill('input[type="password"]', userPassword);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Should show access denied or redirect to login with error
      // Implementation depends on how admin access is handled
      await expect(
        page.locator('text=Access denied') ||
        page.locator('text=Insufficient permissions') ||
        page.locator('.error')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should handle super admin login', async ({ page }) => {
      // Navigate to admin portal
      await page.click('text=Admin Portal');
      
      // Fill in super admin credentials
      const superAdminEmail = process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_EMAIL!;
      const superAdminPassword = process.env.PLAYWRIGHT_TEST_SUPER_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', superAdminEmail);
      await page.fill('input[type="password"]', superAdminPassword);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      
      // Super admin should have additional privileges
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Check for super admin specific elements (if any)
      // This would depend on your implementation
    });
  });

  test.describe('Admin Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin for dashboard tests
      await page.goto('/admin');
      
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await page.waitForURL(/\/admin\/dashboard/);
    });

    test('should navigate to different admin sections', async ({ page }) => {
      // Test navigation to different admin sections
      const sections = [
        { text: 'Properties', url: /properties/ },
        { text: 'Inquiries', url: /inquiries/ },
        { text: 'Testimonials', url: /testimonials/ },
      ];
      
      for (const section of sections) {
        // Click on section link
        await page.click(`text=${section.text}`);
        
        // Check URL changed to correct section
        await expect(page).toHaveURL(section.url);
        
        // Check section content loaded
        await expect(page.locator('h1, h2, .section-title')).toBeVisible();
      }
    });

    test('should access mock account management if available', async ({ page }) => {
      // Check if mock account management is available in admin interface
      const mockAccountLink = page.locator('text=Mock Accounts');
      
      if (await mockAccountLink.isVisible()) {
        await mockAccountLink.click();
        
        // Should show mock account management interface
        await expect(page).toHaveURL(/mock-accounts/);
        await expect(page.locator('.mock-account-manager')).toBeVisible();
        
        // Should display current mock accounts
        await expect(
          page.locator('text=Mock Account Management') ||
          page.locator('.account-list') ||
          page.locator('table')
        ).toBeVisible();
      } else {
        console.log('Mock Account Management not visible in admin interface');
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login as admin
      await page.goto('/admin');
      
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForURL(/\/admin\/dashboard/);
      
      // Reload page
      await page.reload();
      
      // Should still be logged in (not redirected to login)
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should handle logout properly', async ({ page }) => {
      // Login as admin
      await page.goto('/admin');
      
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForURL(/\/admin\/dashboard/);
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), text=Sign Out');
      
      if (await logoutButton.first().isVisible()) {
        await logoutButton.first().click();
        
        // Should redirect to login page
        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('input[type="email"]')).toBeVisible();
      } else {
        console.log('Logout button not found - may need UI implementation');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to admin portal
      await page.goto('/admin');
      
      // Login form should be responsive
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      
      // Login as admin
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      // Dashboard should be responsive
      await page.waitForURL(/\/admin\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to admin portal
      await page.goto('/admin');
      
      // Login and verify interface works on tablet
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/\/admin\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid credentials gracefully', async ({ page }) => {
      await page.goto('/admin');
      
      // Enter invalid credentials
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(
        page.locator('.error, .alert-error, text=Invalid credentials') ||
        page.locator('text=Login failed')
      ).toBeVisible({ timeout: 10000 });
      
      // Should remain on login page
      await expect(page).toHaveURL(/\/admin/);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept auth requests and make them fail
      await page.route('**/api/auth/**', route => route.abort());
      
      await page.goto('/admin');
      
      const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
      const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
      
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      
      // Should show network error or loading state
      await expect(
        page.locator('.error, .loading, text=Network error') ||
        page.locator('text=Connection failed')
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Performance', () => {
    test('should load admin portal within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Admin portal should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Check for essential elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should handle concurrent login attempts', async ({ browser }) => {
      // Create multiple pages to simulate concurrent logins
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all([
        contexts[0].newPage(),
        contexts[1].newPage(),
        contexts[2].newPage()
      ]);
      
      try {
        // Attempt concurrent logins with same admin account
        const adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL!;
        const adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD!;
        
        const loginPromises = pages.map(async (page) => {
          await page.goto('/admin');
          await page.fill('input[type="email"]', adminEmail);
          await page.fill('input[type="password"]', adminPassword);
          await page.click('button[type="submit"]');
          return page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
        });
        
        // All logins should succeed (or handle concurrent sessions appropriately)
        await Promise.all(loginPromises);
        
        // Verify all pages reached dashboard
        for (const page of pages) {
          await expect(page).toHaveURL(/\/admin\/dashboard/);
        }
        
      } finally {
        // Cleanup
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });
});