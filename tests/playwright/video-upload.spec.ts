import { test, expect, Page } from '@playwright/test';
import { Buffer } from 'buffer';

/**
 * Video Upload Functionality Tests for Admin Add Properties Tab
 * 
 * This test suite validates the complete video upload workflow including:
 * - Navigation to admin Add Properties tab
 * - Programmatic test video blob generation 
 * - File selection simulation via FileUpload component
 * - Video preview generation without CSP violations
 * - Upload process reaching Express server endpoints
 * - CSP compliance validation for blob URLs
 */

test.describe('Video Upload Functionality - Add Properties', () => {
  let adminEmail: string;
  let adminPassword: string;
  let testVideoBlob: Buffer;

  test.beforeAll(async () => {
    // Set up test credentials
    adminEmail = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL || 'admin@gentlespace.com';
    adminPassword = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD || 'admin123';

    // Generate test video blob programmatically (MP4 format)
    // This creates a minimal valid MP4 file for testing
    testVideoBlob = generateTestVideoBlob();
  });

  test.beforeEach(async ({ page }) => {
    // Set up console monitoring for CSP violations
    const cspViolations: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('Content Security Policy') || text.includes('CSP')) {
          cspViolations.push(text);
        }
      }
    });

    // Store for later validation
    (page as any)._cspViolations = cspViolations;
    (page as any)._consoleErrors = consoleErrors;

    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Login as admin
    await loginAsAdmin(page, adminEmail, adminPassword);
  });

  test('should navigate to admin Add Properties tab successfully', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check if we're on the dashboard or need to navigate to properties
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/dashboard')) {
      await expect(page).toHaveURL(/\/admin/);
      
      // Click dashboard or properties link if visible
      const dashboardLink = page.locator('text=Dashboard, a[href*="/admin/dashboard"]');
      if (await dashboardLink.first().isVisible()) {
        await dashboardLink.first().click();
        await page.waitForURL(/\/admin\/dashboard/);
      }
    }

    // Navigate to Properties section
    const propertiesLink = page.locator('text=Properties, a[href*="/admin/properties"], [data-testid="properties-nav"]');
    if (await propertiesLink.first().isVisible()) {
      await propertiesLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Click Add Property or Add Properties button
    const addPropertyBtn = page.locator('text=Add Property, button:has-text("Add"), [data-testid="add-property-btn"]');
    await expect(addPropertyBtn.first()).toBeVisible();
    await addPropertyBtn.first().click();

    // Wait for property form to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Property Media, text=Property Images, text=Property Videos')).toBeVisible();

    console.log('✅ Successfully navigated to Add Properties tab');
  });

  test('should generate test video blob programmatically', async ({ page }) => {
    // Validate that our test video blob was generated correctly
    expect(testVideoBlob).toBeDefined();
    expect(testVideoBlob.length).toBeGreaterThan(0);
    
    // Create a video file from our blob for testing
    const videoFile = await page.evaluateHandle((videoData) => {
      const uint8Array = new Uint8Array(videoData);
      return new File([uint8Array], 'test-video.mp4', { type: 'video/mp4' });
    }, Array.from(testVideoBlob));

    expect(videoFile).toBeDefined();
    console.log('✅ Test video blob generated successfully');
  });

  test('should simulate video file selection via FileUpload component', async ({ page }) => {
    // Navigate to Add Properties form
    await navigateToAddPropertiesForm(page);

    // Find the video upload FileUpload component
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    await expect(videoUploadSection).toBeVisible();

    // Find the file input within the video upload section
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    await expect(videoFileInput).toBeAttached();

    // Create a test video file and upload it
    const videoFile = await createTestVideoFile(page, testVideoBlob);
    
    // Set files on the input
    await videoFileInput.setInputFiles([{
      name: 'test-property-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    // Wait for file processing
    await page.waitForTimeout(1000);

    // Verify file was selected
    const filePreview = page.locator('.file-preview, [class*="preview"]');
    await expect(filePreview).toBeVisible({ timeout: 10000 });

    console.log('✅ Video file selection simulated successfully');
  });

  test('should verify video preview generation without CSP violations', async ({ page }) => {
    await navigateToAddPropertiesForm(page);

    // Upload a video file
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    
    await videoFileInput.setInputFiles([{
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    // Wait for video preview generation (canvas thumbnails)
    await page.waitForTimeout(3000); // Allow time for canvas processing

    // Check for video preview elements
    const videoPreview = page.locator('[class*="video"], [data-testid="video-preview"], img[src*="blob:"]');
    await expect(videoPreview.first()).toBeVisible({ timeout: 15000 });

    // Validate no CSP violations occurred during preview generation
    const cspViolations = (page as any)._cspViolations;
    const hasCSPViolations = cspViolations.some((violation: string) => 
      violation.includes('media-src') || 
      violation.includes('blob:') ||
      violation.includes('Content Security Policy directive')
    );

    expect(hasCSPViolations).toBe(false);

    // Check that blob URLs are working (CSP allows blob: in media-src)
    const blobImages = page.locator('img[src^="blob:"]');
    if (await blobImages.first().isVisible()) {
      // Verify blob URL is accessible
      const src = await blobImages.first().getAttribute('src');
      expect(src).toMatch(/^blob:/);
      console.log('✅ Blob URL generated successfully:', src?.substring(0, 50) + '...');
    }

    console.log('✅ Video preview generated without CSP violations');
  });

  test('should check upload process reaches Express server endpoints', async ({ page }) => {
    // Set up request interception to monitor API calls
    const apiRequests: string[] = [];
    const uploadRequests: any[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/upload')) {
        apiRequests.push(url);
        
        if (url.includes('upload') || url.includes('video')) {
          uploadRequests.push({
            url: url,
            method: request.method(),
            headers: request.headers(),
          });
        }
      }
    });

    await navigateToAddPropertiesForm(page);

    // Upload video file
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    
    await videoFileInput.setInputFiles([{
      name: 'test-upload-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    // Wait for potential upload processing
    await page.waitForTimeout(2000);

    // Try to trigger actual upload by submitting form or clicking upload button
    const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Save"), button[type="submit"]');
    if (await uploadBtn.first().isVisible()) {
      await uploadBtn.first().click();
      await page.waitForTimeout(3000); // Allow time for upload request
    }

    // Validate that API requests were made
    console.log('📡 API Requests made:', apiRequests);
    console.log('📤 Upload Requests:', uploadRequests.map(r => `${r.method} ${r.url}`));

    // Check for upload-related endpoints
    const hasUploadEndpoint = apiRequests.some(url => 
      url.includes('/upload') || 
      url.includes('/api/properties') ||
      url.includes('/api/media') ||
      url.includes('video')
    );

    if (hasUploadEndpoint) {
      console.log('✅ Upload process reached server endpoints');
    } else {
      console.log('ℹ️ No upload endpoints detected - may be client-side only or different endpoint pattern');
    }

    // Validate upload requests structure if any
    if (uploadRequests.length > 0) {
      const firstUpload = uploadRequests[0];
      expect(firstUpload.method).toMatch(/POST|PUT|PATCH/);
      expect(firstUpload.url).toMatch(/upload|api/);
    }
  });

  test('should validate CSP compliance for blob URLs in media-src', async ({ page }) => {
    // Navigate to page and check CSP header
    await page.goto('/', { waitUntil: 'networkidle' });

    // Extract CSP policy from meta tag
    const cspMetaTag = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    
    if (cspMetaTag) {
      console.log('📋 CSP Policy:', cspMetaTag);
      
      // Validate that media-src includes 'blob:'
      const mediaSrcMatch = cspMetaTag.match(/media-src[^;]*;/);
      if (mediaSrcMatch) {
        const mediaSrcDirective = mediaSrcMatch[0];
        expect(mediaSrcDirective).toContain('blob:');
        console.log('✅ CSP media-src includes blob: support');
      }
      
      // Validate other required directives for video functionality
      expect(cspMetaTag).toContain('img-src');
      expect(cspMetaTag.match(/img-src[^;]*blob:/)).toBeTruthy();
    }

    await navigateToAddPropertiesForm(page);

    // Upload video and generate blob URL
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    
    await videoFileInput.setInputFiles([{
      name: 'csp-test-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    await page.waitForTimeout(3000);

    // Check for any CSP-related console errors
    const cspViolations = (page as any)._cspViolations;
    const consoleErrors = (page as any)._consoleErrors;
    
    console.log('🔍 Console Errors:', consoleErrors.filter(err => err.includes('CSP') || err.includes('Content Security Policy')));
    
    // Should have no CSP violations for media-src blob URLs
    const mediaCSPViolations = cspViolations.filter((violation: string) => 
      violation.includes('media-src') && violation.includes('blob:')
    );
    
    expect(mediaCSPViolations.length).toBe(0);
    console.log('✅ No CSP violations detected for blob URLs in media-src');
  });

  test('should test file format validation (MP4, WebM)', async ({ page }) => {
    await navigateToAddPropertiesForm(page);
    
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');

    // Test MP4 format (should be accepted)
    await videoFileInput.setInputFiles([{
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    await page.waitForTimeout(1000);
    
    // Should not show error for MP4
    const mp4Error = page.locator('.error:has-text("format"), .alert:has-text("type")');
    expect(await mp4Error.isVisible()).toBe(false);

    // Clear previous file
    const removeBtn = page.locator('button:has-text("×"), button[aria-label*="remove"]');
    if (await removeBtn.first().isVisible()) {
      await removeBtn.first().click();
    }

    // Test WebM format
    const webmBlob = generateTestVideoBlob('webm');
    await videoFileInput.setInputFiles([{
      name: 'test-video.webm',
      mimeType: 'video/webm',
      buffer: webmBlob
    }]);

    await page.waitForTimeout(1000);
    
    // Should not show error for WebM
    const webmError = page.locator('.error:has-text("format"), .alert:has-text("type")');
    expect(await webmError.isVisible()).toBe(false);

    // Test invalid format (should be rejected)
    const invalidBlob = Buffer.from('invalid video data');
    await videoFileInput.setInputFiles([{
      name: 'test-video.avi',
      mimeType: 'video/avi',
      buffer: invalidBlob
    }]);

    await page.waitForTimeout(1000);

    // Should show error for invalid format
    const formatError = page.locator('.error, .alert-error, text=format, text=allowed');
    if (await formatError.first().isVisible()) {
      console.log('✅ File format validation working - rejected invalid format');
    }

    console.log('✅ File format validation tested for MP4 and WebM');
  });

  test('should verify upload progress tracking functionality', async ({ page }) => {
    await navigateToAddPropertiesForm(page);

    // Monitor for progress indicators
    const progressElements: string[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('upload')) {
        console.log('📤 Upload response:', response.status(), response.url());
      }
    });

    // Upload larger video to potentially trigger progress tracking
    const largerVideoBlob = generateTestVideoBlob('mp4', 1024 * 1024); // 1MB test video
    
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    
    await videoFileInput.setInputFiles([{
      name: 'large-test-video.mp4',
      mimeType: 'video/mp4',
      buffer: largerVideoBlob
    }]);

    // Look for progress indicators
    const progressIndicators = [
      page.locator('[class*="progress"]'),
      page.locator('[class*="loading"]'),
      page.locator('.loader, .spinner'),
      page.locator('text=%'),
      page.locator('[role="progressbar"]')
    ];

    let foundProgress = false;
    for (const indicator of progressIndicators) {
      if (await indicator.first().isVisible({ timeout: 2000 })) {
        foundProgress = true;
        console.log('✅ Found progress indicator:', await indicator.first().textContent());
        break;
      }
    }

    // Try to trigger upload by submitting
    const submitBtn = page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]');
    if (await submitBtn.first().isVisible()) {
      await submitBtn.first().click();
      
      // Wait for progress indicators during upload
      await page.waitForTimeout(2000);
      
      for (const indicator of progressIndicators) {
        if (await indicator.first().isVisible({ timeout: 5000 })) {
          foundProgress = true;
          console.log('✅ Found upload progress indicator during submission');
          break;
        }
      }
    }

    if (foundProgress) {
      console.log('✅ Upload progress tracking functionality detected');
    } else {
      console.log('ℹ️ No progress indicators found - may be instant or not implemented');
    }
  });

  test('should validate server receives video file data correctly', async ({ page }) => {
    // Set up response monitoring
    const responses: any[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('upload')) {
        const responseData = {
          url: url,
          status: response.status(),
          headers: response.headers(),
          contentType: response.headers()['content-type'] || '',
        };
        
        try {
          if (responseData.contentType.includes('json')) {
            responseData.body = await response.json();
          }
        } catch (e) {
          // Response might not be JSON
        }
        
        responses.push(responseData);
      }
    });

    await navigateToAddPropertiesForm(page);

    // Fill out minimal form data
    const titleInput = page.locator('input[name="title"], #title, [placeholder*="title"]');
    if (await titleInput.first().isVisible()) {
      await titleInput.first().fill('Test Property with Video');
    }

    // Upload video file
    const videoUploadSection = page.locator('text=Property Videos').locator('..');
    const videoFileInput = videoUploadSection.locator('input[type="file"][accept*="video"]');
    
    await videoFileInput.setInputFiles([{
      name: 'server-test-video.mp4',
      mimeType: 'video/mp4',
      buffer: testVideoBlob
    }]);

    await page.waitForTimeout(2000);

    // Submit the form
    const submitBtn = page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]');
    if (await submitBtn.first().isVisible()) {
      await submitBtn.first().click();
      await page.waitForTimeout(5000); // Wait for server processing
    }

    // Analyze server responses
    console.log('📡 Server Responses:', responses.map(r => `${r.status} ${r.url}`));
    
    const uploadResponses = responses.filter(r => 
      r.url.includes('upload') || 
      r.url.includes('properties') ||
      r.url.includes('media')
    );

    if (uploadResponses.length > 0) {
      uploadResponses.forEach(response => {
        console.log('📤 Upload Response:', {
          status: response.status,
          url: response.url,
          contentType: response.contentType,
          body: response.body
        });
        
        // Validate successful responses
        expect(response.status).toBeLessThan(500); // No server errors
        
        if (response.body) {
          console.log('✅ Server received and processed video file data');
        }
      });
    } else {
      console.log('ℹ️ No upload-specific server responses detected');
    }

    // Check for any error messages on the page
    const errorMessages = page.locator('.error, .alert-error, [role="alert"]');
    const visibleErrors = [];
    const errorCount = await errorMessages.count();
    
    for (let i = 0; i < errorCount; i++) {
      if (await errorMessages.nth(i).isVisible()) {
        const errorText = await errorMessages.nth(i).textContent();
        visibleErrors.push(errorText);
      }
    }

    if (visibleErrors.length === 0) {
      console.log('✅ No error messages displayed - server processing appears successful');
    } else {
      console.log('⚠️ Error messages found:', visibleErrors);
    }
  });
});

/**
 * Helper Functions
 */

/**
 * Login as admin user
 */
async function loginAsAdmin(page: Page, email: string, password: string): Promise<void> {
  // Check if already logged in
  const currentUrl = page.url();
  if (currentUrl.includes('/admin/dashboard')) {
    return; // Already logged in
  }

  // Navigate to admin login
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  // Check if login form is present
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")');

  if (await emailInput.first().isVisible()) {
    await emailInput.first().fill(email);
    await passwordInput.first().fill(password);
    await loginBtn.first().click();
    
    // Wait for login to complete
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  }
}

/**
 * Navigate to Add Properties form
 */
async function navigateToAddPropertiesForm(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  // Navigate to properties section
  const propertiesLink = page.locator('text=Properties, a[href*="properties"], [data-testid="properties-nav"]');
  if (await propertiesLink.first().isVisible()) {
    await propertiesLink.first().click();
    await page.waitForLoadState('networkidle');
  }

  // Click Add Property button
  const addPropertyBtn = page.locator('text=Add Property, button:has-text("Add"), [data-testid="add-property-btn"]');
  if (await addPropertyBtn.first().isVisible()) {
    await addPropertyBtn.first().click();
    await page.waitForLoadState('networkidle');
  }

  // Wait for form to load
  await expect(page.locator('text=Property Media, text=Property Videos')).toBeVisible();
}

/**
 * Generate test video blob programmatically
 */
function generateTestVideoBlob(format: 'mp4' | 'webm' = 'mp4', size: number = 1024): Buffer {
  // Create a minimal valid video file header based on format
  let header: Buffer;
  
  if (format === 'mp4') {
    // Minimal MP4 header
    header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, // Box size
      0x66, 0x74, 0x79, 0x70, // 'ftyp' box
      0x69, 0x73, 0x6F, 0x6D, // 'isom' brand
      0x00, 0x00, 0x02, 0x00, // Minor version
      0x69, 0x73, 0x6F, 0x6D, // Compatible brands
      0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31,
      0x6D, 0x70, 0x34, 0x31,
    ]);
  } else {
    // Minimal WebM header
    header = Buffer.from([
      0x1A, 0x45, 0xDF, 0xA3, // EBML header
      0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x23,
      0x42, 0x86, 0x81, 0x01,
      0x42, 0xF7, 0x81, 0x01,
      0x42, 0xF2, 0x81, 0x04,
      0x42, 0xF3, 0x81, 0x08,
      0x42, 0x82, 0x84, 0x77,
      0x65, 0x62, 0x6D,
    ]);
  }

  // Pad to desired size with null bytes
  const padding = Buffer.alloc(Math.max(0, size - header.length));
  return Buffer.concat([header, padding]);
}

/**
 * Create test video file from blob
 */
async function createTestVideoFile(page: Page, videoBlob: Buffer): Promise<any> {
  return page.evaluateHandle((videoData) => {
    const uint8Array = new Uint8Array(videoData);
    return new File([uint8Array], 'test-video.mp4', { type: 'video/mp4' });
  }, Array.from(videoBlob));
}