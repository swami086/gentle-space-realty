# Vercel Deployment Plan for Gentle Space Realty

## Overview

This document outlines the complete deployment strategy for migrating the Gentle Space Realty application from a traditional Docker-based deployment to Vercel's serverless platform.

## Current Architecture

- **Frontend**: React/TypeScript with Vite build system
- **Backend**: Node.js/TypeScript Express API
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Local file system with multer
- **Deployment**: Docker containers with nginx reverse proxy

## Target Architecture (Vercel)

- **Frontend**: Static React build served by Vercel Edge
- **Backend**: Serverless functions in /api directory
- **Database**: Vercel Postgres or external PostgreSQL provider
- **File Storage**: Vercel Blob or AWS S3
- **Deployment**: Single Vercel project with unified domain

## Prerequisites

### 1. Vercel Account Setup

- Create Vercel account at vercel.com
- Install Vercel CLI: `npm i -g vercel`
- Connect GitHub repository to Vercel

### 2. Database Provider Selection

**Option A: Vercel Postgres (Recommended)**
- Native integration with Vercel
- Automatic connection pooling
- Built-in monitoring and scaling

**Option B: External Provider**
- Supabase, PlanetScale, or AWS RDS
- More control over database configuration
- Potentially lower costs for high usage

### 3. Cloud Storage Setup

**Option A: Vercel Blob (Recommended)**
- Native Vercel integration
- Simple API for file operations
- Automatic CDN distribution

**Option B: AWS S3**
- More storage options and configurations
- Existing AWS infrastructure integration
- Custom domain support

## Step-by-Step Implementation

### Phase 1: Serverless Adaptation

#### 1.1 Create Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

#### 1.2 Create API Entry Point

Create `/api/index.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/src/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
```

#### 1.3 Modify Express Server

Update `backend/src/server.ts`:
- Export the Express app instead of starting a server
- Remove `app.listen()` and graceful shutdown logic
- Add conditional logic for local development vs Vercel

### Phase 2: Database Migration

#### 2.1 Update Database Configuration

Modify `backend/src/config/database.ts`:
- Reduce connection pool size to 1-3 connections
- Add support for DATABASE_URL environment variable
- Configure SSL for production connections
- Implement connection reuse for serverless

#### 2.2 Create Migration Script

Create `database/migrations/vercel-init.sql`:
- Combine all existing migrations
- Add Vercel-specific optimizations
- Include initial seed data
- Create default admin user

### Phase 3: File Storage Migration

#### 3.1 Update File Storage Service

Modify `backend/src/services/fileStorage.ts`:
- Replace local file system with cloud storage API
- Update file URL generation for cloud storage
- Implement cloud storage deletion methods
- Add environment-based storage switching

#### 3.2 Update Upload Middleware

Modify `backend/src/middleware/upload.ts`:
- Replace multer.diskStorage with memory storage
- Update file validation for in-memory buffers
- Integrate with cloud storage service
- Remove local directory dependencies

### Phase 4: Build Configuration

#### 4.1 Update Package.json

Add Vercel build scripts to root `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm run build && cd backend && npm run build",
    "build": "vite build",
    "dev": "vite"
  }
}
```

#### 4.2 Update Vite Configuration

Modify `vite.config.ts`:
- Set correct base path for production
- Configure environment variables for API URL
- Optimize build for Vercel static serving

### Phase 5: Environment Configuration

#### 5.1 Required Environment Variables

**Frontend Variables (VITE_ prefix):**
```bash
VITE_API_URL=https://your-app.vercel.app/api
```

**Backend Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=gentle_space_realty
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
# OR for S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

## Deployment Process

### 1. Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

### 2. Configure Environment Variables

```bash
# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add BLOB_READ_WRITE_TOKEN
# ... add all required variables
```

### 3. Deploy to Preview

```bash
# Deploy to preview environment
vercel

# Test the preview deployment
# Verify all functionality works
```

### 4. Deploy to Production

```bash
# Deploy to production
vercel --prod
```

