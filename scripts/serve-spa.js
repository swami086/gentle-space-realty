#!/usr/bin/env node

/**
 * Simple SPA server for preview testing
 * Serves the built application with proper client-side routing fallback
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Serve static files from dist directory
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Handle all routes that don't match static files
app.use((req, res, next) => {
  // If this is a static file request, let express.static handle it
  if (req.path.startsWith('/assets/') || 
      (req.path.includes('.') && !req.path.endsWith('.html'))) {
    return next();
  }
  
  // For all other routes, serve the SPA
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SPA Preview Server running at:`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
  console.log(`\n📁 Serving from: ${DIST_DIR}`);
  console.log(`✨ SPA routing enabled for client-side navigation`);
});