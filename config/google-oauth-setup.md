# Google OAuth Setup for Gmail SSO

## Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=aqueous-impact-269911)
2. Select project: `aqueous-impact-269911`
3. Click "Create Credentials" > "OAuth client ID"
4. Application type: "Web application"
5. Name: "Gentle Space Realty Admin"
6. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://nfryqqpfprupwqayirnc.supabase.co`
7. Authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback`

## Step 2: OAuth Consent Screen Configuration

1. Go to OAuth consent screen
2. User Type: External
3. App name: "Gentle Space Realty Admin"
4. User support email: admin@gentlespacerealty.com
5. Scopes: 
   - email
   - profile
   - openid

## Step 3: Required Environment Variables

After creating OAuth credentials, you'll get:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

Add these to Supabase Auth settings.