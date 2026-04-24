-- ============================================================
-- 08_permissions.sql
-- Grant the minimum required privileges to each role.
-- Run this AFTER all tables, views, and functions are created.
-- Must be run while connected to agriculture_intelligente.
-- ============================================================


-- ------------------------------------------------------------
-- MIGRATION ROLE
-- Full access to schema and all objects for running scripts.
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON DATABASE agriculture_intelligente TO agri_migration;
GRANT ALL PRIVILEGES ON ALL TABLES     IN SCHEMA public TO agri_migration;
GRANT ALL PRIVILEGES ON ALL SEQUENCES  IN SCHEMA public TO agri_migration;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS  IN SCHEMA public TO agri_migration;

-- Ensure future tables are also covered
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES    TO agri_migration;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO agri_migration;


-- ------------------------------------------------------------
-- APPLICATION ROLE (agri_app)
-- The backend only needs SELECT, INSERT, UPDATE on specific tables.
-- It should NEVER be able to DROP or ALTER anything.
-- ------------------------------------------------------------

-- Connect privilege
GRANT CONNECT ON DATABASE agriculture_intelligente TO agri_app;

-- Schema usage
GRANT USAGE ON SCHEMA public TO agri_app;

-- READ access on all tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agri_app;

-- WRITE access — only on tables the backend needs to insert/update
GRANT INSERT, UPDATE ON
    users,
    sessions,
    access_tokens,
    refresh_tokens,
    password_reset_tokens,
    sensor_readings,
    sensor_status_logs,
    thresholds,
    actions,
    alerts,
    script_logs,
    exports
TO agri_app;

-- Allow soft-deletes and status updates
GRANT UPDATE (is_active, updated_at)            ON users                 TO agri_app;
GRANT UPDATE (revoked_at, last_activity_at)     ON sessions              TO agri_app;
GRANT UPDATE (revoked_at)                       ON access_tokens         TO agri_app;
GRANT UPDATE (revoked_at, last_used_at)         ON refresh_tokens        TO agri_app;
GRANT UPDATE (used_at)                          ON password_reset_tokens TO agri_app;
GRANT UPDATE (is_acknowledged, acknowledged_by, acknowledged_at) ON alerts TO agri_app;
GRANT UPDATE (status, last_triggered_at)        ON actuators             TO agri_app;
GRANT UPDATE (min_value, max_value, set_by, updated_at) ON thresholds    TO agri_app;

-- Sequence access (needed for any serial/generated IDs — UUIDs use functions, but safe to grant)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO agri_app;

-- Ensure future tables are also covered
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO agri_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO agri_app;


-- ------------------------------------------------------------
-- REVOKE dangerous defaults
-- By default PostgreSQL grants PUBLIC access to the public schema.
-- We lock that down.
-- ------------------------------------------------------------
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE agriculture_intelligente FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO agri_app;
GRANT USAGE ON SCHEMA public TO agri_migration;
