# Database Schema - Supabase PostgreSQL

## 🗄️ Schema Overview

The Gentle Space Realty database uses PostgreSQL with Row Level Security (RLS) policies for secure, direct frontend access. The schema is optimized for real estate management with real-time capabilities.

## 📊 Database Architecture

```sql
-- Database: Gentle_Space_Sep (Supabase Project)
-- Engine: PostgreSQL 15+
-- Features: RLS, Real-time, Full-text Search, JSONB, UUID
```

## 🔧 Extensions & Types

### Required Extensions

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram matching for search
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- GIN indexes for JSONB
```

### Custom Types

```sql
-- User role enumeration
CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');

-- Property categories
CREATE TYPE property_category AS ENUM (
    'office-space',
    'retail-space', 
    'warehouse',
    'industrial',
    'mixed-use',
    'land'
);

-- Inquiry status tracking
CREATE TYPE inquiry_status AS ENUM (
    'new',
    'contacted', 
    'qualified',
    'viewing_scheduled',
    'offer_made',
    'closed_won',
    'closed_lost'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
```

## 📋 Core Tables

### 1. Users Table

**Purpose**: User authentication and profile management with role-based access

```sql
CREATE TABLE users (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    
    -- User information
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    
    -- Profile data
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    
    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);
```

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (is_active) WHERE is_active = true;
```

### 2. Properties Table

**Purpose**: Real estate property listings with search and categorization

```sql
CREATE TABLE properties (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    address TEXT,
    category property_category NOT NULL,
    
    -- Pricing information (flexible JSONB structure)
    price JSONB NOT NULL DEFAULT '{"amount": 0, "period": "month", "currency": "USD"}',
    
    -- Property specifications
    size JSONB DEFAULT '{}', -- {area: number, unit: "sqft"|"sqm", floors?: number}
    features TEXT[] DEFAULT '{}', -- ["parking", "furnished", "ac", etc.]
    amenities JSONB DEFAULT '{}', -- {gym: true, pool: false, etc.}
    
    -- Availability and status
    availability JSONB DEFAULT '{"available": true, "available_date": null}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'rented')),
    
    -- Media and documents
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    virtual_tour_url TEXT,
    
    -- SEO and search
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', location), 'C')
    ) STORED,
    
    -- Ownership and management
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_price CHECK (jsonb_typeof(price->'amount') = 'number' AND (price->>'amount')::numeric >= 0),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'sold', 'rented')),
    CONSTRAINT featured_until_check CHECK (featured = false OR featured_until IS NOT NULL)
);
```

**Indexes**:
```sql
-- Search and performance indexes
CREATE INDEX idx_properties_search ON properties USING GIN (search_vector);
CREATE INDEX idx_properties_location ON properties (location);
CREATE INDEX idx_properties_category ON properties (category);
CREATE INDEX idx_properties_price ON properties USING GIN ((price->'amount'));
CREATE INDEX idx_properties_status ON properties (status) WHERE status = 'active';
CREATE INDEX idx_properties_featured ON properties (featured, featured_until) WHERE featured = true;
CREATE INDEX idx_properties_user_id ON properties (user_id);
CREATE INDEX idx_properties_created_at ON properties (created_at DESC);

-- Compound indexes for common queries
CREATE INDEX idx_properties_category_status ON properties (category, status);
CREATE INDEX idx_properties_location_category ON properties (location, category);
```

**Triggers**:
```sql
-- Auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_property_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := TRIM(NEW.slug, '-');
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM properties WHERE slug = NEW.slug AND id != NEW.id) LOOP
            NEW.slug := NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
        END LOOP;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_slug_trigger
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION generate_property_slug();
```

### 3. Property Images Table

**Purpose**: Manage property images with metadata and organization

```sql
CREATE TABLE property_images (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Image information
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    
    -- Image metadata
    alt_text TEXT,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    
    -- Technical metadata
    file_size INTEGER, -- bytes
    width INTEGER,
    height INTEGER,
    format TEXT, -- 'jpeg', 'png', 'webp', etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_display_order CHECK (display_order >= 0),
    CONSTRAINT valid_dimensions CHECK (width > 0 AND height > 0),
    CONSTRAINT valid_file_size CHECK (file_size > 0)
);
```

**Indexes**:
```sql
CREATE INDEX idx_property_images_property_id ON property_images (property_id);
CREATE INDEX idx_property_images_order ON property_images (property_id, display_order);
CREATE INDEX idx_property_images_primary ON property_images (property_id, is_primary) WHERE is_primary = true;
```

**Constraints**:
```sql
-- Ensure only one primary image per property
CREATE UNIQUE INDEX idx_property_images_one_primary 
ON property_images (property_id) 
WHERE is_primary = true;
```

### 4. Inquiries Table

**Purpose**: Customer inquiries and lead management

```sql
CREATE TABLE inquiries (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Customer information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    
    -- Inquiry details
    message TEXT NOT NULL,
    requirement TEXT,
    budget_range JSONB, -- {min: number, max: number, currency: string}
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    
    -- Property and assignment
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id),
    
    -- Status and priority
    status inquiry_status DEFAULT 'new' NOT NULL,
    priority priority_level DEFAULT 'medium' NOT NULL,
    
    -- Follow-up tracking
    follow_up_date TIMESTAMPTZ,
    last_contact_date TIMESTAMPTZ,
    notes TEXT,
    internal_notes JSONB DEFAULT '[]', -- Array of note objects
    
    -- Source tracking
    source TEXT DEFAULT 'website', -- 'website', 'referral', 'social', etc.
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);
```

**Indexes**:
```sql
CREATE INDEX idx_inquiries_property_id ON inquiries (property_id);
CREATE INDEX idx_inquiries_assigned_to ON inquiries (assigned_to);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE INDEX idx_inquiries_priority ON inquiries (priority);
CREATE INDEX idx_inquiries_email ON inquiries (email);
CREATE INDEX idx_inquiries_follow_up ON inquiries (follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);

-- Compound indexes
CREATE INDEX idx_inquiries_status_priority ON inquiries (status, priority);
CREATE INDEX idx_inquiries_assigned_status ON inquiries (assigned_to, status);
```

### 5. Analytics Events Table

**Purpose**: Track user behavior and system events

```sql
CREATE TABLE analytics_events (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type TEXT NOT NULL,
    event_name TEXT,
    
    -- Event data (flexible JSONB structure)
    event_data JSONB DEFAULT '{}',
    
    -- User and session tracking
    user_id UUID REFERENCES users(id),
    session_id TEXT,
    anonymous_id TEXT,
    
    -- Request metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT,
    
    -- Geographic data
    country TEXT,
    region TEXT,
    city TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance tracking
    duration INTEGER, -- milliseconds
    
    -- Device information
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration IS NULL OR duration >= 0),
    CONSTRAINT valid_device_type CHECK (device_type IN ('desktop', 'mobile', 'tablet') OR device_type IS NULL)
);
```

**Indexes**:
```sql
CREATE INDEX idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events (user_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events (timestamp DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events (session_id);

-- Compound indexes for common analytics queries
CREATE INDEX idx_analytics_events_type_timestamp ON analytics_events (event_type, timestamp DESC);
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events (user_id, timestamp DESC);

-- GIN index for flexible event_data queries
CREATE INDEX idx_analytics_events_data ON analytics_events USING GIN (event_data);
```

## 🔒 Row Level Security (RLS) Policies

### Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

### Users Table Policies

```sql
-- Users can view their own profile and public admin/agent profiles
CREATE POLICY "Users can view own profile and public profiles" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        role IN ('admin', 'agent') AND is_active = true
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only authenticated users can insert (for profile creation)
CREATE POLICY "Authenticated users can create profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );
```

### Properties Table Policies

```sql
-- Properties are publicly viewable when active
CREATE POLICY "Properties are publicly viewable" ON properties
    FOR SELECT USING (status = 'active');

-- Property owners can view their own properties regardless of status
CREATE POLICY "Owners can view own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create properties
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() = user_id
    );

-- Property owners can update their own properties
CREATE POLICY "Owners can update own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Property owners can delete their own properties
CREATE POLICY "Owners can delete own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all properties
CREATE POLICY "Admins can manage all properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );
```

### Property Images Policies

```sql
-- Images are viewable if the property is viewable
CREATE POLICY "Images viewable with property" ON property_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE id = property_id 
            AND (status = 'active' OR user_id = auth.uid())
        )
    );

-- Property owners can manage images for their properties
CREATE POLICY "Property owners can manage images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE id = property_id 
            AND user_id = auth.uid()
        )
    );

-- Admins can manage all images
CREATE POLICY "Admins can manage all images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );
```

### Inquiries Table Policies

```sql
-- Users can view inquiries they created
CREATE POLICY "Users can view own inquiries" ON inquiries
    FOR SELECT USING (
        -- Check if user matches by user_id or email
        auth.uid() = (
            SELECT id FROM users WHERE email = inquiries.email LIMIT 1
        )
    );

-- Anyone can create inquiries (for public contact forms)
CREATE POLICY "Anyone can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (true);

-- Assigned agents can view and update their assigned inquiries
CREATE POLICY "Agents can manage assigned inquiries" ON inquiries
    FOR ALL USING (
        assigned_to = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('agent', 'admin')
            AND is_active = true
        )
    );

-- Property owners can view inquiries for their properties
CREATE POLICY "Property owners can view property inquiries" ON inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE id = property_id 
            AND user_id = auth.uid()
        )
    );

-- Admins can manage all inquiries
CREATE POLICY "Admins can manage all inquiries" ON inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );
```

### Analytics Events Policies

```sql
-- Analytics events are readable by admins only
CREATE POLICY "Admins can read analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Anyone can insert analytics events (for tracking)
CREATE POLICY "Anyone can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Users can view their own analytics events
CREATE POLICY "Users can view own analytics" ON analytics_events
    FOR SELECT USING (user_id = auth.uid());
```

## 🔄 Real-time Configuration

### Enable Real-time

```sql
-- Enable real-time replication for tables
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE property_images;
```

### Real-time Filters

The frontend can subscribe to specific changes:

```typescript
// Property changes for a specific category
supabase
  .channel('properties-office')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'properties',
      filter: 'category=eq.office-space' 
    },
    handlePropertyChange
  )
  .subscribe();

// New inquiries assigned to current user
supabase
  .channel('my-inquiries')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public', 
      table: 'inquiries',
      filter: `assigned_to=eq.${userId}`
    },
    handleNewInquiry
  )
  .subscribe();
```

## 📊 Storage Configuration

### Property Images Bucket

```sql
-- Create storage bucket policy
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated Upload" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own uploads" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'property-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own uploads" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'property-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 🔍 Advanced Features

### Full-Text Search

```sql
-- Search properties by title, description, and location
SELECT p.*, ts_rank(search_vector, query) AS rank
FROM properties p, 
     plainto_tsquery('english', 'office space downtown') query
WHERE search_vector @@ query
  AND status = 'active'
ORDER BY rank DESC;
```

### Geospatial Support (Optional)

```sql
-- Add PostGIS extension for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geospatial columns to properties
ALTER TABLE properties ADD COLUMN geolocation GEOMETRY(POINT, 4326);
ALTER TABLE properties ADD COLUMN geofence GEOMETRY(POLYGON, 4326);

-- Spatial index
CREATE INDEX idx_properties_geolocation ON properties USING GIST (geolocation);
```

### Audit Trail

```sql
-- Create audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER properties_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER inquiries_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 📈 Performance Optimization

### Database Maintenance

```sql
-- Regular maintenance tasks (run periodically)

-- Update table statistics
ANALYZE properties;
ANALYZE inquiries;
ANALYZE analytics_events;

-- Reindex if needed
REINDEX INDEX CONCURRENTLY idx_properties_search;

-- Clean up old analytics events (older than 6 months)
DELETE FROM analytics_events 
WHERE timestamp < NOW() - INTERVAL '6 months';

-- Update property view counts (denormalized for performance)
UPDATE properties 
SET view_count = (
    SELECT COUNT(*) 
    FROM analytics_events 
    WHERE event_type = 'property_view' 
    AND event_data->>'property_id' = properties.id::text
);
```

### Query Optimization Examples

```sql
-- Efficient property search with filters
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.id, p.title, p.price, p.location
FROM properties p
WHERE p.status = 'active'
  AND p.category = 'office-space'
  AND (p.price->>'amount')::numeric BETWEEN 1000 AND 10000
  AND p.search_vector @@ plainto_tsquery('english', 'downtown parking')
ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', 'downtown parking')) DESC
LIMIT 20;

-- Efficient inquiry dashboard query
SELECT i.*, p.title as property_title, u.name as assigned_agent_name
FROM inquiries i
LEFT JOIN properties p ON i.property_id = p.id
LEFT JOIN users u ON i.assigned_to = u.id
WHERE i.status IN ('new', 'contacted', 'qualified')
ORDER BY 
    CASE i.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3
        ELSE 4 
    END,
    i.created_at DESC;
```

## 🔧 Migration Scripts

### Initial Setup Script

```sql
-- Complete database setup script
-- Run this in Supabase SQL Editor

-- 1. Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 2. Create custom types
CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
CREATE TYPE property_category AS ENUM ('office-space', 'retail-space', 'warehouse', 'industrial', 'mixed-use', 'land');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'qualified', 'viewing_scheduled', 'offer_made', 'closed_won', 'closed_lost');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- 3. Create tables (users, properties, property_images, inquiries, analytics_events)
-- [Full table definitions as shown above]

-- 4. Create indexes
-- [All index definitions as shown above]

-- 5. Enable RLS and create policies
-- [All RLS policies as shown above]

-- 6. Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE property_images;

-- 7. Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
-- [Storage policies as shown above]

-- 8. Create functions and triggers
-- [Trigger functions as shown above]
```

---

**Schema Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Total Tables**: 5 core tables + audit/storage tables  
**RLS Policies**: 20+ policies for secure access  
**Real-time Enabled**: ✅ All core tables