# Gmail SSO Setup Guide for Gentle Space Realty Admin

## 1. Google Cloud Console OAuth Setup

### Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials?project=aqueous-impact-269911)
2. Click "Create Credentials" → "OAuth client ID"
3. **Application Type**: Web application
4. **Name**: `Gentle Space Realty Admin SSO`

### Configure Authorized Origins & Redirect URIs
**Authorized JavaScript origins:**
```
http://localhost:5173
https://nfryqqpfprupwqayirnc.supabase.co
```

**Authorized redirect URIs:**
```
http://localhost:5173/auth/callback
https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback
```

### OAuth Consent Screen Configuration
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=aqueous-impact-269911)
2. **User Type**: External
3. **App Information**:
   - App name: `Gentle Space Realty Admin Portal`
   - User support email: `admin@gentlespacerealty.com`
   - Developer contact: `admin@gentlespacerealty.com`
4. **Scopes**: Add these scopes
   - `email`
   - `profile` 
   - `openid`
5. **Test Users** (for development):
   - Add your Gmail addresses for testing

## 2. Environment Configuration

After creating OAuth credentials, update `.env.local`:
```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## 3. Supabase Auth Configuration

The system will automatically configure Supabase Auth with Google provider using the credentials.

## 4. Admin User Management

Gmail SSO users will be automatically assigned admin roles if their email domains match:
- `@gentlespacerealty.com`
- Or manually added to the admin users table

## 5. Testing

Use Playwright automated testing to verify:
1. Gmail SSO login flow
2. Admin role assignment
3. Dashboard access after authentication