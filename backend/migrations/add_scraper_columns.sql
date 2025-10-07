-- Migration: Add scraper-related columns to properties table
-- Date: 2025-10-01
-- Purpose: Support web scraping functionality

BEGIN;

-- Add scraper-related columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS search_params JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by CHARACTER VARYING(128) REFERENCES users(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_properties_source_url ON properties (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_scraped_at ON properties (scraped_at) WHERE scraped_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties (created_by);

-- Add constraints
ALTER TABLE properties ADD CONSTRAINT valid_source_url CHECK (source_url IS NULL OR source_url ~* '^https?://');

-- Add comments for documentation
COMMENT ON COLUMN properties.source_url IS 'URL where the property was scraped from';
COMMENT ON COLUMN properties.scraped_at IS 'Timestamp when the property was scraped';
COMMENT ON COLUMN properties.search_params IS 'Search parameters used when scraping this property';
COMMENT ON COLUMN properties.created_by IS 'User who created/imported this property';

COMMIT;