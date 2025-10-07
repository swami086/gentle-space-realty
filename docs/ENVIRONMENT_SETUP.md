# Environment Configuration Guide

This guide explains how to set up environment variables for the Gentle Space Realty application.

## Quick Setup

### Automated Setup (Recommended)

Run the interactive setup script to configure your environment:

```bash
npm run setup:env
```

This script will guide you through setting up all required environment variables interactively.

### Manual Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values

3. **Validate your configuration**:
   ```bash
   npm run validate:env
   ```

## Environment Structure

The application uses a centralized environment configuration system with three main categories:

### 1. Frontend Variables (VITE_* prefix)

These variables are exposed to the browser and should not contain sensitive information:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# Google OAuth (Optional)
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com

# Error Tracking (Optional)
VITE_SENTRY_DSN=https://key@organization.ingest.sentry.io/project-id
```

### 2. Backend Variables

These variables are used server-side and contain sensitive information:

```env
# Supabase Service Configuration
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# Database (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Debug Variables

These variables control debugging features:

```env
# Enable debug logging
VITE_DEBUG_AUTH=true
VITE_DEBUG_SUPABASE=true
VITE_DEBUG_STARTUP=true
```

## Detailed Configuration

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your project credentials**:
   - Go to **Project Settings** → **API**
   - Copy the **Project URL** → `VITE_SUPABASE_URL`
   - Copy the **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - Copy the **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

3. **Get the JWT Secret**:
   - Go to **Project Settings** → **API**
   - Copy the **JWT Secret** → `SUPABASE_JWT_SECRET`

### Google Maps Setup

1. **Enable Google Maps APIs**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable **Maps JavaScript API**, **Geocoding API**, and **Maps Static API**

2. **Create an API key**:
   - Go to **APIs & Credentials** → **Credentials**
   - Create a new API key
   - Restrict it to your domains and required APIs
   - Copy the key → `VITE_GOOGLE_MAPS_API_KEY`

### Google OAuth Setup (Optional)

1. **Configure OAuth consent screen**:
   - Go to **APIs & Credentials** → **OAuth consent screen**
   - Fill in required information

2. **Create OAuth credentials**:
   - Go to **APIs & Credentials** → **Credentials**
   - Create **OAuth 2.0 Client IDs**
   - Add your domain to authorized origins
   - Copy the client ID → `VITE_GOOGLE_OAUTH_CLIENT_ID`

## Environment Templates

Use these templates for different deployment scenarios:

### Development (.env)

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Backend
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:5173

# Debug
VITE_DEBUG_AUTH=true
VITE_DEBUG_SUPABASE=true
VITE_DEBUG_STARTUP=true
```

### Production (.env.production)

```env
# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
VITE_SENTRY_DSN=https://key@organization.ingest.sentry.io/project-id

# Backend
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com

# Debug (disabled in production)
VITE_DEBUG_AUTH=false
VITE_DEBUG_SUPABASE=false
VITE_DEBUG_STARTUP=false
```

## Environment Validation

The application includes environment validation to ensure all required variables are properly configured:

### Automatic Validation

Environment validation runs automatically when the application starts. If validation fails, you'll see detailed error messages in the console.

### Manual Validation

Run the validation script at any time:

```bash
npm run validate:env
```

This will check:
- ✅ All required variables are present
- ✅ Variable formats are correct (URLs, API keys, etc.)
- ✅ Template files exist
- ⚠️ Warnings for placeholder values
- ❌ Errors for missing or invalid values

## Centralized Configuration

The application uses a centralized environment configuration system:

### Frontend Configuration (`src/config/environment.ts`)

```typescript
import { Environment } from '@/config/environment';

// Get API base URL
const apiUrl = Environment.getApiBaseUrl();

// Get Google Maps API key
const mapsKey = Environment.getGoogleMapsApiKey();

// Check debug mode
const isDebug = Environment.isDebugMode();
```

### Backend Configuration (`config/environment.ts`)

```typescript
import { validateBackendEnvironment } from '../config/environment';

// Validate and get backend config
const config = validateBackendEnvironment(process.env);
```

## Troubleshooting

### Common Issues

1. **"Environment variable not found" errors**:
   - Ensure your `.env` file is in the project root
   - Verify variable names match exactly (case-sensitive)
   - Restart your development server after changes

2. **Google Maps not loading**:
   - Check that `VITE_GOOGLE_MAPS_API_KEY` is set
   - Verify the API key has correct restrictions
   - Ensure required Google Maps APIs are enabled

3. **Supabase connection errors**:
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Check that your Supabase project is active
   - Ensure RLS policies are properly configured

### Debug Mode

Enable debug logging to troubleshoot issues:

```env
VITE_DEBUG_AUTH=true          # Authentication debugging
VITE_DEBUG_SUPABASE=true      # Supabase operation debugging
VITE_DEBUG_STARTUP=true       # Application startup debugging
```

### Validation Script Output

The validation script provides detailed feedback:

```bash
$ npm run validate:env

🔍 Environment Configuration Validator
=====================================

✅ Found .env file with 15 variables

Frontend Environment Validation:
ℹ Checking 4 required variables...
✅ VITE_API_BASE_URL: ✓ Valid
✅ VITE_SUPABASE_URL: ✓ Valid
✅ VITE_SUPABASE_ANON_KEY: ✓ Valid
✅ VITE_GOOGLE_MAPS_API_KEY: ✓ Valid

✨ All environment variables are properly configured!
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Restrict API keys** to specific domains and APIs
4. **Rotate secrets regularly** in production environments
5. **Use strong JWT secrets** (at least 32 characters)
6. **Enable Supabase RLS** for database security

## Deployment Notes

### Vercel

Set environment variables in the Vercel dashboard:
- Go to **Project Settings** → **Environment Variables**
- Add each variable for Production, Preview, and Development environments

### Netlify

Set environment variables in the Netlify dashboard:
- Go to **Site Settings** → **Environment Variables**
- Add each variable

### Docker

Use environment variables or `.env` files:

```dockerfile
# Copy environment file
COPY .env.production /app/.env

# Or use build args
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

## Need Help?

If you encounter issues with environment configuration:

1. Run the interactive setup: `npm run setup:env`
2. Run validation: `npm run validate:env`
3. Check the console for detailed error messages
4. Refer to the template files in the `config/` directory
5. Review this documentation for specific service setup instructions

For additional support, check the project's issue tracker or documentation.