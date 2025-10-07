# 🔒 Secure Environment Setup Guide

## Critical Security Requirements

### ⚠️ IMMEDIATE ACTION REQUIRED

1. **Create Local Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Real Values** (Replace ALL placeholder values)
   - Get Supabase URL/keys from [Supabase Dashboard](https://app.supabase.com)
   - Configure Google OAuth in [Google Cloud Console](https://console.cloud.google.com)
   - Set up Sentry monitoring (optional)

3. **Never Commit Secrets**
   - `.env.local` is in `.gitignore` - NEVER remove this
   - Use different keys for dev/staging/production
   - Rotate keys regularly (monthly recommended)

## Environment File Structure

### Client-Safe Variables (VITE_ prefix)
These are bundled into the client and visible to users:
- `VITE_SUPABASE_URL` - Public Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key (RLS-protected)
- `VITE_GOOGLE_CLIENT_ID` - Public OAuth client ID
- `VITE_GOOGLE_MAPS_API_KEY` - Maps API key (domain-restricted)

### Server-Only Variables (NO VITE_ prefix)
These must NEVER be exposed to the client:
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, server-only
- `GOOGLE_CLIENT_SECRET` - OAuth secret for server verification
- `SUPABASE_JWT_SECRET` - For custom token verification

## Security Warnings

### 🚨 High-Risk Items
1. **Service Role Key** - Bypasses all Row Level Security
2. **Google Client Secret** - Can generate unauthorized access tokens
3. **JWT Secret** - Can create forged authentication tokens

### 🔒 Protection Measures
1. **Key Rotation**: Change secrets monthly
2. **Environment Isolation**: Different keys per environment
3. **Access Logging**: Monitor service role key usage
4. **Domain Restrictions**: Limit API key domains

## Quick Security Checklist

- [ ] `.env.local` exists and configured
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in version control
- [ ] Different keys for dev/prod
- [ ] API keys domain-restricted
- [ ] Monitoring alerts configured
- [ ] Key rotation schedule established

## Emergency Response

If secrets are exposed:
1. **Immediately rotate** all affected keys
2. **Revoke** old keys in respective consoles
3. **Monitor** for unauthorized usage
4. **Update** all environments with new keys
5. **Review** access logs for suspicious activity

## Support

- Supabase: https://app.supabase.com/project/settings
- Google Cloud: https://console.cloud.google.com/apis/credentials
- Sentry: https://sentry.io/settings/