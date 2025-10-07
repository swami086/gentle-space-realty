-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    logo TEXT NOT NULL,
    website TEXT,
    description TEXT CHECK (LENGTH(description) <= 500),
    "order" INTEGER NOT NULL DEFAULT 0 CHECK ("order" >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active companies query optimization
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies (is_active);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_companies_order ON companies ("order");

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample companies if table is empty
INSERT INTO companies (name, logo, website, description, "order", is_active)
SELECT * FROM (VALUES 
    ('Gentle Space Realty', 'https://example.com/logo1.png', 'https://gentlespacerealty.com', 'Premier real estate services with a focus on client satisfaction', 1, true),
    ('Urban Properties Ltd', 'https://example.com/logo2.png', 'https://urbanproperties.com', 'Modern urban real estate solutions for contemporary living', 2, true),
    ('Countryside Homes', 'https://example.com/logo3.png', 'https://countrysidehomes.com', 'Specializing in rural and countryside property investments', 3, false)
) AS v(name, logo, website, description, "order", is_active)
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);