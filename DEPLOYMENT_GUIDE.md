# Gentle Space Realty - Vercel Deployment Guide

## 🚀 Production Deployment Status

**Vercel Project URL**: https://vercel.com/swamis-projects-c596d1fd/gentle_spaces  
**Deployment Status**: Ready for deployment  
**Configuration**: Complete  

## 📋 Pre-Deployment Checklist

✅ **Project Configuration**
- [x] Vercel configuration file (`vercel.json`) created
- [x] API directory structure (`/api`) set up for serverless functions
- [x] Build scripts updated for Vercel deployment
- [x] Dependencies updated with required packages
- [x] Environment validation script created

✅ **Backend Adaptation**
- [x] Express server adapted for serverless execution
- [x] Database connection optimized for serverless
- [x] API routes configured for Vercel functions
- [x] Error handling updated for production
- [x] Rate limiting configured for serverless

✅ **Frontend Configuration**
- [x] Build process optimized for Vercel
- [x] API URL configuration for production
- [x] CORS settings configured
- [x] Asset optimization enabled

## 🔧 Manual Deployment Steps

### Step 1: Login to Vercel

```bash
# Login to Vercel CLI
vercel login

# Follow the authentication URL:
# Visit: https://vercel.com/oauth/device?user_code=FDPF-FPDJ
# Or use your existing Vercel account
```

### Step 2: Link Project to Vercel

```bash
# Initialize Vercel project
vercel

# Select options:
# - Set up and deploy? Yes
# - Which scope? Your personal account
# - Link to existing project? Yes
# - What's the name of your existing project? gentle_spaces
```

### Step 3: Configure Environment Variables

**Required Environment Variables in Vercel Dashboard:**

#### Database Configuration
```bash
# Production Database (Choose one)

# Option A: Vercel Postgres
DATABASE_URL=postgresql://default:***@***-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require

# Option B: External Provider (Supabase, PlanetScale, etc.)
DATABASE_URL=postgresql://user:password@host:port/database
```

#### JWT Secrets (Generate secure random strings)
```bash
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-different-from-jwt
```

#### API Configuration
```bash
VITE_API_URL=https://gentle-space-realty.vercel.app/api
CORS_ORIGIN=https://gentle-space-realty.vercel.app
```

#### File Storage (Choose one)
```bash
# Option A: Vercel Blob (Recommended)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_***

# Option B: AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=gentle-space-realty-uploads
```

#### Email Configuration (Optional)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Set Up Database

#### Option A: Vercel Postgres
1. Go to Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Copy the connection string to `DATABASE_URL`
4. Run database migrations

#### Option B: External Database Provider
1. Create database on chosen provider (Supabase, PlanetScale, etc.)
2. Configure connection string
3. Ensure SSL is enabled
4. Run database migrations

#### Database Migration Commands
```bash
# After database is configured, run migrations
vercel env pull .env.local
npm run db:migrate
```

### Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs
```

## 🗄️ Database Setup Commands

### Create Database Schema
```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    property_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available',
    featured BOOLEAN DEFAULT false,
    images JSON,
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Seed Default Admin User
```sql
-- Create default admin user
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
    'admin@gentlespace.com',
    '$2b$12$hash', -- Replace with actual bcrypt hash
    'System Administrator',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;
```

## 🔍 Verification Checklist

### Frontend Verification
- [ ] Application loads at production URL
- [ ] All pages render correctly
- [ ] Navigation works properly
- [ ] Responsive design functions
- [ ] Images and assets load correctly

### API Verification
- [ ] Health check: `GET /api/health`
- [ ] Authentication: `POST /api/auth/login`  
- [ ] Properties: `GET /api/properties`
- [ ] File upload: `POST /api/upload`
- [ ] CORS headers present
- [ ] Rate limiting active

### Database Verification
- [ ] Database connection established
- [ ] Tables created successfully
- [ ] Default admin user exists
- [ ] Queries execute without errors
- [ ] SSL connection secure

