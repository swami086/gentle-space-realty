# Architecture Guide - Direct Frontend-to-Supabase

## 🏗️ System Architecture Overview

Gentle Space Realty implements a **direct frontend-to-Supabase architecture** that eliminates traditional backend APIs in favor of direct database access through Supabase's secure client libraries.

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  React Components (TypeScript)                             │
│  ├── PropertyManagement.tsx                                │
│  ├── InquiryManagement.tsx                                │
│  ├── UserDashboard.tsx                                     │
│  └── AdminPanel.tsx                                        │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks                                              │
│  ├── useSupabaseAuth.ts (Authentication)                   │
│  ├── useSupabaseRealtime.ts (Real-time Updates)           │
│  └── useSupabaseQuery.ts (Data Fetching)                  │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                            │
│  ├── supabaseService.ts (Business Logic)                   │
│  ├── uploadService.ts (File Management)                    │
│  └── analyticsService.ts (Event Tracking)                  │
├─────────────────────────────────────────────────────────────┤
│  API Abstraction Layer                                     │
│  ├── api.ts (Unified API Interface)                        │
│  └── supabaseClient.ts (Configuration)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    SUPABASE CLIENT SDK
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE CLOUD                           │
├─────────────────────────────────────────────────────────────┤
│  Authentication Service                                     │
│  ├── User Management                                       │
│  ├── JWT Token Handling                                    │
│  └── Role-based Access Control                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                       │
│  ├── Row Level Security (RLS)                             │
│  ├── Real-time Subscriptions                              │
│  ├── Full-text Search                                      │
│  └── ACID Transactions                                      │
├─────────────────────────────────────────────────────────────┤
│  Storage Service                                           │
│  ├── Property Images                                       │
│  ├── Document Storage                                      │
│  └── CDN Integration                                        │
├─────────────────────────────────────────────────────────────┤
│  Real-time Engine                                          │
│  ├── WebSocket Connections                                 │
│  ├── Change Data Capture                                   │
│  └── Live Queries                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### 1. User Interaction Flow
```
User Action → React Component → Custom Hook → Service Layer → Supabase Client → Database
     ↑                                                                              ↓
Browser ← React State Update ← Real-time Hook ← Real-time Engine ← Database Changes
```

### 2. Authentication Flow
```
Login Request → useSupabaseAuth Hook → Supabase Auth → JWT Token → RLS Context
      ↓                    ↓                  ↓             ↓            ↓
 Component → Update State → Store Session → API Calls → Database Access
```

### 3. Real-time Updates Flow
```
Database Change → Supabase Real-time → WebSocket → useSupabaseRealtime → Component Update
```

## 🏛️ Layer Descriptions

### Frontend Layer

**React Components**
- Built with TypeScript for type safety
- Responsive design with Tailwind CSS
- Form handling with React Hook Form + Zod validation
- State management with Zustand
- Error boundaries for graceful error handling

**Custom Hooks**
- `useSupabaseAuth`: Authentication state management
- `useSupabaseRealtime`: Real-time subscription management  
- `useSupabaseQuery`: Optimized data fetching with caching
- `useSupabaseStorage`: File upload and management

### Services Layer

**supabaseService.ts**
```typescript
// Business logic abstraction
export class SupabaseService {
  // Property management
  async getProperties(filters?: PropertyFilters): Promise<Property[]>
  async createProperty(property: CreatePropertyRequest): Promise<Property>
  async updateProperty(id: string, updates: PropertyUpdate): Promise<Property>
  
  // Real-time subscriptions
  async subscribeToPropertyChanges(callback: (change: PropertyChange) => void)
  
  // Analytics
  async trackPropertyView(propertyId: string, metadata: ViewMetadata)
}
```

**uploadService.ts**
```typescript
// File upload with optimization
export class UploadService {
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult>
  async optimizeImage(file: File): Promise<File>
  async uploadMultipleFiles(files: File[]): Promise<UploadResult[]>
}
```

### API Abstraction Layer

**api.ts**
```typescript
// Unified API interface
export const api = {
  // Properties
  getProperties: (filters?: PropertyFilters) => ApiResponse<Property[]>,
  createProperty: (property: CreatePropertyRequest) => ApiResponse<Property>,
  
  // Inquiries  
  getInquiries: (filters?: InquiryFilters) => ApiResponse<Inquiry[]>,
  createInquiry: (inquiry: CreateInquiryRequest) => ApiResponse<Inquiry>,
  
  // Authentication
  signIn: (credentials: LoginCredentials) => ApiResponse<AuthSession>,
  signOut: () => ApiResponse<void>,
};
```

