-- ============================================================
-- 00_create_database.sql
-- Run this ONCE as a PostgreSQL superuser (postgres) before
-- running any other script.
-- 
-- Usage:
--   psql -U postgres -f 00_create_database.sql
-- ============================================================


-- ------------------------------------------------------------
-- DATABASE
-- ------------------------------------------------------------
CREATE DATABASE agriculture_intelligente
    WITH
    ENCODING    = 'UTF8'
    LC_COLLATE  = 'fr_FR.UTF-8'
    LC_CTYPE    = 'fr_FR.UTF-8'
    TEMPLATE    = template0;

COMMENT ON DATABASE agriculture_intelligente
    IS 'Système de gestion agricole intelligent — UCAC-ICAM 2025';


-- ------------------------------------------------------------
-- APPLICATION ROLE
-- This is the only role the backend app will use.
-- It has no superuser privileges — only what it strictly needs.
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'agri_app'
    ) THEN
        CREATE ROLE agri_app WITH
            LOGIN
            PASSWORD 'AgriApp@SecurePass2025'   -- Change this in production
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            CONNECTION LIMIT 20;

        COMMENT ON ROLE agri_app IS
            'Application role for agriculture_intelligente backend. Limited privileges only.';
    END IF;
END
$$;


-- ------------------------------------------------------------
-- MIGRATION ROLE (for running setup scripts only)
-- Used exclusively to run the SQL migration files.
-- Should not be used by the backend application.
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'agri_migration'
    ) THEN
        CREATE ROLE agri_migration WITH
            LOGIN
            PASSWORD 'AgriMigration@SecurePass2025'  -- Change this in production
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            CONNECTION LIMIT 5;

        COMMENT ON ROLE agri_migration IS
            'Migration role for running setup and schema scripts only.';
    END IF;
END
$$;