### File Storage Verification
- [ ] File uploads complete successfully
- [ ] Uploaded files accessible via URLs
- [ ] File deletion works
- [ ] Storage quotas configured

## 🔒 Security Configuration

### Required Security Headers
```javascript
// Already configured in helmet middleware
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}
```

### CORS Configuration
```javascript
// Production CORS settings
{
  origin: process.env.CORS_ORIGIN?.split(',') || 'https://gentle-space-realty.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
}
```

### Rate Limiting
```javascript
// Serverless-optimized rate limiting
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Reduced for serverless
  standardHeaders: true,
  legacyHeaders: false,
}
```

## 📊 Performance Optimization

### Frontend Performance
- **Bundle Splitting**: Implemented in Vite configuration
- **Asset Optimization**: Automated compression enabled
- **CDN Distribution**: Automatic via Vercel Edge Network
- **Image Optimization**: Vercel Image Optimization enabled

### Backend Performance
- **Connection Pooling**: Optimized for serverless (1-3 connections)
- **Caching Strategy**: In-memory caching for frequent queries
- **Cold Start Optimization**: Minimal bundle size and lazy loading
- **Database Optimization**: Indexed queries and prepared statements

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Environment Variables Not Loading
**Symptoms**: `undefined` environment variables in functions
**Solution**: 
- Verify variables are set in Vercel Dashboard
- Redeploy after adding variables
- Check variable names match exactly

#### 2. Database Connection Errors
**Symptoms**: Connection timeout or pool exhaustion
**Solution**:
- Check DATABASE_URL format
- Ensure SSL is enabled for production
- Reduce connection pool size (1-3 for serverless)

#### 3. API Routes Not Found (404)
**Symptoms**: 404 errors for `/api/*` endpoints  
**Solution**:
- Verify `vercel.json` rewrites configuration
- Check API files are in correct `/api` directory
- Ensure proper export format in API functions

#### 4. CORS Issues
**Symptoms**: CORS errors in browser console
**Solution**:
- Update `CORS_ORIGIN` environment variable
- Check frontend domain matches CORS configuration
- Verify credentials are set correctly

#### 5. File Upload Failures
**Symptoms**: Upload errors or 413 payload too large
**Solution**:
- Check file storage configuration (Blob token or S3 credentials)
- Verify file size limits
- Check network connectivity to storage provider

## 🌍 Production URLs

**Frontend Application**: https://gentle-space-realty.vercel.app  
**API Base URL**: https://gentle-space-realty.vercel.app/api  
**Health Check**: https://gentle-space-realty.vercel.app/api/health  
**Admin Dashboard**: https://gentle-space-realty.vercel.app/admin  

## 📈 Monitoring and Maintenance

### Vercel Analytics
- Performance monitoring enabled
- Function execution time tracking
- Error rate monitoring
- Bandwidth usage tracking

### Database Monitoring  
- Connection pool monitoring
- Query performance tracking
- Storage usage alerts
- Backup schedule (if applicable)

### Regular Maintenance Tasks
- Monitor storage usage and clean up old files
- Review and rotate security secrets
- Update dependencies regularly
- Monitor performance metrics

## 🔄 Deployment Commands Summary

```bash
# Environment setup
vercel login
vercel env pull .env.local

# Deploy to preview
vercel

# Deploy to production  
vercel --prod

# Monitor logs
vercel logs

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Check deployment status
vercel list
vercel inspect gentle-space-realty
```

## 📞 Support and Next Steps

### Immediate Actions Required:
1. **Manual Login**: Complete Vercel CLI authentication
2. **Environment Variables**: Set up all required variables in Vercel Dashboard
3. **Database Setup**: Create and configure production database
4. **DNS Configuration**: Set up custom domain (optional)
5. **Monitoring Setup**: Configure alerts and monitoring

### Post-Deployment Testing:
1. Test all user flows
2. Verify admin dashboard functionality
3. Test file upload and storage
4. Verify email notifications
5. Test mobile responsiveness
6. Perform load testing

**Ready for Production**: All configuration files and deployment assets are prepared. Manual steps required for authentication and environment variable setup.