# Deployment Guide - Vercel & Supabase

## 🚀 Deployment Overview

Gentle Space Realty uses a modern deployment strategy with **Vercel** for frontend hosting and **Supabase** for backend services. The application follows a direct frontend-to-Supabase architecture without traditional API routes.

## 📋 Prerequisites

### Required Accounts
- [Supabase Account](https://supabase.com) - Database and backend services
- [Vercel Account](https://vercel.com) - Frontend hosting and deployment
- [GitLab Account](https://gitlab.com) - Source code repository

### Local Development Setup
```bash
# Node.js version
node --version # Should be 18+ 

# Install dependencies
npm install

# Verify environment
npm run validate:env
```

## ⚙️ Supabase Configuration

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and fill project details:
   - **Name**: `gentle-space-realty`
   - **Database Password**: Generate secure password
   - **Region**: Choose closest to your users

### 2. Database Setup

```sql
-- Run these SQL commands in Supabase SQL Editor

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
CREATE TYPE property_category AS ENUM ('office-space', 'retail-space', 'warehouse', 'industrial');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'qualified', 'closed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables (see database-schema.md for complete schema)
```

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies (see database-schema.md for complete policies)
```

### 4. Storage Bucket Setup

1. Go to **Storage** in Supabase dashboard
2. Create bucket named `property-images`
3. Configure bucket policy:

```sql
-- Storage policy for property images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
```

### 5. Real-time Configuration

```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
```

## 🔑 Environment Variables

### Supabase Credentials

Get these from your Supabase project settings:

1. Go to **Settings** → **API**
2. Copy the following values:

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Optional
```

### Local Environment Setup

```bash
# Create environment file
cp .env.example .env.production

# Edit with your credentials
nano .env.production

# Validate environment
npm run validate:env
```

## 🏗️ Vercel Deployment Setup

### 1. Connect GitLab Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Import Project"**
3. Connect your GitLab account
4. Select repository: `gl-demo-ultimate-sragupathi/gentle_spaces`

### 2. Enhanced Project Configuration

The project now includes optimized `vercel.json` configuration with:

- **Serverless Functions**: API endpoints in `/api/` directory
- **Enhanced Security Headers**: Comprehensive security configuration
- **Optimized Caching**: Static assets with long-term caching
- **SPA Routing**: Proper fallbacks for client-side routing
- **Performance Optimization**: Compressed assets and efficient routing

```json
// vercel.json (Enhanced Configuration)
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/properties",
      "destination": "/api/properties.js"
    },
    {
      "source": "/api/inquiries",
      "destination": "/api/inquiries.js"
    },
    {
      "source": "/api/health",
      "destination": "/api/health.js"
    }
  ]
}
```

### 3. Enhanced Build Configuration

Optimized build settings for performance:

**Vercel Dashboard Settings**:
- **Framework Preset**: Vite
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --include=dev`
- **Node.js Version**: 18.x

**Build Optimizations**:
- Code splitting with vendor chunks
- Minification and compression
- Source maps disabled in production
- Bundle size optimization
- Asset optimization

### 4. Environment Variables in Vercel

Add environment variables in Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (optional)
NODE_ENV = production
```

## 🚀 Deployment Process

### Automatic Deployment

Vercel automatically deploys when you push to the main branch:

```bash
# Push changes to trigger deployment
git add .
git commit -m "Deploy: Update with latest changes"
git push origin main
```

### Enhanced Manual Deployment

```bash
# Complete deployment with validation
npm run deploy:vercel

# Step-by-step deployment
npm run vercel:prepare    # Validate and build
npm run vercel:deploy     # Deploy to Vercel
npm run vercel:health     # Health check

# Traditional Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

### Pre-deployment Validation

Enhanced validation pipeline:

```bash
# Comprehensive validation
npm run vercel:prepare

# This runs:
# - Environment variable validation
# - TypeScript compilation
# - ESLint checks
# - Unit tests
# - Optimized production build
# - API endpoint validation
# - Deployment metadata generation
```

## 📊 Post-Deployment Verification

### 1. Enhanced Health Checks

```bash
# Comprehensive deployment health check
npm run vercel:health https://your-app.vercel.app

# Traditional health checks
npm run health:check
npm run validate:supabase
npm run validate:comprehensive

# Additional deployment checks
npm run health:deployment
```

The enhanced health check validates:
- Main site accessibility
- All page routes (properties, about, contact, admin)
- API endpoint functionality
- Performance metrics (response times)
- Security headers validation
- CORS configuration

### 2. Enhanced Manual Testing Checklist

**Frontend Routes**:
- [ ] **Homepage loads** - `https://your-app.vercel.app`
- [ ] **Properties page** - `/properties` route
- [ ] **About page** - `/about` route
- [ ] **Contact page** - `/contact` route
- [ ] **Admin panel** - `/admin` route

**API Endpoints**:
- [ ] **Health endpoint** - `GET /api/health`
- [ ] **Properties API** - `GET /api/properties`
- [ ] **Inquiries API** - `POST /api/inquiries`
- [ ] **Debug info** - `GET /api/debug`

**Core Functionality**:
- [ ] **Authentication works** - Sign up/sign in functionality  
- [ ] **Property listings load** - Database connectivity
- [ ] **Image uploads work** - Storage integration
- [ ] **Real-time updates** - WebSocket connections
- [ ] **Forms submit** - Inquiry creation
- [ ] **Search functionality** - Full-text search
- [ ] **Admin panel access** - Role-based access

**Performance & Security**:
- [ ] **Load times** - < 3s on 3G, < 1s on WiFi
- [ ] **Security headers** - CSP, HSTS, etc.
- [ ] **CORS functionality** - API cross-origin requests
- [ ] **Asset caching** - Static assets cached properly

### 3. Performance Verification

```bash
# Check build artifacts
ls -la dist/
ls -la dist/assets/

# Verify bundle sizes
npm run validate:comprehensive
```

Expected bundle sizes:
- JavaScript: < 1MB total
- CSS: < 100KB total
- Images: Optimized and compressed

## 🔧 Production Configuration

### Build Optimization

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false // Disable in production
  }
});
```

### Security Headers

```typescript
// Additional security configuration (already in vercel.json)
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};
```

## 📈 Monitoring & Analytics

### 1. Vercel Analytics

Enable in Vercel dashboard:
- Go to **Analytics** tab
- Enable **Web Analytics**
- View performance metrics and user data

### 2. Supabase Monitoring

Monitor database performance:
- Go to Supabase **Dashboard** → **Logs**
- Check API usage and performance
- Monitor real-time connections

### 3. Custom Analytics

```typescript
// Track deployment success
const trackDeployment = async () => {
  await supabase.from('analytics_events').insert({
    event_type: 'deployment',
    event_data: {
      version: process.env.npm_package_version,
      environment: 'production',
      timestamp: new Date().toISOString()
    }
  });
};
```

## 🔄 Rollback Strategy

### Emergency Rollback

1. **Vercel Dashboard**:
   - Go to **Deployments**
   - Find last working deployment
   - Click **Promote to Production**

2. **Via CLI**:
```bash
# List recent deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url] --scope=your-team
```

### Database Rollback

```bash
# If database changes need rollback
supabase db reset --linked
supabase db push --linked

