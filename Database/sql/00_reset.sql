-- ============================================================
-- 00_reset.sql
-- Drops all objects in reverse dependency order.
-- Run this to fully reset the database before rebuilding.
-- ============================================================

-- Tables (children first, then parents)
DROP TABLE IF EXISTS exports CASCADE;
DROP TABLE IF EXISTS script_logs CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS actuators CASCADE;
DROP TABLE IF EXISTS thresholds CASCADE;
DROP TABLE IF EXISTS sensor_status_logs CASCADE;
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS access_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Views
DROP VIEW IF EXISTS v_sensor_readings CASCADE;
DROP VIEW IF EXISTS v_active_alerts CASCADE;
DROP VIEW IF EXISTS v_action_history CASCADE;

-- Enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_language CASCADE;
DROP TYPE IF EXISTS sensor_type CASCADE;
DROP TYPE IF EXISTS actuator_type CASCADE;
DROP TYPE IF EXISTS actuator_status CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS action_source CASCADE;
DROP TYPE IF EXISTS alert_type CASCADE;
DROP TYPE IF EXISTS alert_severity CASCADE;
DROP TYPE IF EXISTS sensor_status CASCADE;
DROP TYPE IF EXISTS export_type CASCADE;

-- Extensions
DROP EXTENSION IF EXISTS "pgcrypto";
