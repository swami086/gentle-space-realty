#!/usr/bin/env node

/**
 * Environment Setup Script
 * Interactive script to set up environment configuration
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Promisify readline question
 * @param {string} question 
 * @returns {Promise<string>}
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

/**
 * Load existing .env file if it exists
 * @returns {object}
 */
function loadExistingEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
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
 * Environment variable configurations
 */
const envConfig = {
  // Frontend variables (VITE_ prefix)
  frontend: [
    {
      key: 'VITE_API_BASE_URL',
      name: 'API Base URL',
      description: 'Base URL for your API server',
      example: 'http://localhost:3001/api',
      required: true,
      validate: (value) => {
        if (!value.startsWith('http')) {
          return 'Must start with http:// or https://';
        }
        return true;
      }
    },
    {
      key: 'VITE_SUPABASE_URL',
      name: 'Supabase Project URL',
      description: 'Your Supabase project URL',
      example: 'https://your-project-id.supabase.co',
      required: true,
      validate: (value) => {
        if (!value.includes('supabase.co')) {
          return 'Must be a valid Supabase URL';
        }
        return true;
      }
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      name: 'Supabase Anonymous Key',
      description: 'Your Supabase anonymous/public key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: true,
      sensitive: true
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      name: 'Google Maps API Key',
      description: 'Google Maps API key for location features',
      example: 'AIzaSy...',
      required: true,
      sensitive: true
    },
    {
      key: 'VITE_GOOGLE_OAUTH_CLIENT_ID',
      name: 'Google OAuth Client ID',
      description: 'Google OAuth client ID for authentication',
      example: '123456789-abcdef.apps.googleusercontent.com',
      required: false,
      sensitive: true
    },
    {
      key: 'VITE_SENTRY_DSN',
      name: 'Sentry DSN',
      description: 'Sentry Data Source Name for error tracking',
      example: 'https://key@organization.ingest.sentry.io/project-id',
      required: false,
      sensitive: true
    }
  ],
  
  // Backend variables
  backend: [
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      name: 'Supabase Service Role Key',
      description: 'Your Supabase service role key (keep secret!)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: true,
      sensitive: true
    },
    {
      key: 'SUPABASE_JWT_SECRET',
      name: 'Supabase JWT Secret',
      description: 'JWT secret from Supabase project settings',
      example: 'super-secret-jwt-token-with-at-least-32-characters-long',
      required: true,
      sensitive: true
    },
    {
      key: 'CORS_ORIGIN',
      name: 'CORS Origin',
      description: 'Allowed origins for CORS (frontend URL)',
      example: 'http://localhost:5173,https://yourdomain.com',
      required: true,
      validate: (value) => {
        const origins = value.split(',');
        for (const origin of origins) {
          if (!origin.trim().startsWith('http')) {
            return 'All origins must start with http:// or https://';
          }
        }
        return true;
      }
    }
  ],
  
  // Debug variables
  debug: [
    {
      key: 'VITE_DEBUG_AUTH',
      name: 'Debug Authentication',
      description: 'Enable authentication debugging',
      example: 'true',
      required: false,
      type: 'boolean'
    },
    {
      key: 'VITE_DEBUG_SUPABASE',
      name: 'Debug Supabase',
      description: 'Enable Supabase debugging',
      example: 'true',
      required: false,
      type: 'boolean'
    },
    {
      key: 'VITE_DEBUG_STARTUP',
      name: 'Debug Startup',
      description: 'Enable startup debugging',
      example: 'true',
      required: false,
      type: 'boolean'
    }
  ]
};

/**
 * Setup environment variables interactively
 * @param {object} existingEnv 
 * @returns {Promise<object>}
 */
async function setupEnvironment(existingEnv) {
  const newEnv = { ...existingEnv };
  
  log.header('🔧 Interactive Environment Setup');
  log.info('This will help you configure your environment variables.');
  log.info('Press Enter to keep existing values, or type new values.\n');
  
  // Setup mode selection
  log.subheader('Setup Mode:');
  log.info('1. Frontend only (React app)');
  log.info('2. Backend only (API server)');
  log.info('3. Full stack (both frontend and backend)');
  log.info('4. Debug variables only');
  
  const mode = await ask('Select setup mode (1-4) [3]: ') || '3';
  
  const sections = [];
  switch (mode) {
    case '1':
      sections.push('frontend');
      break;
    case '2':
      sections.push('backend');
      break;
    case '3':
      sections.push('frontend', 'backend');
      break;
    case '4':
      sections.push('debug');
      break;
    default:
      sections.push('frontend', 'backend');
  }
  
  // Process each section
  for (const section of sections) {
    log.header(`\n📋 ${section.charAt(0).toUpperCase() + section.slice(1)} Configuration`);
    
    for (const config of envConfig[section]) {
      const currentValue = existingEnv[config.key];
      let displayValue = currentValue;
      
      // Mask sensitive values
      if (config.sensitive && currentValue) {
        displayValue = currentValue.substring(0, 8) + '...';
      }
      
      const prompt = `\n${colors.bright}${config.name}${colors.reset}\n` +
        `Description: ${config.description}\n` +
        `Example: ${config.example}\n` +
        `Required: ${config.required ? 'Yes' : 'No'}\n` +
        (currentValue ? `Current: ${displayValue}\n` : '') +
        `Enter value${currentValue ? ' (or press Enter to keep current)' : ''}: `;
      
      let value = await ask(prompt);
      
      // Keep existing value if nothing entered
      if (!value && currentValue) {
        value = currentValue;
      }
      
      // Handle boolean type
      if (config.type === 'boolean' && value) {
        value = ['true', 'yes', '1', 'on'].includes(value.toLowerCase()) ? 'true' : 'false';
      }
      
      // Validate input
      if (value && config.validate) {
        const validation = config.validate(value);
        if (validation !== true) {
          log.error(`Validation failed: ${validation}`);
          log.info('Please run the setup again to correct this value.');
        }
      }
      
      // Warn about missing required values
      if (config.required && !value) {
        log.warning(`${config.name} is required but not set!`);
      }
      
      if (value) {
        newEnv[config.key] = value;
      }
    }
  }
  
  return newEnv;
}