### 5. Configure Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com
```

## Database Setup

### Option A: Vercel Postgres

- Go to Vercel Dashboard → Storage → Create Database
- Select PostgreSQL
- Copy the connection string to DATABASE_URL
- Run migration script through Vercel dashboard or CLI

### Option B: External Provider

- Create database on chosen provider
- Configure connection string
- Ensure SSL is enabled for security
- Run migration scripts

## File Storage Setup

### Option A: Vercel Blob

- Go to Vercel Dashboard → Storage → Create Blob Store
- Copy the read/write token
- Update environment variables
- No additional configuration needed

### Option B: AWS S3

- Create S3 bucket with public read access
- Create IAM user with S3 permissions
- Configure CORS policy for your domain
- Update environment variables with AWS credentials

## Post-Deployment Verification

### 1. Frontend Verification

- [ ] Application loads correctly
- [ ] All pages render properly
- [ ] Navigation works
- [ ] Responsive design functions

### 2. API Verification

- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Authentication endpoints work: `POST /api/auth/login`
- [ ] Property endpoints function: `GET /api/properties`
- [ ] File upload works: `POST /api/upload`

### 3. Database Verification

- [ ] Database connection established
- [ ] Tables created correctly
- [ ] Seed data populated
- [ ] Queries execute successfully

### 4. File Storage Verification

- [ ] File uploads complete successfully
- [ ] Files are accessible via URLs
- [ ] File deletion works
- [ ] Image processing functions (if applicable)

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: "Connection pool exhausted" or timeout errors

**Solution**:
- Reduce connection pool size to 1-3
- Implement connection reuse pattern
- Check DATABASE_URL format

#### 2. File Upload Failures

**Problem**: Files not uploading or URLs not accessible

**Solution**:
- Verify cloud storage credentials
- Check CORS configuration
- Ensure proper permissions

#### 3. API Routes Not Found

**Problem**: 404 errors for API endpoints

**Solution**:
- Verify vercel.json rewrites configuration
- Check API file structure in /api directory
- Ensure proper export format

#### 4. Environment Variable Issues

**Problem**: Variables not accessible in functions

**Solution**:
- Verify variables are set in Vercel dashboard
- Check variable names and prefixes
- Redeploy after adding variables

#### 5. Build Failures

**Problem**: Build process fails during deployment

**Solution**:
- Check TypeScript compilation errors
- Verify all dependencies are listed
- Review build logs for specific errors

## Performance Optimization

### 1. Cold Start Reduction

- Minimize bundle size
- Use connection pooling
- Implement proper caching

### 2. Database Optimization

- Use prepared statements
- Implement query caching
- Optimize indexes

### 3. File Storage Optimization

- Use CDN for static assets
- Implement image optimization
- Configure proper caching headers

## Monitoring and Maintenance

### 1. Vercel Analytics

- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track error rates and response times

### 2. Database Monitoring

- Set up connection monitoring
- Monitor query performance
- Configure alerts for issues

### 3. Regular Maintenance

- Monitor storage usage
- Clean up old files periodically
- Update dependencies regularly
- Review and rotate secrets

## Cost Considerations

### Vercel Costs

- **Hobby Plan**: Free tier with limitations
- **Pro Plan**: $20/month with higher limits
- **Enterprise**: Custom pricing for large applications

### Database Costs

- **Vercel Postgres**: Pay-per-use pricing
- **External Providers**: Various pricing models

### Storage Costs

- **Vercel Blob**: Pay-per-GB stored and transferred
- **AWS S3**: Standard S3 pricing

## Security Considerations

### 1. Environment Variables

- Never commit secrets to version control
- Use Vercel's encrypted environment variables
- Rotate secrets regularly

### 2. Database Security

- Use SSL connections
- Implement proper access controls
- Regular security updates

### 3. File Upload Security

- Validate file types and sizes
- Scan for malware
- Implement rate limiting

### 4. API Security

- Use HTTPS only
- Implement proper authentication
- Add rate limiting and CORS

## Conclusion

This deployment plan provides a comprehensive approach to migrating the Gentle Space Realty application to Vercel. The key changes involve adapting the Express server for serverless execution, migrating from local file storage to cloud storage, and optimizing database connections for the serverless environment.

The migration maintains the existing application functionality while leveraging Vercel's global edge network for improved performance and scalability. Following this plan step-by-step will ensure a successful deployment with minimal downtime and maximum reliability.

## Architecture Diagram

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Vercel as Vercel Edge
    participant Frontend as Static Frontend
    participant API as Serverless API
    participant DB as PostgreSQL
    participant Storage as Cloud Storage

    User->>Vercel: Request Application
    Vercel->>Frontend: Serve Static Assets
    Frontend->>User: React Application

    User->>Vercel: API Request (/api/*)
    Vercel->>API: Route to Serverless Function
    API->>DB: Database Query
    DB->>API: Query Result
    
    alt File Upload Request
        API->>Storage: Upload to Cloud Storage
        Storage->>API: File URL
    end
    
    API->>Vercel: JSON Response
    Vercel->>User: API Response
    
    Note over API,DB: Connection pooling optimized for serverless
    Note over API,Storage: Local storage replaced with cloud storage
    Note over Vercel: Single domain serves both frontend and API
```