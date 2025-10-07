# Supabase Authentication Configuration Guide

## Overview

This guide provides comprehensive setup instructions for optimized Supabase Google OAuth authentication in the Gentle Space Realty application.

## Prerequisites

- Supabase project (existing project: `nfryqqpfprupwqayirnc`)
- Google Cloud Platform project with OAuth 2.0 credentials
- Environment configuration access

## 🔧 Environment Configuration

### Required Environment Variables

Copy these variables to your `.env.local` file:

```bash
# Supabase Configuration (Primary)
VITE_SUPABASE_URL=https://nfryqqpfprupwqayirnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.3JL0EOxxbC-HKV_vgVz6-bF8mJjSuHDKhzBv09Z0gZU

# Server-Side Authentication (Required for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxNDAxOCwiZXhwIjoyMDczMzkwMDE4fQ.XTxgPSa-J5uMLvs7uGOl4REH3ziEZNY1vHQjAple_fQ
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-settings

# Google OAuth Configuration (Required for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Development Settings
VITE_DEBUG_AUTH=false
VITE_DEBUG_STARTUP=false
VITE_ENABLE_ADMIN_CLIENT=false
```

## 🚀 Supabase Dashboard Setup

### 1. Google OAuth Provider Configuration

1. **Navigate to Supabase Dashboard**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `nfryqqpfprupwqayirnc`

2. **Configure Google Provider**
   - Go to **Authentication** > **Providers**
   - Find **Google** and click **Enable**
   - Enter your Google OAuth credentials:
     - **Client ID**: `your-google-client-id.apps.googleusercontent.com`
     - **Client Secret**: `your-google-client-secret`

3. **Set Redirect URLs**
   - Add these redirect URLs in Supabase:
     ```
     http://localhost:5173/auth/callback
     http://localhost:3000/auth/callback
     https://your-production-domain.com/auth/callback
     ```

### 2. Database Functions Setup

The application includes optimized database functions. Apply them using Supabase MCP:

```bash
# Using Supabase MCP to apply database functions
npx supabase db push
```

### 3. Row Level Security (RLS) Configuration

Ensure RLS policies are enabled on the `users` table:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy for admin operations (managed by service role)
CREATE POLICY "Service role full access" ON users
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## 🔑 Google Cloud Platform Setup

### 1. OAuth 2.0 Credentials

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project or create a new one

2. **Enable Google+ API**
   - Go to **APIs & Services** > **Library**
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `Gentle Space Realty Auth`

4. **Configure Redirect URIs**
   Add these authorized redirect URIs:
   ```
   https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

5. **Configure JavaScript Origins**
   Add these authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-domain.com
   ```

## 🔒 Security Configuration

### Admin Email Domain Restrictions

The system automatically grants admin privileges based on email domains. Configure in the database function:

```sql
-- In upsert_oauth_user function
CASE 
  WHEN p_user_email LIKE '%@gentlespacerealty.com' THEN 'admin'
  WHEN p_user_email LIKE '%@gentle-space.com' THEN 'admin'  
  ELSE 'user'
END
```

### JWT Secret Configuration

1. **Get JWT Secret from Supabase**
   - Go to **Settings** > **API**
   - Copy the **JWT Secret**
   - Add to environment variables as `SUPABASE_JWT_SECRET`

2. **Server-Side Token Verification**
   The Express middleware automatically verifies JWT tokens using this secret.

## 🧪 Testing Configuration

### 1. Test OAuth Flow

```bash
# Start development server
npm run dev

# Test login flow
1. Navigate to http://localhost:5173/admin
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirect to admin dashboard
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/api/auth

# Test OAuth verification (requires valid token)
curl -X POST http://localhost:3001/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","access_token":"your-supabase-token"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **"OAuth callback failed"**
   - Check Google OAuth redirect URIs match exactly
   - Verify Supabase provider configuration
   - Ensure environment variables are loaded correctly

2. **"Invalid access token"**
   - Check JWT secret configuration
   - Verify Supabase service role key
   - Ensure token hasn't expired

3. **"Admin privileges required"**
   - Verify email domain in database function
   - Check user role in database
   - Ensure admin middleware is working

### Debug Mode

Enable debug logging:

```bash
VITE_DEBUG_AUTH=true
VITE_DEBUG_STARTUP=true
```

This will provide detailed console logs for troubleshooting.

## 📊 Performance Optimizations

### Applied Optimizations

1. **Client Configuration**
   - PKCE flow for enhanced security
   - Optimized session persistence
   - Custom headers for identification

2. **Server Middleware**
   - Token verification caching
   - Role-based access control
   - Debug-aware logging

3. **Database Functions**
   - Optimized user upsert operations
   - Intelligent role determination
   - Performance-focused queries

## 🔄 Migration Notes

This configuration has been optimized from the previous Firebase setup:

- **Removed**: All Firebase dependencies and configuration
- **Enhanced**: Supabase OAuth with improved error handling
- **Added**: Comprehensive middleware and validation
- **Optimized**: Performance and security settings

## 📞 Support

For issues related to this authentication setup:

1. Check the troubleshooting section above
2. Verify all environment variables are configured
3. Test individual components (OAuth, API, database)
4. Review Supabase dashboard logs for detailed error information

## 🔗 External Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com/)