# Or restore from backup (Supabase Pro)
# Use Supabase dashboard backup restore feature
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment Variable Issues**
```bash
# Verify environment variables
npm run validate:env

# Check Vercel environment variables
vercel env ls
```

**Database Connection Issues**
```bash
# Test Supabase connection
npm run validate:supabase

# Check Supabase project status
# Visit Supabase dashboard
```

**Real-time Connection Issues**
- Check Supabase realtime logs
- Verify WebSocket connections aren't blocked
- Test with different networks

### Support Resources

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support  
- **GitLab Issues**: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces/-/issues
- **Project Health Check**: `npm run health:check`

## 📝 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured in Vercel
- [ ] Supabase project and database ready
- [ ] RLS policies implemented
- [ ] Storage bucket configured
- [ ] Real-time enabled for required tables
- [ ] Local testing passed (`npm run validate:all`)

### During Deployment
- [ ] Build succeeds without errors
- [ ] No TypeScript/ESLint issues
- [ ] Bundle size within limits
- [ ] Environment variables loaded correctly

### Post-deployment
- [ ] Application loads successfully
- [ ] Database connectivity working
- [ ] Authentication flows working
- [ ] File uploads functional
- [ ] Real-time updates working
- [ ] Performance metrics acceptable
- [ ] Health check passes

---

**Deployment URL**: https://gentle-space-realty.vercel.app  
**Repository**: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces.git  
**Supabase Dashboard**: https://app.supabase.com/project/your-project-id