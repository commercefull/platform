-- CommerceFull PostgreSQL Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set default permissions for the commercefull user
GRANT ALL PRIVILEGES ON DATABASE commercefull TO commercefull;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for generating slugs
CREATE OR REPLACE FUNCTION slugify(text)
RETURNS text AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Set timezone to UTC
SET timezone = 'UTC';

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'CommerceFull PostgreSQL initialization completed successfully';
END $$;
