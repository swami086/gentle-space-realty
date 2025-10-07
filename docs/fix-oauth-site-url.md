# Fix OAuth Site URL Configuration

## 🔍 **Issue Identified**

The OAuth callback is failing because Supabase Auth is configured with the wrong site URL.

### Current Problem:
- **Supabase Site URL**: `http://localhost:3000` (incorrect)
- **Actual App URL**: `http://localhost:5173` (correct)

This causes OAuth callbacks to fail because Supabase tries to redirect to the wrong port.

## 🛠️ **Required Fix**

### Step 1: Update Site URL in Supabase Auth Settings

1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/nfryqqpfprupwqayirnc/auth/settings)
2. Find **"Site URL"** setting
3. Change from: `http://localhost:3000`
4. Change to: `http://localhost:5173`
5. **Save** the configuration

### Step 2: Update Additional URLs (if configured)

Also check and update these settings in Supabase Auth:

**Additional Redirect URLs:**
```
http://localhost:5173/auth/callback
https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback
```

## 🧪 **Evidence of Issue**

From the OAuth state parameter in the browser URL:
```json
{
  "site_url": "http://localhost:3000",  // ❌ Wrong port
  "referrer": "http://localhost:5173/auth/callback"  // ✅ Correct port
}
```

This mismatch prevents the OAuth callback from completing successfully.

## 🎯 **Expected Result After Fix**

After updating the site URL configuration:

1. **OAuth Initiation**: ✅ "Continue with Google" (already working)
2. **Google OAuth**: ✅ User signs in with Gmail (already working)  
3. **Supabase Callback**: ✅ Should process callback correctly (will be fixed)
4. **Session Creation**: ✅ User session should be established
5. **Redirect to Admin**: ✅ User should be redirected to admin dashboard

## 📋 **Configuration Summary**

### Correct Supabase Auth Settings:
- **Site URL**: `http://localhost:5173`
- **Additional Redirect URLs**: 
  - `http://localhost:5173/auth/callback`
  - `https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback`
- **Google OAuth Provider**: ✅ Already enabled and configured

### Google Cloud Console (already correct):
- **Authorized JavaScript origins**: 
  - `http://localhost:5173`
  - `https://nfryqqpfprupwqayirnc.supabase.co`
- **Authorized redirect URIs**:
  - `http://localhost:5173/auth/callback` 
  - `https://nfryqqpfprupwqayirnc.supabase.co/auth/v1/callback`

Once the Site URL is updated in Supabase Auth settings, the OAuth callback should work correctly.