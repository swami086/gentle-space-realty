# Security Analysis: Admin Client Browser Usage

## Critical Security Issue

**Issue**: The application currently uses `supabaseAdmin` client directly in browser-side code, which exposes sensitive service role keys and bypasses Row Level Security (RLS).

**Files Affected**:
- `src/services/supabaseService.ts` - Uses `supabaseAdmin` for all operations
- `src/services/uploadService.ts` - Uses `supabaseAdmin` for file operations
- `src/lib/supabaseAdminClient.ts` - Exports admin client for browser use

## Security Risks

1. **Service Role Key Exposure**: Admin service role key is included in browser bundles
2. **RLS Bypass**: Admin client bypasses all Row Level Security policies
3. **Privilege Escalation**: All client operations run with full database privileges
4. **Attack Surface**: Malicious users can access admin functionality

## Recommended Solutions

### Option 1: Server-Side API Routes (Recommended)
Move admin operations to server-side API endpoints:

```typescript
// pages/api/admin/properties.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const { data: { user } } = await supabase.auth.getUser(req.headers.authorization);
  if (!isAdmin(user)) return res.status(403).json({ error: 'Unauthorized' });
  
  // Use admin client on server
  const result = await supabaseAdmin.from('properties').select('*');
  res.json(result);
}
```

### Option 2: Proper RLS Implementation
Implement comprehensive RLS policies and use regular client:

```sql
-- Enable RLS for all admin tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- Create admin role policies
CREATE POLICY admin_all_access ON properties 
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY admin_media_access ON property_media
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));
```

### Option 3: Environment-Based Configuration
Restrict admin client to development only:

```typescript
const useAdminClient = process.env.NODE_ENV === 'development' && 
                       process.env.NEXT_PUBLIC_ENABLE_ADMIN_CLIENT === 'true';

const client = useAdminClient ? supabaseAdmin : supabase;
```

## Immediate Mitigation Steps

1. **Remove Admin Client from Production Builds**
2. **Implement Authentication Checks**  
3. **Add Environment Restrictions**
4. **Create Server-Side Admin API**
5. **Implement Proper RLS Policies**

## Implementation Priority

1. ✅ **High Priority**: Remove admin client from browser bundle
2. ✅ **High Priority**: Add server-side admin API endpoints  
3. ✅ **Medium Priority**: Implement comprehensive RLS policies
4. ✅ **Medium Priority**: Add authentication middleware
5. ✅ **Low Priority**: Add audit logging for admin operations

## Long-term Security Architecture

```
Browser Client -> Authentication -> Server API -> Admin Client -> Database
                      ↓
                 RLS Policies (Defense in Depth)
```

This ensures:
- Admin credentials never leave the server
- Proper authentication and authorization
- RLS provides additional security layer
- Audit trail for all admin operations