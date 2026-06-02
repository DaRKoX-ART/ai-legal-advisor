-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: auth.users and auth schema are managed by Supabase Auth.
-- This migration sets up the public schema tables that extend auth.
