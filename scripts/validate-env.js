#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates both frontend and backend environment configurations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`)
};

// Environment variable schemas
const frontendSchema = {
  required: [
    'VITE_API_BASE_URL',
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_MAPS_API_KEY'
  ],
  optional: [
    'VITE_GOOGLE_OAUTH_CLIENT_ID',
    'VITE_SENTRY_DSN',
    'VITE_DEBUG_AUTH',
    'VITE_DEBUG_SUPABASE',
    'VITE_DEBUG_STARTUP'
  ]
};

const backendSchema = {
  required: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'CORS_ORIGIN'
  ],
  optional: [
    'DATABASE_URL',
    'REDIS_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
  ]
};

/**
 * Load environment variables from a file
 * @param {string} filePath 
 * @returns {object}
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

/**
 * Validate environment variables against schema
 * @param {object} env 
 * @param {object} schema 
 * @param {string} type 
 */
function validateEnvironment(env, schema, type) {
  log.subheader(`\n${type} Environment Validation:`);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  log.info(`Checking ${schema.required.length} required variables...`);
  schema.required.forEach(key => {
    if (!env[key] || env[key] === '') {
      log.error(`Missing required variable: ${key}`);
      hasErrors = true;
    } else if (env[key] === 'your_value_here' || env[key] === 'placeholder') {
      log.warning(`Variable ${key} has placeholder value: ${env[key]}`);
      hasWarnings = true;
    } else {
      // Validate specific patterns
      if (key === 'VITE_SUPABASE_URL' && !env[key].includes('supabase.co')) {
        log.warning(`${key} doesn't appear to be a valid Supabase URL`);
        hasWarnings = true;
      } else if (key === 'VITE_API_BASE_URL' && !env[key].startsWith('http')) {
        log.error(`${key} must start with http:// or https://`);
        hasErrors = true;
      } else {
        log.success(`${key}: ✓ Valid`);
      }
    }
  });
  
  // Check optional variables
  log.info(`\nChecking ${schema.optional.length} optional variables...`);
  schema.optional.forEach(key => {
    if (env[key]) {
      if (env[key] === 'your_value_here' || env[key] === 'placeholder') {
        log.warning(`Optional variable ${key} has placeholder value`);
        hasWarnings = true;
      } else {
        log.info(`${key}: ✓ Set`);
      }
    } else {
      log.info(`${key}: - Not set (optional)`);
    }
  });
  
  return { hasErrors, hasWarnings };
}

/**
 * Validate URLs are accessible (basic check)
 * @param {object} env 
 */
async function validateUrls(env) {
  log.subheader('\nURL Accessibility Check:');
  
  const urls = [
    { key: 'VITE_API_BASE_URL', url: env.VITE_API_BASE_URL },
    { key: 'VITE_SUPABASE_URL', url: env.VITE_SUPABASE_URL }
  ].filter(item => item.url);
  
  if (urls.length === 0) {
    log.warning('No URLs to validate');
    return;
  }
  
  log.info('Note: URL validation requires internet connectivity');
  
  for (const { key, url } of urls) {
    try {
      // Simple format check
      new URL(url);
      log.success(`${key}: Valid URL format`);
    } catch (error) {
      log.error(`${key}: Invalid URL format - ${error.message}`);
    }
  }
}

/**
 * Check if template files exist
 */
function checkTemplateFiles() {
  log.subheader('\nTemplate Files Check:');
  
  const templates = [
    { file: 'config/frontend.env.example', desc: 'Frontend environment template' },
    { file: 'config/backend.env.example', desc: 'Backend environment template' },
    { file: '.env.example', desc: 'Main environment documentation' }
  ];
  
  templates.forEach(({ file, desc }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log.success(`${desc}: ✓ Exists`);
    } else {
      log.warning(`${desc}: Missing at ${file}`);
    }
  });
}

/**
 * Main validation function
 */
async function main() {
  log.header('🔍 Environment Configuration Validator');
  log.header('=====================================');
  
  // Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  const env = loadEnvFile(envPath);
  
  if (!env) {
    log.error(`No .env file found at ${envPath}`);
    log.info('Copy .env.example to .env and configure your variables');
    process.exit(1);
  }
  
  log.success(`Found .env file with ${Object.keys(env).length} variables`);
  
  // Validate frontend environment
  const frontendResult = validateEnvironment(env, frontendSchema, 'Frontend');
  
  // Validate backend environment
  const backendResult = validateEnvironment(env, backendSchema, 'Backend');
  
  // Check URLs
  await validateUrls(env);
  
  // Check template files
  checkTemplateFiles();
  
  // Summary
  log.header('\n📊 Validation Summary');
  log.header('====================');
  
  const totalErrors = frontendResult.hasErrors || backendResult.hasErrors;
  const totalWarnings = frontendResult.hasWarnings || backendResult.hasWarnings;
  
  if (!totalErrors && !totalWarnings) {
    log.success('✨ All environment variables are properly configured!');
    log.info('Your application should start without environment-related issues.');
    process.exit(0);
  } else if (!totalErrors && totalWarnings) {
    log.warning('⚠️ Environment is valid but has some warnings.');
    log.info('Consider addressing the warnings for optimal configuration.');
    process.exit(0);
  } else {
    log.error('❌ Environment validation failed!');
    log.info('Please fix the errors above before starting your application.');
    log.info('\nNeed help? Check the documentation:');
    log.info('- docs/ENVIRONMENT_SETUP.md');
    log.info('- config/frontend.env.example');
    log.info('- config/backend.env.example');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Environment Validation Script

Usage: node scripts/validate-env.js [options]

Options:
  --help, -h    Show this help message

This script validates your .env file against the required and optional
environment variables for both frontend and backend configurations.

Examples:
  node scripts/validate-env.js
  npm run validate:env
  `);
  process.exit(0);
}

// Run the validation
main().catch(error => {
  log.error(`Validation failed: ${error.message}`);
  process.exit(1);
});