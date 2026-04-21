-- ============================================================
-- 01_extensions.sql
-- Enable required PostgreSQL extensions.
-- ============================================================

-- Required for gen_random_uuid() used in all primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