## 🔒 Security Architecture

### Row Level Security (RLS) Policies

```sql
-- Properties: Public read, authenticated create/update
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties" ON properties  
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin-only policies
CREATE POLICY "Admins can manage all properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Authentication & Authorization

```typescript
// Role-based access control
export const checkUserRole = async (requiredRole: UserRole): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return profile?.role === requiredRole;
};
```

## 📊 Database Architecture

### Core Tables Schema

```sql
-- Users table with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties with full-text search
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price JSONB NOT NULL, -- {amount: number, period: string}
  location TEXT NOT NULL,
  category property_category NOT NULL,
  size JSONB, -- {area: number, unit: string}
  availability JSONB DEFAULT '{"available": true}',
  images TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES users(id),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || description)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_properties_search ON properties USING GIN (search_vector);
CREATE INDEX idx_properties_location ON properties (location);
CREATE INDEX idx_properties_category ON properties (category);
```

### Real-time Configuration

```sql
-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
```

## ⚡ Performance Architecture

### Frontend Optimizations

**Code Splitting**
```typescript
// Route-based code splitting
const PropertyManagement = lazy(() => import('./components/PropertyManagement'));
const InquiryManagement = lazy(() => import('./components/InquiryManagement'));

// Component lazy loading
const AdminPanel = lazy(() => import('./components/AdminPanel'));
```

**Caching Strategy**
```typescript
// React Query integration for Supabase
export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => api.getProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Database Optimizations

**Connection Pooling**
- Supabase handles connection pooling automatically
- Optimized for concurrent connections
- Built-in connection management

**Query Optimization**
```typescript
// Efficient queries with selected fields
const { data } = await supabase
  .from('properties')
  .select('id, title, price, images')
  .range(0, 19); // Pagination

// Compound queries
const { data } = await supabase
  .from('properties')  
  .select(`
    *,
    property_images(*),
    inquiries(count)
  `)
  .eq('category', 'office-space');
```

## 🔄 Real-time Architecture

### WebSocket Connections

```typescript
// Real-time property updates
export const usePropertySubscription = (propertyId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`property:${propertyId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'properties', filter: `id=eq.${propertyId}` },
        (payload) => {
          // Handle real-time updates
          updatePropertyState(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [propertyId]);
};
```

### Connection Health Monitoring

```typescript
// Monitor connection health
export const useConnectionHealth = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('properties').select('count', { count: 'exact', head: true });
        setIsConnected(!error);
      } catch {
        setIsConnected(false);
      }
    };
    
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);
  
  return isConnected;
};
```

## 🚀 Deployment Architecture

### Vercel Integration

```json
// vercel.json - Simplified configuration
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/api/(.*)",
      "destination": "/404", 
      "statusCode": 301
    }
  ]
}
```

### Environment Configuration

```bash
# Production environment
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key # Server-side only
NODE_ENV=production
```

## 📈 Scalability Considerations

### Horizontal Scaling
- Supabase handles database scaling automatically
- Vercel provides global CDN and edge computing
- Client-side caching reduces database load

### Performance Monitoring
```typescript
// Performance tracking
export const trackPerformance = (operation: string, duration: number) => {
  supabase.from('analytics_events').insert({
    event_type: 'performance',
    event_data: { operation, duration, timestamp: new Date().toISOString() }
  });
};
```

## 🔍 Monitoring & Observability

### Error Tracking
```typescript
// Global error boundary
export const ErrorBoundary: React.FC = ({ children }) => {
  const logError = (error: Error) => {
    supabase.from('analytics_events').insert({
      event_type: 'error',
      event_data: { 
        message: error.message,
        stack: error.stack,
        url: window.location.href
      }
    });
  };
  
  // Implementation...
};
```

### Analytics Integration
```typescript
// User behavior tracking
export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  supabase.from('analytics_events').insert({
    event_type: 'user_action',
    event_data: { action, metadata, timestamp: new Date().toISOString() }
  });
};
```

---

This architecture provides a robust, scalable, and maintainable foundation for the Gentle Space Realty platform while leveraging the full power of Supabase's managed services.