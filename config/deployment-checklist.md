# 🚀 Production Deployment Checklist - Gentle Space Realty

## Pre-Deployment Validation ✅

### 1. Environment Configuration
- [ ] Copy `config/production.env.template` to `.env.production`
- [ ] Fill in all REQUIRED environment variables
- [ ] Generate secure JWT secrets (64+ characters)
- [ ] Configure production database URL
- [ ] Set up Vercel Blob storage token
- [ ] Configure SendGrid API key
- [ ] Set production domain in CORS_ORIGINS
- [ ] Run environment validation: `npm run env:validate`

### 2. Security Configuration
- [ ] Ensure no development values in production environment
- [ ] Verify JWT secrets are cryptographically secure
- [ ] Confirm CORS origins match production domains only
- [ ] Enable secure cookies (COOKIE_SECURE=true)
- [ ] Configure rate limiting appropriately
- [ ] Set up security headers in vercel.json
- [ ] Review CSP (Content Security Policy) settings

### 3. Database Preparation
- [ ] Create production database instance
- [ ] Run schema migration: `psql $DATABASE_URL -f database/production-schema.sql`
- [ ] Seed initial data: `psql $DATABASE_URL -f database/production-seed.sql`
- [ ] Update default admin password immediately after seeding
- [ ] Verify database connection and queries work
- [ ] Set up database backups and monitoring

### 4. File Storage Setup
- [ ] Configure Vercel Blob storage
- [ ] Test file upload functionality
- [ ] Set appropriate file size limits
- [ ] Configure CDN for static assets
- [ ] Verify image optimization settings

### 5. Email Service Configuration
- [ ] Set up SendGrid account and verify domain
- [ ] Configure SPF, DKIM, and DMARC records
- [ ] Test email sending functionality
- [ ] Set up email templates for notifications
- [ ] Configure bounce and complaint handling

### 6. Build and Code Quality
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Build application: `npm run build:vercel`
- [ ] Check bundle size and optimization

### 7. API Route Verification
- [ ] Test all API endpoints locally
- [ ] Verify serverless function configurations
- [ ] Test authentication flows
- [ ] Validate CORS settings
- [ ] Check rate limiting functionality
- [ ] Test file upload endpoints

### 8. Performance Optimization
- [ ] Enable compression in production
- [ ] Configure database connection pooling
- [ ] Set up caching where appropriate
- [ ] Optimize images and static assets
- [ ] Configure CDN for static content

## Deployment Process 🚀

### 1. Final Validation
```bash
# Run pre-deployment checks
npm run deploy:validate

# Verify environment configuration
npm run env:validate

# Test serverless handlers
npm run test:serverless
```

### 2. Deploy to Vercel
```bash
# Preview deployment (recommended first)
npm run vercel:preview

# Production deployment
npm run vercel:deploy
```

### 3. Domain Configuration
- [ ] Configure custom domain in Vercel dashboard
- [ ] Update DNS records to point to Vercel
- [ ] Verify SSL certificate is active
- [ ] Test domain resolution and redirects

## Post-Deployment Validation ✅

### 1. Health Checks
- [ ] Verify deployment completed successfully
- [ ] Check application loads at production URL
- [ ] Test health endpoint: `GET /api/health`
- [ ] Verify database connectivity
- [ ] Test file upload functionality

### 2. Functional Testing
- [ ] Test user registration and login
- [ ] Verify property listings display correctly
- [ ] Test inquiry form submission
- [ ] Check admin dashboard functionality
- [ ] Test image uploads and display
- [ ] Verify email notifications work

### 3. Security Validation
- [ ] Run security headers check: https://securityheaders.com
- [ ] Verify SSL/TLS configuration
- [ ] Test CORS configuration
- [ ] Check for information disclosure
- [ ] Verify authentication is working
- [ ] Test rate limiting

### 4. Performance Testing
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Test application under load
- [ ] Verify caching is working
- [ ] Monitor response times

### 5. Monitoring Setup
- [ ] Configure error tracking (Sentry)
- [ ] Set up application monitoring
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerting for critical issues

## Critical Post-Deployment Tasks 🔧

### 1. Security Hardening
```bash
# Change default admin password immediately
curl -X POST /api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gentlespace.com",
    "currentPassword": "admin123",
    "newPassword": "SECURE_RANDOM_PASSWORD"
  }'
```

### 2. Database Security
- [ ] Remove or disable sample/test users
- [ ] Update default passwords
- [ ] Configure database user permissions
- [ ] Enable database logging and monitoring

### 3. Monitoring and Alerting
- [ ] Set up uptime monitoring (Pingdom, Uptime Robot)
- [ ] Configure error rate alerting
- [ ] Set up database performance monitoring
- [ ] Enable log analysis and alerting

## Rollback Procedures 🔄

### Immediate Rollback (< 5 minutes)
1. **Vercel Dashboard Rollback**:
   - Go to Vercel dashboard > Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **DNS Rollback** (if domain issues):
   - Revert DNS changes to previous working configuration
   - Clear CDN cache if applicable

### Database Rollback
1. **Schema Rollback**:
   ```sql
   -- If schema changes cause issues, restore from backup
   pg_restore --clean --no-acl --no-owner -h hostname -U username -d database backup_file
   ```

2. **Data Rollback**:
   - Restore from most recent backup
   - Verify data integrity after restore

### Emergency Procedures
1. **Enable Maintenance Mode**:
   - Set `MAINTENANCE_MODE=true` in environment
   - Redeploy to show maintenance page

2. **Scale Down/Disable**:
   - Disable problematic API endpoints
   - Scale down serverless functions if needed

## Monitoring and Maintenance 📊

### Daily Monitoring
- [ ] Check error rates and response times
- [ ] Review application logs for issues
- [ ] Monitor database performance
- [ ] Check email delivery rates

### Weekly Tasks
- [ ] Review security logs
- [ ] Check backup integrity
- [ ] Update dependencies if needed
- [ ] Review performance metrics

### Monthly Tasks
- [ ] Security audit and vulnerability scan
- [ ] Database maintenance and optimization
- [ ] SSL certificate renewal check
- [ ] Cost optimization review

## Emergency Contacts 📞

**Development Team**:
- Primary Developer: [Contact Info]
- DevOps Engineer: [Contact Info]
- Database Administrator: [Contact Info]

**External Services**:
- Vercel Support: https://vercel.com/help
- Database Provider Support: [Provider Support]
- CDN Support: [CDN Provider Support]

## Documentation Links 📚

- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](../database/production-schema.sql)
- [Environment Configuration](./production.env.template)
- [Vercel Configuration](../vercel.json)

---

## Deployment Sign-off ✍️

**Pre-Deployment Approval**:
- [ ] Technical Lead: _________________ Date: _________
- [ ] Security Review: ________________ Date: _________
- [ ] QA Approval: ___________________ Date: _________

**Post-Deployment Verification**:
- [ ] Deployment Engineer: ____________ Date: _________
- [ ] Production Testing: ______________ Date: _________
- [ ] Go-Live Approval: _______________ Date: _________

**Deployment Details**:
- Deployment Date: _______________
- Deployment Version: ____________
- Vercel Deployment ID: __________
- Database Version: _____________