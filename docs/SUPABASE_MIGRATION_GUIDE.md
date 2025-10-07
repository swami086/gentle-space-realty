# Supabase Migration Guide

This guide documents the complete migration from a custom backend to Supabase for the Gentle Space Realty application.

## Overview

The migration transforms the application from:
- Custom PostgreSQL database with JWT authentication
- Express.js API server
- Manual file upload handling

To:
- Supabase PostgreSQL with Row Level Security
- Direct client-side Supabase integration
- Supabase Auth and Storage

## Architecture Changes

### Before Migration
```
Frontend (React) → API Server (Express) → PostgreSQL
                └→ JWT Auth
                └→ File Storage
```

### After Migration
```
Frontend (React) → Supabase Client → Supabase PostgreSQL
                                  → Supabase Auth
                                  → Supabase Storage
```

## Migration Steps Completed

### 1. Dependencies Update
- ✅ Removed backend dependencies (express, bcryptjs, jsonwebtoken, pg)
- ✅ Added Supabase client (@supabase/supabase-js v2.57.4)
- ✅ Updated package.json scripts

### 2. Environment Configuration
- ✅ Replaced database environment variables with Supabase config
- ✅ Updated validation script for Supabase variables
- ✅ New variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 3. Database Schema Migration
- ✅ Created complete Supabase schema with UUID primary keys
- ✅ Implemented Row Level Security (RLS) policies
- ✅ Added database functions for complex queries
- ✅ Created indexes and triggers for performance

### 4. Authentication System
- ✅ Replaced JWT with Supabase Auth
- ✅ Implemented PKCE authentication flow
- ✅ Created custom auth hook (`useSupabaseAuth`)
- ✅ Updated admin access control

### 5. API Layer Transformation
- ✅ Replaced REST API endpoints with Supabase client calls
- ✅ Maintained same interface for backward compatibility
- ✅ Added error handling with Supabase-specific errors

### 6. File Upload System
- ✅ Implemented Supabase Storage for property images
- ✅ Added file validation and progress tracking
- ✅ Created upload service with public bucket access

### 7. State Management Updates
- ✅ Updated Zustand stores for Supabase integration
- ✅ Modified property store to use Supabase search functions
- ✅ Updated admin store for Supabase authentication

### 8. TypeScript Integration
- ✅ Generated complete TypeScript definitions from database schema
- ✅ Type-safe Supabase client configuration
- ✅ Updated all components for type compatibility

### 9. Deployment Configuration
- ✅ Updated Vercel configuration for frontend-only deployment
- ✅ Removed API routes (except health check)
- ✅ Added Content Security Policy for Supabase domains

## Key Features Implemented

### Row Level Security Policies
All database tables have RLS policies that ensure:
- Users can only access their own inquiries
- Only admins can manage properties and view all inquiries
- Public access to active properties for browsing

### Database Functions
Created RPC functions for:
- `get_inquiry_stats()` - Admin dashboard statistics
- `search_properties()` - Advanced property search with filters
- `assign_inquiry()` - Assign inquiries to admin users in users table
- `update_inquiry_status()` - Update inquiry status with validation

### Authentication Features
- Email/password authentication with Supabase Auth
- Admin role checking via user metadata
- Session persistence with auto-refresh
- Password reset functionality

### File Upload System
- Direct upload to Supabase Storage
- File validation (type, size limits)
- Progress tracking for uploads
- Automatic cleanup of unused files
- Bucket creation handled by setup script with service role key

## Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Variables
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Database Schema

### Tables Created
- `users` - User profiles with role management (extends auth.users)
- `properties` - Property listings with full details
- `property_images` - Property image management with metadata
- `inquiries` - Customer inquiries with status tracking
- `analytics_events` - User interaction tracking and analytics

### Views Created
- `active_properties` - Properties available for public viewing
- `recent_inquiries` - Latest inquiries for admin dashboard

## Security Considerations

### Row Level Security
All tables implement RLS with policies that:
- Restrict data access based on user authentication
- Separate admin and public access levels
- Prevent unauthorized data modifications

### API Security
- Supabase handles all authentication and authorization
- No sensitive data exposed in frontend code
- Proper error handling without information leakage

## Performance Optimizations

### Database Indexes
- Primary key indexes on all UUID fields
- Composite indexes for common query patterns
- Full-text search indexes for property search

### Client-Side Optimizations
- Connection pooling handled by Supabase
- Automatic query optimization
- Built-in caching for repeated queries

## Testing Recommendations

### Database Testing
1. Test all RLS policies with different user roles
2. Verify database functions return expected results
3. Test constraint validation and triggers

### Authentication Testing
1. Test login/logout flows
2. Verify admin access restrictions
3. Test password reset functionality

### File Upload Testing
1. Test file validation (size, type limits)
2. Verify upload progress tracking
3. Test file deletion and cleanup

## Deployment Steps

### 1. Supabase Setup
1. Create new Supabase project
2. **Apply CLI migrations** (NEW REQUIREMENT):
   ```bash
   # Push schema and functions to Supabase
   npm run db:push
   # OR for fresh start
   npm run db:reset
   ```
3. **Run admin setup script**:
   ```bash
   node scripts/supabase-setup.js
   ```
4. Configure authentication settings

### 2. Environment Configuration
1. Update environment variables in Vercel
2. **Ensure SUPABASE_SERVICE_ROLE_KEY is set** (required for admin setup)
3. Validate configuration with: `npm run env:validate`
4. Test Supabase connectivity

### 3. Frontend Deployment
1. Build application: `npm run build`
2. Deploy to Vercel
3. Verify all functionality works

## ⚠️ Important Migration Changes

### CLI-First Approach
The setup process now follows Supabase best practices:

1. **Database schema and functions** are applied via Supabase CLI:
   - `supabase db push` - applies schema and functions
   - `supabase db reset` - fresh start with migrations
   
2. **Node.js setup script** only handles admin tasks:
   - Admin user creation using service role
   - Storage bucket setup
   - Verification of applied migrations

3. **Benefits**:
   - Better version control of schema changes
   - Consistent with Supabase best practices
   - Safer production deployments
   - Clear separation of concerns

## Troubleshooting

### Common Issues

#### Authentication Errors
- Verify Supabase URL and keys are correct
- Check if user exists in auth.users table
- Ensure admin role is set in user metadata

#### Database Connection Issues
- Confirm Supabase project is active
- Verify RLS policies allow access for user role
- Check network connectivity to Supabase

#### File Upload Problems
- Ensure storage bucket policies allow uploads
- Verify file size and type restrictions
- Check browser console for detailed errors

### Debug Commands
```bash
# Validate environment
npm run env:validate

# Check health endpoint
curl https://your-app.vercel.app/api/health

# Test Supabase connection
npx supabase test
```

## Migration Rollback Plan

If rollback is needed:
1. Restore previous Vercel deployment
2. Revert environment variables
3. Restore original package.json
4. Re-enable API server if needed

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## Post-Migration Checklist

- [ ] All environment variables configured
- [ ] Database schema applied successfully
- [ ] RLS policies working correctly
- [ ] Authentication flow tested
- [ ] File uploads functioning
- [ ] Admin panel accessible
- [ ] Property search working
- [ ] Inquiry system operational
- [ ] Health checks passing
- [ ] Production deployment verified

---

**Migration Status**: ✅ Complete
**Documentation Version**: 1.0.0
**Last Updated**: Migration completion date