/**
 * Generate .env file content
 * @param {object} env 
 * @returns {string}
 */
function generateEnvFile(env) {
  let content = `# Environment Configuration
# Generated by setup-env.js on ${new Date().toISOString()}
# 
# IMPORTANT: Never commit this file to version control!
# This file contains sensitive information.

# ================================
# FRONTEND CONFIGURATION (VITE_*)
# ================================

`;

  // Frontend variables
  envConfig.frontend.forEach(config => {
    content += `# ${config.description}\n`;
    content += `# Example: ${config.example}\n`;
    const value = env[config.key] || '';
    content += `${config.key}=${value}\n\n`;
  });

  content += `# ================================
# BACKEND CONFIGURATION
# ================================

`;

  // Backend variables
  envConfig.backend.forEach(config => {
    content += `# ${config.description}\n`;
    content += `# Example: ${config.example}\n`;
    const value = env[config.key] || '';
    content += `${config.key}=${value}\n\n`;
  });

  content += `# ================================
# DEBUG CONFIGURATION
# ================================

`;

  // Debug variables
  envConfig.debug.forEach(config => {
    content += `# ${config.description}\n`;
    const value = env[config.key] || 'false';
    content += `${config.key}=${value}\n`;
  });

  return content;
}

/**
 * Main setup function
 */
async function main() {
  try {
    log.header('🚀 Gentle Space Realty - Environment Setup');
    log.header('==========================================');
    
    // Check if .env already exists
    const existingEnv = loadExistingEnv();
    const hasExisting = Object.keys(existingEnv).length > 0;
    
    if (hasExisting) {
      log.success(`Found existing .env file with ${Object.keys(existingEnv).length} variables`);
      const overwrite = await ask('Do you want to modify the existing configuration? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        log.info('Setup cancelled. Your existing .env file is unchanged.');
        rl.close();
        return;
      }
    } else {
      log.info('No existing .env file found. Creating a new one.');
    }
    
    // Run interactive setup
    const newEnv = await setupEnvironment(existingEnv);
    
    // Preview and confirm
    log.header('\n📄 Configuration Preview');
    const nonSensitiveKeys = Object.keys(newEnv).filter(key => {
      const configs = [...envConfig.frontend, ...envConfig.backend, ...envConfig.debug];
      const config = configs.find(c => c.key === key);
      return !config?.sensitive;
    });
    
    nonSensitiveKeys.forEach(key => {
      log.info(`${key}=${newEnv[key]}`);
    });
    
    const sensitiveCount = Object.keys(newEnv).length - nonSensitiveKeys.length;
    if (sensitiveCount > 0) {
      log.info(`... and ${sensitiveCount} sensitive variables (hidden)`);
    }
    
    const confirm = await ask('\nSave this configuration to .env file? (Y/n): ');
    if (confirm.toLowerCase() === 'n') {
      log.info('Setup cancelled. No files were modified.');
      rl.close();
      return;
    }
    
    // Generate and write .env file
    const envContent = generateEnvFile(newEnv);
    const envPath = path.join(process.cwd(), '.env');
    
    // Backup existing file if it exists
    if (fs.existsSync(envPath)) {
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      log.info(`Existing .env backed up to: ${path.basename(backupPath)}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    log.success('✨ Environment configuration saved to .env file!');
    
    // Next steps
    log.header('\n🎯 Next Steps');
    log.info('1. Review your .env file and ensure all values are correct');
    log.info('2. Run: npm run validate:env');
    log.info('3. Start your development server: npm run dev');
    log.info('4. Never commit your .env file to version control');
    
    // Validate the new environment
    const runValidation = await ask('\nRun validation now? (Y/n): ');
    if (runValidation.toLowerCase() !== 'n') {
      log.info('\nRunning validation...');
      
      // Import and run validation
      try {
        const validation = spawn('node', ['scripts/validate-env.js'], {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        validation.on('close', (code) => {
          if (code === 0) {
            log.success('\n🎉 Setup completed successfully!');
          } else {
            log.warning('\n⚠️ Setup completed but validation found issues.');
            log.info('Please review the validation output and fix any errors.');
          }
          rl.close();
        });
      } catch (error) {
        log.warning('Could not run validation automatically.');
        log.info('Please run: npm run validate:env');
        rl.close();
      }
    } else {
      rl.close();
    }
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Environment Setup Script

Usage: node scripts/setup-env.js [options]

Options:
  --help, -h    Show this help message

This script provides an interactive setup process for configuring
your environment variables. It will guide you through setting up
both frontend and backend configurations.

Examples:
  node scripts/setup-env.js
  npm run setup:env
  `);
  process.exit(0);
}

// Run the setup
main();