# Google OAuth Setup Instructions

## Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

### Access Google Cloud Console
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials?project=aqueous-impact-269911)
2. Make sure project `aqueous-impact-269911` is selected

### Enable Required APIs
1. Go to [APIs & Services Library](https://console.cloud.google.com/apis/library?project=aqueous-impact-269911)
2. Search for and enable:
   - **Google+ API** (for profile access)
   - **OAuth2 API** (for authentication)

### Configure OAuth Consent Screen
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=aqueous-impact-269911)
2. **User Type**: External
3. **App Information**:
   - App name: `Gentle Space Realty Admin Portal`
   - User support email: `admin@gentlespacerealty.com`
   - Developer contact: `admin@gentlespacerealty.com`
4. **Scopes**: Add these scopes:
   - `email`
   - `profile` 
   - `openid`
5. **Test Users** (for development):
   - Add Gmail addresses that should have admin access

### Create OAuth Client ID
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials?project=aqueous-impact-269911)
2. Click **"Create Credentials"** → **"OAuth client ID"**
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

### Download Credentials
1. After creating, click the download button (⬇️) for your OAuth client
2. Save the JSON file as `google-oauth-credentials.json`
3. Extract `client_id` and `client_secret` from the file

## Step 2: Update Environment Variables

Update `.env.local` with your actual credentials:

```bash
# Replace with your actual Google OAuth credentials
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## Step 3: Configure Supabase Auth

1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/nfryqqpfprupwqayirnc/auth/providers)
2. Find **Google** in the providers list
3. Enable the Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From step 1
   - **Client Secret**: From step 1
5. Save the configuration

## Step 4: Test Gmail SSO

1. Navigate to `http://localhost:5173/admin`
2. Click **"Continue with Google"**
3. Complete OAuth flow
4. Verify admin access and user creation in database

## Troubleshooting

### Common Issues
1. **"Provider not enabled"**: Complete Step 3 (Supabase configuration)
2. **"Invalid client"**: Verify redirect URIs match exactly
3. **"Access blocked"**: Add test users to OAuth consent screen
4. **"Scope error"**: Verify scopes include `email`, `profile`, `openid`

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://nfryqqpfprupwqayirnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Security Notes

- Client ID can be public (goes in VITE_ variable)
- Client Secret must remain private (server-side only)
- Test users are required during development
- Production requires app verification for public access