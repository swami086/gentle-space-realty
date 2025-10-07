# Enable Google Provider in Supabase Auth

## Current Status
✅ **Gmail SSO Implementation**: Complete
✅ **OAuth Service**: GoogleAuthService created and working  
✅ **UI Components**: AdminLogin updated with Google SSO button
✅ **Routes**: AuthCallback component and route configured
⚠️ **Google Provider**: **NOT ENABLED** in Supabase Auth settings

## Error Message
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

## Required Action: Enable Google Provider

### Step 1: Access Supabase Auth Settings
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nfryqqpfprupwqayirnc/auth/providers)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the provider list

### Step 2: Enable Google Provider
1. Click the **Google** provider toggle to enable it
2. **Client ID**: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com` (replace with real)
3. **Client Secret**: `GOCSPX-placeholder_secret_replace_with_real` (replace with real)

### Step 3: Configure Redirect URLs
Ensure these redirect URLs are configured in both:
- **Google Cloud Console OAuth settings**
- **Supabase Auth provider settings**

```
http://localhost:5173/auth/callback
https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback
```

## Testing Process

After enabling the Google provider in Supabase:

### 1. Test OAuth Flow
```bash
# Navigate to admin page
http://localhost:5173/admin

# Click "Continue with Google"
# Should redirect to Google OAuth (not show validation error)
```

### 2. Verify Database Integration
After successful OAuth:
- User should be created in `users` table
- Role should be assigned based on email domain (@gentlespacerealty.com = admin)
- Admin dashboard should be accessible

### 3. Expected Flow
1. Click "Continue with Google" → Redirect to Google OAuth
2. Complete Google authentication → Redirect to AuthCallback
3. AuthCallback processes user → Creates/updates user in database
4. User redirected to admin dashboard with proper role

## Current Implementation Status

### ✅ Completed Components
- `GoogleAuthService` with OAuth handling
- `AuthCallback` component for processing OAuth returns  
- `AdminLogin` with Google SSO button
- Database user creation and role assignment logic
- React Router configuration for auth flow

### ⚠️ Pending Configuration
- Google OAuth credentials in Google Cloud Console
- Google provider enabled in Supabase Auth settings

## Next Steps

1. **Create real Google OAuth credentials** (see `oauth-setup-instructions.md`)
2. **Enable Google provider in Supabase** (this document, steps above)  
3. **Update environment variables** with real credentials
4. **Test complete Gmail SSO flow** with Playwright MCP
5. **Verify user creation and role assignment** in database