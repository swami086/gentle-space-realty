# Gentle Space Realty - Vercel Deployment Guide

Complete guide for deploying the Gentle Space Realty application to Vercel with full CI/CD pipeline integration.

## 🚀 Quick Deploy

### Prerequisites
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- [Git](https://git-scm.com/) repository set up
- Environment variables configured

### One-Click Deploy
1. **Fork/Clone** this repository
2. **Connect to Vercel**: Visit [vercel.com/new](https://vercel.com/new) and import your repository
3. **Configure Environment Variables** (see [Environment Configuration](#environment-configuration))
4. **Deploy**: Vercel will automatically build and deploy

## 📋 Deployment Checklist

### Pre-Deployment Validation
Run the comprehensive validation script:
```bash
npm run deploy:validate
```

This script validates:
- ✅ Environment variables
- ✅ TypeScript compilation
- ✅ Code quality (linting)
- ✅ Build process
- ✅ Security configuration
- ✅ Vercel configuration

### Build Process
```bash
npm run build:vercel
```

This command:
1. Validates environment variables
2. Runs TypeScript type checking
3. Builds the application
4. Optimizes assets for CDN
5. Creates pre-compressed versions
6. Generates performance report

## 🌍 Environment Configuration

### Development Environment
Copy the development template:
```bash
cp .env.development .env.local
```

Edit `.env.local` with your development settings.

### Production Environment (Vercel Dashboard)

Configure these environment variables in your Vercel Dashboard:

#### Required Variables
```bash
# Application
NODE_ENV=production
VITE_API_URL=https://your-api-domain.vercel.app

# Database (choose one)
DATABASE_URL=postgresql://user:pass@host:port/db
# Or for PlanetScale MySQL:
# DATABASE_URL=mysql://user:pass@host/db?ssl={"rejectUnauthorized":true}

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Storage Configuration (choose one)
```bash
# Option 1: Vercel Blob Storage (recommended)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Option 2: AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Option 3: Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Email Service (choose one)
```bash
# Option 1: SMTP (Gmail/Outlook)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Option 2: SendGrid (recommended)
SENDGRID_API_KEY=your-sendgrid-key

# Option 3: Mailgun
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-domain.com
```

#### Optional Enhancements
```bash
# Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# WhatsApp Business API
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Caching (Redis)
REDIS_URL=your-redis-connection-string

# Email Configuration
FROM_EMAIL=noreply@gentlespacerealty.com
FROM_NAME="Gentle Space Realty"
```

## 🔧 Build Configuration

### Package.json Scripts
The following scripts are configured for Vercel:

```json
{
  "scripts": {
    "build": "npm run env:validate && npm run typecheck && vite build",
    "build:vercel": "npm run build && npm run build:optimize",
    "env:validate": "node scripts/validate-env.js",
    "deploy:validate": "npm run typecheck && npm run lint && npm run test:unit",
    "deploy:prepare": "npm run deploy:validate && npm run build:vercel"
  }
}
```

### Vite Configuration
The `vite.config.ts` is optimized for Vercel with:
- **Code Splitting**: Separate chunks for vendors, forms, and utilities
- **Asset Optimization**: Optimized file naming and caching
- **Environment Variables**: Proper environment variable handling
- **Production Optimizations**: Minification and tree shaking

### Vercel Configuration
The `vercel.json` file configures:
- **Static Asset Serving**: Optimized caching headers
- **SPA Routing**: Proper fallback for client-side routing
- **Security Headers**: CORS, CSP, and security headers
- **Build Settings**: Node.js 18.x runtime
- **Regional Deployment**: US East and West regions

## 📊 Performance Optimization

### Automatic Optimizations
- **Code Splitting**: Separate vendor and application bundles
- **Asset Compression**: Pre-compressed gzip files
- **Caching Strategy**: Optimized cache headers for different asset types
- **Bundle Analysis**: Automated bundle size analysis

### CDN Configuration
Vercel automatically handles:
- **Global CDN**: Assets served from edge locations worldwide
- **Smart Caching**: Intelligent cache invalidation
- **Image Optimization**: Automatic image optimization and WebP conversion
- **Compression**: Gzip/Brotli compression for text assets

### Performance Monitoring
```bash
npm run build:optimize
```

This generates a performance report including:
- Bundle size analysis
- Asset optimization recommendations
- Compression savings
- Performance recommendations

## 🛡️ Security Configuration

### Automatic Security Features
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variable Validation**: Prevents secrets in development values
- **Dependency Security**: Automated vulnerability scanning

### Security Checklist
- ✅ Strong JWT secrets (32+ characters)
- ✅ No hardcoded secrets in code
- ✅ HTTPS enforcement
- ✅ Secure cookie settings
- ✅ Rate limiting configured
- ✅ Input validation implemented

## 🔄 CI/CD Pipeline

### GitHub Integration
1. **Connect Repository** to Vercel
2. **Automatic Deployments** on push to main branch
3. **Preview Deployments** for pull requests
4. **Build Status** checks

### Deployment Flow
```mermaid
graph TD
    A[Code Push] --> B[Vercel Trigger]
    B --> C[Environment Validation]
    C --> D[TypeScript Check]
    D --> E[Linting]
    E --> F[Build Process]
    F --> G[Asset Optimization]
    G --> H[Deploy to Edge]
    H --> I[Health Check]
    I --> J[DNS Update]
```

### Branch Strategy
- **Production**: `main` branch → Production deployment
- **Staging**: `develop` branch → Preview deployment
- **Features**: Feature branches → Preview deployments

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check environment variables
npm run env:validate

# Check TypeScript errors
npm run typecheck

# Check linting issues
npm run lint

# Full validation
npm run deploy:validate
```

#### Runtime Errors
1. **Database Connection**: Verify `DATABASE_URL` format
2. **CORS Issues**: Check `CORS_ORIGIN` matches frontend domain
3. **API Endpoints**: Verify `VITE_API_URL` is correct
4. **Authentication**: Ensure JWT secrets are set correctly

#### Performance Issues
```bash
# Analyze bundle size
npm run build:optimize

# Check for large assets
ls -la dist/assets/

# Verify compression
find dist -name "*.gz" -ls
```

### Debug Commands
```bash
# Local development with production build
npm run build && npm run preview

# Test environment validation
NODE_ENV=production npm run env:validate

# Check Vercel deployment logs
vercel logs [deployment-url]

# Run local deployment simulation
vercel dev
```

## 📈 Monitoring & Analytics

### Built-in Monitoring
- **Vercel Analytics**: Core Web Vitals and performance metrics
- **Error Tracking**: Automatic error reporting
- **Function Logs**: Serverless function monitoring
- **Real User Monitoring**: Actual user performance data

### Custom Monitoring
Configure these optional services:
- **Google Analytics**: User behavior tracking
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and debugging

## 🔧 Advanced Configuration

### Custom Domain
1. **Add Domain** in Vercel Dashboard
2. **Configure DNS** records
3. **SSL Certificate** automatically provisioned
4. **Update Environment Variables** to match new domain

### Edge Functions
For advanced server-side logic:
```bash
# Create edge functions
mkdir -p api
echo 'export default function handler(req, res) { res.json({status: "ok"}); }' > api/health.js
```

### Database Migrations
For production database setup:
```bash
# Run migrations (if applicable)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Production Best Practices](https://react.dev/learn/thinking-in-react)

## 🆘 Support

For deployment issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review Vercel build logs
3. Validate environment configuration
4. Run local validation scripts

---

## 🎉 Success Checklist

After deployment, verify:
- ✅ Frontend loads without errors
- ✅ API endpoints respond correctly
- ✅ Database connections work
- ✅ File uploads function
- ✅ Email notifications send
- ✅ Authentication works
- ✅ Admin dashboard accessible
- ✅ Mobile responsive design
- ✅ Performance meets targets
- ✅ Security headers present

**🚀 Your Gentle Space Realty application is now live on Vercel!**