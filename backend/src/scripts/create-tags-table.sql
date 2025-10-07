-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#000000', -- hex color code
    background_color VARCHAR(7) NOT NULL DEFAULT '#f0f9ff', -- hex color code
    description TEXT CHECK (LENGTH(description) <= 500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active tags query optimization
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags (is_active);

-- Create index for tag name lookups
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tags if table is empty
INSERT INTO tags (name, color, background_color, description, is_active)
SELECT * FROM (VALUES 
    ('Premium', '#1e40af', '#dbeafe', 'High-end luxury properties with premium features', true),
    ('Pet Friendly', '#15803d', '#dcfce7', 'Properties that welcome pets and have pet amenities', true),
    ('Newly Renovated', '#7c3aed', '#ede9fe', 'Recently renovated properties with modern updates', true),
    ('Furnished', '#dc2626', '#fee2e2', 'Fully furnished properties ready for immediate move-in', true),
    ('Parking Available', '#ea580c', '#fed7aa', 'Properties with dedicated parking spaces or garage', true),
    ('Garden View', '#0f766e', '#ccfbf1', 'Properties with beautiful garden or landscape views', true),
    ('City Center', '#4338ca', '#e0e7ff', 'Properties located in the heart of the city', true),
    ('Quiet Area', '#374151', '#f3f4f6', 'Properties in peaceful, low-noise neighborhoods', false)
) AS v(name, color, background_color, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM tags LIMIT 1);