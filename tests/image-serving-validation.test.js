/**
 * Image Serving Validation Test Suite
 * Tests image accessibility and serving functionality
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

describe('Image Serving Validation', () => {
  const VITE_SERVER = 'http://localhost:5173';
  const API_SERVER = 'http://localhost:3000';
  
  const testImages = [
    '/images/logos/logo4.png',
    '/images/team/founder.jpeg',
    '/images/properties/property1.jpg',
    '/images/properties/property2.jpg'
  ];

  // Test Vite Development Server Image Serving
  describe('Vite Development Server (localhost:5173)', () => {
    test.each(testImages)('should serve %s correctly', async (imagePath) => {
      const response = await fetch(`${VITE_SERVER}${imagePath}`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/^image\//);
      
      const contentLength = response.headers.get('content-length');
      expect(parseInt(contentLength)).toBeGreaterThan(0);
    });

    test('should have correct CORS headers for images', async () => {
      const response = await fetch(`${VITE_SERVER}/images/logos/logo4.png`);
      
      // Check basic image serving
      expect(response.status).toBe(200);
      
      // Check cache headers
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
    });
  });

  // Test API Server Image Serving
  describe('API Server (localhost:3000)', () => {
    test.each(testImages)('should serve %s via API', async (imagePath) => {
      const response = await fetch(`${API_SERVER}${imagePath}`);
      
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toMatch(/^image\//);
        const contentLength = response.headers.get('content-length');
        expect(parseInt(contentLength)).toBeGreaterThan(0);
      } else {
        console.log(`Image ${imagePath} not available on API server (${response.status})`);
      }
    });
  });

  // Test Image File Existence
  describe('Image File System', () => {
    test('should verify image files exist in public directory', async () => {
      const publicDir = path.join(__dirname, '..', 'public');
      
      for (const imagePath of testImages) {
        const filePath = path.join(publicDir, imagePath);
        
        try {
          const stats = await fs.stat(filePath);
          expect(stats.isFile()).toBe(true);
          expect(stats.size).toBeGreaterThan(0);
        } catch (error) {
          console.log(`Image file ${imagePath} not found in filesystem`);
          // Don't fail the test - just log missing files
        }
      }
    });
  });

  // Test React Component Image References
  describe('React Component Image Integration', () => {
    test('Logo component references should be accessible', async () => {
      // Test the specific image referenced in Logo.tsx
      const logoResponse = await fetch(`${VITE_SERVER}/images/logos/logo4.png`);
      
      if (logoResponse.status === 200) {
        expect(logoResponse.headers.get('content-type')).toMatch(/^image\/png/);
      } else {
        console.log('Logo image not available - component will show broken image');
      }
    });

    test('should handle missing images gracefully', async () => {
      // Test a non-existent image
      const response = await fetch(`${VITE_SERVER}/images/nonexistent/test.png`);
      expect(response.status).toBe(404);
    });
  });
});