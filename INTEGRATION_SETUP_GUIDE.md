# 🚀 Integration Setup Guide - Gentle Space Realty

This comprehensive guide walks you through setting up, validating, and deploying the complete Gentle Space Realty integration stack with Supabase and Vercel.

## 📋 Prerequisites

- **Node.js** 20+ installed
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase** account and project
- **Vercel** account for deployment
- **MCP servers** (optional, for advanced features)

## 🏗️ Architecture Overview

```
Frontend (React + Vite)
    ↓
API Layer (Vercel Serverless)
    ↓
Database (Supabase PostgreSQL)
    ↓
Real-time (Supabase Realtime)
```

## 🔧 Initial Setup

### 1. Environment Configuration

Create your environment files:

```bash
# Copy example environment
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

Required environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Application Configuration
VITE_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Optional: Analytics
VITE_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 2. Supabase Setup

#### Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  property_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'available',
  images TEXT[],
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (for admin users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Properties are publicly viewable" 
  ON properties FOR SELECT 
  USING (true);

CREATE POLICY "Inquiries are publicly insertable" 
  ON inquiries FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admin can manage all inquiries" 
  ON inquiries FOR ALL 
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM profiles WHERE role = 'admin'
  ));
```

#### Authentication Setup
1. Go to **Authentication > Settings** in Supabase
2. Enable **Email** provider
3. Add your domain to **Site URL**: `https://your-app.vercel.app`
4. Add redirect URLs:
   - `https://your-app.vercel.app/admin`
   - `http://localhost:5173/admin` (for development)

### 3. Local Development Setup

```bash
# Install dependencies
npm install

# Validate environment
npm run validate:env

# Start development server
npm run dev

# In another terminal, test the integration
npm run validate:integration
```

## 🧪 Validation & Testing

### Comprehensive Validation
Our custom integration validator checks all system components:

```bash
# Basic integration validation
npm run validate:integration

# Include MCP server tests
npm run validate:mcp

# Full production validation
npm run validate:production

# Individual validations
npm run validate:env
npm run validate:supabase
npm run test:unit
```

### Validation Checklist
The validator checks:

- ✅ **Environment**: All required variables set
- ✅ **Supabase**: Database connectivity & tables
- ✅ **API Endpoints**: All 5 serverless functions
- ✅ **Build Process**: Compilation & artifacts
- ✅ **Security**: Headers & HTTPS enforcement
- ✅ **Deployment**: Vercel configuration

### Manual Testing
```bash
# Test API endpoints locally
curl http://localhost:5173/api/health
curl http://localhost:5173/api/properties

# Test Supabase connection
npm run validate:supabase

# Run full test suite
npm run test
npm run test:coverage
```

## 🚀 Deployment Process

### 1. Pre-Deployment Validation
```bash
# Comprehensive pre-deployment check
npm run deploy:check

# This runs:
# - Environment validation
# - Build process
# - Unit tests
# - Integration tests
```

### 2. Vercel Deployment

#### Automatic Deployment (Recommended)
```bash
# Full deployment with validation
npm run deploy:full

# This sequence:
# 1. Validates integration
# 2. Builds optimized bundle
# 3. Deploys to Vercel
# 4. Validates production deployment
```

#### Manual Deployment
```bash
# Step-by-step process
npm run validate:integration
npm run build
npx vercel --prod
npm run validate:production
```

### 3. Environment Variables in Vercel

Set these in your Vercel project settings:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NODE_ENV=production
```

## 🔍 MCP Server Integration (Optional)

### Supabase MCP Setup
```bash
# Install Supabase MCP
npm install -g @supabase/mcp

# Configure MCP server
supabase mcp configure --project-ref your-project-ref
```

### Testing MCP Integration
```bash
# Test MCP connectivity
npm run validate:mcp

# Use MCP tools in development
supabase mcp query "SELECT * FROM properties LIMIT 5"
```

## 📊 Monitoring & Analytics

### Built-in Health Monitoring
- **Health Endpoint**: `/api/health` - System status
- **Debug Endpoint**: `/api/debug` - Detailed diagnostics
- **Validation Scripts**: Automated health checks

### Vercel Analytics Integration
```typescript
// Already integrated in the app
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Performance Monitoring
```bash
# Run performance tests
npm run test:load

# Check bundle size
npm run build
npm run build:analyze
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Environment Variables Not Loading
```bash
# Check environment file exists
ls -la .env*

# Validate environment variables
npm run validate:env

# Restart development server
npm run dev
```

#### 2. Supabase Connection Issues
```bash
# Test Supabase connectivity
npm run validate:supabase

# Check Supabase project status
supabase status

# Verify RLS policies
supabase db diff
```

#### 3. API Endpoints Not Working
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/health

# Check Vercel function logs
npx vercel logs

# Validate API configuration
npm run validate:deployment
```

#### 4. Build Failures
```bash
# Clean build artifacts
rm -rf dist node_modules
npm install
npm run build

# Check for TypeScript errors
npm run typecheck

# Validate build configuration
npm run validate:integration
```

#### 5. CORS Issues
Check your Vercel configuration in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Debug Commands
```bash
# Full system debug
npm run validate:integration --verbose

# API-specific debugging
node scripts/validate-integration.js --deployment

# Database debugging
npm run validate:supabase

# Build debugging
npm run build --verbose
```

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm install
      
      - name: Validate integration
        run: npm run validate:integration
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        run: npm run deploy:full
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 📈 Performance Optimization

### Build Optimization
- **Bundle Splitting**: Automatic code splitting
- **Asset Optimization**: Image compression & CDN
- **Tree Shaking**: Unused code elimination
- **Compression**: Gzip/Brotli compression

### Database Optimization
- **Indexes**: Optimized query performance
- **RLS**: Row-level security for data protection
- **Connection Pooling**: Efficient database connections

### API Optimization
- **Function Warming**: Reduced cold starts
- **Response Caching**: Optimized API responses
- **Error Handling**: Graceful error recovery

## 🔒 Security Best Practices

### Environment Security
- ✅ Service keys never exposed to frontend
- ✅ Environment variables properly configured
- ✅ HTTPS enforced everywhere
- ✅ CSP headers configured

### Database Security
- ✅ RLS policies implemented
- ✅ Input validation & sanitization
- ✅ Admin role restrictions
- ✅ Audit logging enabled

### API Security
- ✅ CORS properly configured
- ✅ Rate limiting implemented
- ✅ Input validation on all endpoints
- ✅ Security headers enforced

## 🎯 Next Steps

1. **Run the validation**: `npm run validate:integration`
2. **Deploy to Vercel**: `npm run deploy:full`
3. **Set up monitoring**: Configure alerts and analytics
4. **Scale as needed**: Add more features and optimizations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: This guide and inline code comments
- **Validation**: Run `npm run validate:integration` for health checks

---

**Quick Start Command**: `npm run validate:integration && npm run deploy:full`

This will validate your entire integration and deploy to production with full validation checks.