# Firebase Authentication Migration Guide

## Overview

This document outlines the completed migration from Supabase Auth to Firebase Auth while maintaining the existing Supabase database for user data storage. The migration implements a hybrid architecture where Firebase handles authentication and Supabase manages user profiles and application data.

## Migration Architecture

### Before Migration
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL
- **User Management**: Single Supabase system

### After Migration
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Supabase PostgreSQL (with Firebase UID support)
- **User Management**: Hybrid Firebase + Supabase system

## Key Changes Summary

### 1. Dependencies Added
```json
{
  "firebase": "^10.14.1",
  "firebase-admin": "^12.7.0"
}
```

### 2. Environment Variables Added
```bash
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Admin Configuration (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/your/firebase-service-account-key.json
```

### 3. Database Schema Changes
```sql
-- Added Firebase UID column to users table
ALTER TABLE public.users ADD COLUMN firebase_uid TEXT;
CREATE UNIQUE INDEX idx_users_firebase_uid ON public.users (firebase_uid);

-- Created upsert function for Firebase user management
CREATE OR REPLACE FUNCTION public.upsert_firebase_user(...)
```

## File Changes

### New Files Created
- `src/lib/firebaseClient.ts` - Firebase client configuration
- `src/lib/firebaseAdmin.ts` - Firebase Admin SDK setup
- `src/services/firebaseAuthService.ts` - Firebase authentication service
- `server/middleware/firebaseAuth.js` - Express middleware for Firebase auth
- `database/migrations/009_add_firebase_uid.sql` - Database schema changes
- `database/functions/upsert_firebase_user.sql` - User management function

### Modified Files
- `src/store/adminStore.ts` - Updated to use Firebase authentication
- `src/components/admin/AdminLogin.tsx` - Firebase Google sign-in only
- `src/pages/AuthCallback.tsx` - Firebase auth state verification
- `server/routes/auth.cjs` - Added Firebase auth endpoints
- `src/services/supabaseService.ts` - Added Firebase UID support methods

## Authentication Flow

### 1. User Sign-In Process
```
1. User clicks "Sign in with Google" → Firebase Auth
2. Firebase returns ID token → Client stores token
3. Client sends token to server → Token verification
4. Server verifies token with Firebase Admin SDK
5. Server calls upsert_firebase_user() → Creates/updates user in Supabase
6. Client receives user profile with role information
7. Admin access verified based on Supabase user role
```

### 2. Admin Access Control
- Firebase handles authentication (who you are)
- Supabase manages authorization (what you can do)
- Admin/super_admin roles stored in Supabase users table
- Server middleware verifies both Firebase token and Supabase role

### 3. Session Management
- Firebase manages authentication state
- Client-side auth listener updates application state
- Server-side middleware verifies tokens on API requests
- Automatic token refresh handled by Firebase SDK

## API Endpoints

### Firebase Authentication Endpoints

#### POST /auth/firebase
Handle Firebase authentication and user sync
```bash
# Verify Firebase token and sync user
curl -X POST /auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"action": "verify", "idToken": "firebase-id-token"}'

# Sync user data
curl -X POST /auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"action": "sync", "userData": {...}}'
```

#### GET /auth/profile
Get authenticated user profile
```bash
curl -X GET /auth/profile \
  -H "Authorization: Bearer firebase-id-token"
```

#### POST /auth/admin
Admin-only endpoint
```bash
curl -X POST /auth/admin \
  -H "Authorization: Bearer firebase-id-token"
```

### Legacy Supabase Endpoints
Legacy endpoints preserved at `/auth/legacy` for backward compatibility during migration period.

## Security Features

### 1. Token Verification
- All Firebase ID tokens verified server-side using Firebase Admin SDK
- Token expiration and revocation handled automatically
- Invalid tokens rejected with appropriate error messages

### 2. Role-Based Access Control
- Admin roles stored securely in Supabase database
- Server-side role verification for protected endpoints
- Client-side role checks for UI elements

### 3. Database Security
- Row Level Security (RLS) policies maintained
- Firebase UID used for user identification
- Secure upsert function prevents unauthorized user creation

## Migration Benefits

### 1. Enhanced Security
- Industry-standard OAuth 2.0 flow
- No password storage or management
- Automatic token refresh and validation
- Reduced attack surface

### 2. Better User Experience
- Single-click Google sign-in
- No password reset flows needed
- Faster authentication process
- Consistent authentication across devices

### 3. Improved Scalability
- Firebase handles authentication infrastructure
- Reduced server load for auth operations
- Built-in monitoring and analytics
- Global CDN for auth services

### 4. Maintainability
- Separation of concerns (auth vs. data)
- Standardized authentication patterns
- Better error handling and logging
- Easier integration with other Google services

## Database Functions

### upsert_firebase_user Function
Handles user creation and updates with Firebase UID mapping:

```sql
SELECT * FROM public.upsert_firebase_user(
  'firebase_uid_123',
  'user@example.com',
  'John Doe',
  'admin',
  'https://example.com/avatar.jpg'
);
```

Features:
- Creates new users with Firebase UID
- Updates existing users by Firebase UID
- Migrates existing Supabase users by email match
- Preserves admin/super_admin roles
- Returns complete user profile

## Error Handling

### Client-Side Errors
- Firebase authentication errors displayed to user
- Network errors with retry mechanisms
- Session expiration automatic handling
- Role-based access denial messages

### Server-Side Errors
- Detailed Firebase token validation errors
- Database connection error handling
- Function execution error logging
- Structured error responses with codes

## Development Setup

### 1. Firebase Project Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Google Authentication provider
3. Add authorized domains (localhost, production domain)
4. Generate service account key for admin SDK
5. Configure OAuth 2.0 consent screen

### 2. Environment Configuration
1. Copy environment variables from `.env.example`
2. Fill in Firebase configuration values
3. Set path to Firebase service account key file
4. Ensure all required variables are set

### 3. Database Migration
1. Run migration script to add firebase_uid column
2. Deploy upsert_firebase_user function
3. Test function with sample data
4. Verify RLS policies work with Firebase UIDs

## Testing

### Authentication Testing
- Google sign-in flow end-to-end
- Token verification and refresh
- Role-based access control
- Session persistence across browser refresh
- Sign-out flow and cleanup

### API Testing
- Firebase endpoint authentication
- Admin endpoint authorization
- Error handling for invalid tokens
- Legacy endpoint compatibility
- Database function testing

### Integration Testing
- Admin dashboard access flow
- User profile management
- Property and inquiry management with new auth
- Real-time updates with authenticated users

## Monitoring and Logging

### Firebase Analytics
- Authentication success/failure rates
- Sign-in method distribution
- User session duration
- Geographic authentication patterns

### Application Logging
- Firebase token verification events
- Database function execution logs
- Admin access attempts and results
- Error tracking with Sentry integration

### Performance Metrics
- Authentication flow completion time
- Database query performance with Firebase UIDs
- Server response times for auth endpoints
- Client-side authentication state changes

## Troubleshooting

### Common Issues

#### 1. Firebase Configuration Error
**Symptom**: "Firebase app not initialized" error
**Solution**: Verify all environment variables are set correctly and Firebase project is configured

#### 2. Admin Access Denied
**Symptom**: User can authenticate but cannot access admin features
**Solution**: Check user role in Supabase database, ensure it's set to 'admin' or 'super_admin'

#### 3. Token Verification Failed
**Symptom**: Server returns 401 errors for authenticated requests
**Solution**: Verify Firebase service account key path and permissions

#### 4. Database Function Error
**Symptom**: User creation/update fails with function errors
**Solution**: Check PostgreSQL logs, verify function deployment and permissions

### Debug Commands

```bash
# Check Firebase configuration
node -e "console.log(process.env.VITE_FIREBASE_PROJECT_ID)"

# Test Firebase Admin SDK
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/service-account-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
console.log('Admin SDK initialized successfully');
"

# Test database function
psql -c "SELECT * FROM upsert_firebase_user('test_uid', 'test@example.com', 'Test User', 'user', null);"
```

## Migration Checklist

- [x] Install Firebase dependencies
- [x] Create Firebase client configuration
- [x] Create Firebase Admin SDK setup
- [x] Implement Firebase Auth service
- [x] Update admin store to use Firebase
- [x] Modify admin login component
- [x] Update auth callback page
- [x] Create server-side Firebase middleware
- [x] Update API routes for Firebase auth
- [x] Add firebase_uid column to database
- [x] Create upsert_firebase_user function
- [x] Update SupabaseService for Firebase support
- [x] Test authentication flow end-to-end
- [x] Verify admin access control
- [x] Document migration process
- [ ] Create user migration script
- [ ] Write comprehensive tests
- [ ] Deploy to production environment

## Future Enhancements

### 1. Multi-Provider Authentication
- Add Microsoft, GitHub, and other OAuth providers
- Implement provider linking for existing users
- Enhanced provider management in admin panel

### 2. Advanced Security Features
- Multi-factor authentication (MFA)
- Session management and device tracking
- Suspicious activity detection and alerting
- Advanced audit logging

### 3. User Management Improvements
- Bulk user operations in admin panel
- User invitation system
- Self-service profile management
- Role hierarchy and permissions system

### 4. Integration Enhancements
- Firebase Cloud Functions for server-side logic
- Firebase Cloud Messaging for notifications
- Firebase Analytics for user behavior tracking
- Firebase Remote Config for feature flags

---

## Support and Maintenance

For questions or issues with the Firebase migration:
1. Check this documentation first
2. Review Firebase console for authentication logs
3. Check server logs for detailed error messages
4. Contact development team with specific error details

Last updated: September 2025
Migration completed by: Claude Code Assistant