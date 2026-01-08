-- Initialize required PostgreSQL extensions
-- This file must run before any tables are created

-- Create the pgvector extension for vector similarity operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is available
SELECT 'pgvector extension successfully created' AS status;