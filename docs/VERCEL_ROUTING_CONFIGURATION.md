# Vercel Routing Configuration

## Fixed vercel.json Configuration

The vercel.json has been updated to properly route API endpoints to the simplified serverless functions with correct precedence order.

## API Route Configuration

### Route Precedence (Specific → General)

1. **Health Check**
   - Route: `/api/health`
   - Function: `health.js`
   - Public endpoint for monitoring

2. **Authentication**
   - Route: `/api/auth/login` → `login.js`
   - Route: `/api/auth/*` → `auth-simple.js`
   - Handles login and other auth operations

3. **Properties API**
   - Route: `/api/properties/:id` → `properties-simple.js?id=:id`
   - Route: `/api/properties` → `properties-simple.js`
   - Supports GET (list/single), POST, PUT, DELETE operations

4. **Inquiries API**
   - Route: `/api/inquiries/stats` → `inquiries-simple.js?action=stats`
   - Route: `/api/inquiries/validate` → `inquiries-simple.js?action=validate`
   - Route: `/api/inquiries/:id/assign` → `inquiries-simple.js?id=:id&action=assign`
   - Route: `/api/inquiries/:id` → `inquiries-simple.js?id=:id`
   - Route: `/api/inquiries` → `inquiries-simple.js`

5. **File Uploads**
   - Route: `/api/uploads/*` → `uploads.js`
   - Handles file upload operations

6. **SPA Routing**
   - Route: `/properties` → `index.html`
   - Route: `/properties/*` → `index.html`
   - Route: `/*` → `index.html` (catch-all for SPA)

## API Functions Overview

### properties-simple.js
- **GET** `/api/properties` - List properties with filtering/pagination
- **GET** `/api/properties/:id` - Get specific property
- **POST** `/api/properties` - Create property (auth required)
- **PUT** `/api/properties/:id` - Update property (auth required)
- **DELETE** `/api/properties/:id` - Delete property (auth required)

### inquiries-simple.js
- **GET** `/api/inquiries` - List inquiries (admin only)
- **GET** `/api/inquiries/:id` - Get specific inquiry (admin only)
- **GET** `/api/inquiries/stats` - Get inquiry statistics (admin only)
- **POST** `/api/inquiries` - Submit new inquiry (public)
- **POST** `/api/inquiries/validate` - Validate inquiry data (public)
- **POST** `/api/inquiries/:id/assign` - Assign inquiry (admin only)
- **PUT** `/api/inquiries/:id` - Update inquiry (admin only)
- **DELETE** `/api/inquiries/:id` - Delete inquiry (admin only)

## Key Improvements

1. **Proper Route Precedence**: Specific routes (with parameters) come before general patterns
2. **Parameter Passing**: Uses Vercel's `:id` parameter syntax with proper query string mapping
3. **Action Routing**: Special endpoints like `/stats`, `/validate`, `/assign` are properly routed
4. **SPA Support**: React routes like `/properties` properly serve index.html
5. **Simplified Functions**: Routes point to working serverless functions without complex dependencies

## Testing Endpoints

### Public Endpoints (No Auth Required)
```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Get properties list
curl https://your-domain.vercel.app/api/properties

# Get specific property
curl https://your-domain.vercel.app/api/properties/1

# Submit inquiry
curl -X POST https://your-domain.vercel.app/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","message":"Interested in property"}'

# Validate inquiry
curl -X POST https://your-domain.vercel.app/api/inquiries/validate \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","message":"Short msg"}'
```

### Admin Endpoints (Auth Required)
```bash
# Get inquiries list (requires Bearer token)
curl https://your-domain.vercel.app/api/inquiries \
  -H "Authorization: Bearer your-token"

# Create property (requires Bearer token)
curl -X POST https://your-domain.vercel.app/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"title":"New Property","description":"Description","price":300000,"location":"City","category":"apartment"}'
```

## CORS Configuration

All API functions include proper CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

## Security Headers

The configuration includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-cache` for API endpoints

## Next Steps

1. Deploy to Vercel using `vercel --prod`
2. Test all API endpoints with the provided curl commands
3. Verify SPA routing works for `/properties` page
4. Monitor function logs for any issues
5. Update frontend API calls if needed to match new endpoints