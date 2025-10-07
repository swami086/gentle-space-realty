# Vercel Environment Variables Setup Guide

This guide explains how to set up environment variables in Vercel for the Gentle Space Realty production deployment.

## ✅ Supabase Configuration (Validated)

The `.env.production` file has been created with validated Supabase configuration:

- **Project**: Gentle_Space_Sep (nfryqqpfprupwqayirnc)
- **Status**: ACTIVE_HEALTHY
- **Region**: ap-south-1
- **Database**: PostgreSQL 17.6.1.003

## 🔐 Required Vercel Environment Variables

### Critical Secret Keys (Set via Vercel Dashboard)

```bash
# 1. Supabase Service Role Key
# Get from: Supabase Dashboard → Project Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 2. Database Connection String
# Replace [password] with your actual database password
DATABASE_URL=postgresql://postgres:[password]@db.nfryqqpfprupwqayirnc.supabase.co:5432/postgres

# 3. Session Secret (Generate strong random string)
SESSION_SECRET=your-strong-32-character-session-secret-here

# 4. SMTP Configuration (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 5. Optional Analytics Keys
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

## 🚀 Deployment Commands

### Set Environment Variables in Vercel CLI

```bash
# Navigate to project directory
cd /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b

# Set critical variables
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production

# Optional: SMTP settings
vercel env add SMTP_HOST production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production

# Optional: Analytics
vercel env add VITE_GA_TRACKING_ID production
vercel env add VITE_SENTRY_DSN production
```

### Deploy to Vercel

```bash
# Deploy with production environment
vercel --prod

# Or deploy and set environment file
vercel --prod --env-file .env.production
```

## 📋 Pre-deployment Checklist

### ✅ Validated Configurations

- [x] **Supabase URL**: https://nfryqqpfprupwqayirnc.supabase.co
- [x] **Supabase Anon Key**: Validated and active
- [x] **Database Connection**: PostgreSQL 17.6 accessible
- [x] **Project Status**: ACTIVE_HEALTHY

### ⚠️ Required Actions

- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel Dashboard
- [ ] Set `DATABASE_URL` with actual password
- [ ] Set `SESSION_SECRET` (32+ character random string)
- [ ] Configure SMTP settings (if email notifications needed)
- [ ] Set analytics keys (optional)

## 🔧 Environment Variable Reference

### Vercel Dashboard Path
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: "gentle-space-realty"
3. Navigate to Settings → Environment Variables
4. Add production variables

### Environment Variable Format
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production
```

## 🛡️ Security Best Practices

1. **Never commit secrets**: Service role key and passwords are excluded from Git
2. **Use Vercel references**: Reference variables as `@variable-name` in code
3. **Separate environments**: Use different keys for development/production
4. **Regular rotation**: Rotate API keys and secrets periodically
5. **Minimal permissions**: Use least-privilege access for all keys

## 🔍 Testing Deployment

### Validate Environment Variables
```bash
# Check if variables are set
vercel env ls

# Test deployment locally
vercel dev

# Check production deployment
curl https://gentle-space-realty.vercel.app/api/health
```

### Database Connectivity Test
```bash
# Test from deployed API
curl https://gentle-space-realty.vercel.app/api/properties

# Verify real-time subscriptions work
# Check browser console for WebSocket connections
```

## 📊 Monitoring & Analytics

The production environment includes:

- **Performance Monitoring**: Enabled with metrics collection
- **Error Reporting**: Configured for production debugging
- **Rate Limiting**: Production-safe limits (100 requests/15min)
- **Security Headers**: CORS, CSRF, and cookie security
- **Compression**: Enabled for optimal performance
- **Caching**: Static assets (24h) and API responses (5min)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` password is correct
   - Check Supabase project status
   - Ensure database is not paused

2. **Authentication Errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check key hasn't expired
   - Validate project ID matches

3. **Email Notifications Not Working**
   - Verify SMTP credentials
   - Check email provider settings
   - Test with development SMTP first

### Debug Commands
```bash
# Check deployment logs
vercel logs

# View environment variables
vercel env ls

# Test specific endpoints
curl -v https://gentle-space-realty.vercel.app/api/debug
```

## 📁 Related Files

- **Environment File**: `/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/.env.production`
- **API Routes**: `/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/api/*.js`
- **Database Schema**: `/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/database/deploy-production.sql`
- **Deployment Config**: `/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/vercel.json`

---

**Next Steps**: Set the required environment variables in Vercel Dashboard and deploy the application.