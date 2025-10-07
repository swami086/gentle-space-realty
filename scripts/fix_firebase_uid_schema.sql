-- Fix Firebase UID Compatibility - Change users.id from UUID to VARCHAR
-- This allows Firebase UIDs (strings) to be stored directly
-- Run this script on the GCP Cloud SQL database

-- Connect to the database
\c gentle_space_realty;

-- Step 1: Create backup of existing users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop foreign key constraints that reference users.id
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_agent_id_fkey;
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_approved_by_fkey;
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_assigned_to_fkey;
ALTER TABLE faqs DROP CONSTRAINT IF EXISTS faqs_created_by_fkey;

-- Step 3: Change users.id column to VARCHAR to support Firebase UIDs
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE users ALTER COLUMN id SET NOT NULL;

-- Step 4: Update related tables to match VARCHAR type
ALTER TABLE properties ALTER COLUMN listing_agent_id TYPE VARCHAR(128);
ALTER TABLE testimonials ALTER COLUMN approved_by TYPE VARCHAR(128);
ALTER TABLE inquiries ALTER COLUMN assigned_to TYPE VARCHAR(128);
ALTER TABLE faqs ALTER COLUMN created_by TYPE VARCHAR(128);

-- Step 5: Recreate foreign key constraints
ALTER TABLE properties 
ADD CONSTRAINT properties_listing_agent_id_fkey 
FOREIGN KEY (listing_agent_id) REFERENCES users(id);

ALTER TABLE testimonials 
ADD CONSTRAINT testimonials_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inquiries 
ADD CONSTRAINT inquiries_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE faqs 
ADD CONSTRAINT faqs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 6: Add index on new VARCHAR id column for performance
CREATE INDEX IF NOT EXISTS idx_users_id_varchar ON users(id);

-- Step 7: Verification queries
SELECT 'Schema Update Complete' as status;
SELECT 'Users table structure:' as info;
\d users;

SELECT 'Sample data:' as info;
SELECT id, email, name, role FROM users LIMIT 3;

-- Cleanup note: Drop backup table after verification
-- DROP TABLE users_backup;