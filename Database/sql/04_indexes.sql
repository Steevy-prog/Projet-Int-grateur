-- ============================================================
-- 04_indexes.sql
-- Performance indexes on frequently queried columns.
-- ============================================================


-- USERS
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_username    ON users(username);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_created_by  ON users(created_by);

-- SESSIONS
CREATE INDEX idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX idx_sessions_revoked_at ON sessions(revoked_at);  -- Filter active sessions quickly

-- ACCESS_TOKENS
CREATE INDEX idx_access_tokens_session_id  ON access_tokens(session_id);
CREATE INDEX idx_access_tokens_user_id     ON access_tokens(user_id);
CREATE INDEX idx_access_tokens_token_hash  ON access_tokens(token_hash);  -- Lookup on every request
CREATE INDEX idx_access_tokens_expires_at  ON access_tokens(expires_at);

-- REFRESH_TOKENS
CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- PASSWORD_RESET_TOKENS
CREATE INDEX idx_password_reset_tokens_user_id    ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- SENSORS
CREATE INDEX idx_sensors_type      ON sensors(type);
CREATE INDEX idx_sensors_is_active ON sensors(is_active);

-- SENSOR_READINGS — most critical indexes in the entire schema
-- This table grows the fastest and is queried constantly by the dashboard
CREATE INDEX idx_sensor_readings_sensor_id   ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_measured_at ON sensor_readings(measured_at DESC);
CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings(sensor_id, measured_at DESC);  -- Composite for dashboard queries

-- SENSOR_STATUS_LOGS
CREATE INDEX idx_sensor_status_logs_sensor_id ON sensor_status_logs(sensor_id);
CREATE INDEX idx_sensor_status_logs_logged_at ON sensor_status_logs(logged_at DESC);

-- THRESHOLDS
CREATE INDEX idx_thresholds_sensor_type ON thresholds(sensor_type);

-- ACTUATORS
CREATE INDEX idx_actuators_type   ON actuators(type);
CREATE INDEX idx_actuators_status ON actuators(status);

-- ACTIONS
CREATE INDEX idx_actions_actuator_id   ON actions(actuator_id);
CREATE INDEX idx_actions_triggered_by  ON actions(triggered_by);
CREATE INDEX idx_actions_source        ON actions(source);
CREATE INDEX idx_actions_triggered_at  ON actions(triggered_at DESC);

-- ALERTS
CREATE INDEX idx_alerts_sensor_id        ON alerts(sensor_id);
CREATE INDEX idx_alerts_actuator_id      ON alerts(actuator_id);
CREATE INDEX idx_alerts_type             ON alerts(type);
CREATE INDEX idx_alerts_severity         ON alerts(severity);
CREATE INDEX idx_alerts_is_acknowledged  ON alerts(is_acknowledged);  -- Filter unacknowledged alerts quickly
CREATE INDEX idx_alerts_triggered_at     ON alerts(triggered_at DESC);

-- SCRIPT_LOGS
CREATE INDEX idx_script_logs_executed_by ON script_logs(executed_by);
CREATE INDEX idx_script_logs_executed_at ON script_logs(executed_at DESC);

-- EXPORTS
CREATE INDEX idx_exports_exported_by ON exports(exported_by);
CREATE INDEX idx_exports_export_type ON exports(export_type);
CREATE INDEX idx_exports_created_at  ON exports(created_at DESC);
