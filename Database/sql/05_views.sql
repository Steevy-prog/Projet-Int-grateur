-- ============================================================
-- 05_views.sql
-- Reusable views for dashboard, alerts, and action history.
-- ============================================================


-- ------------------------------------------------------------
-- v_sensor_readings
-- Joins sensor readings with sensor metadata.
-- Used by the dashboard to display labeled, unit-aware data.
-- ------------------------------------------------------------
CREATE VIEW v_sensor_readings AS
SELECT
    sr.id,
    sr.value,
    sr.measured_at,
    s.id           AS sensor_id,
    s.name         AS sensor_name,
    s.type         AS sensor_type,
    s.unit         AS sensor_unit,
    s.location     AS sensor_location
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id;


-- ------------------------------------------------------------
-- v_latest_readings
-- Returns only the most recent reading per sensor.
-- Used by the dashboard summary cards.
-- ------------------------------------------------------------
CREATE VIEW v_latest_readings AS
SELECT DISTINCT ON (sr.sensor_id)
    sr.id,
    sr.value,
    sr.measured_at,
    s.id           AS sensor_id,
    s.name         AS sensor_name,
    s.type         AS sensor_type,
    s.unit         AS sensor_unit,
    s.location     AS sensor_location
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id
WHERE s.is_active = TRUE
ORDER BY sr.sensor_id, sr.measured_at DESC;


-- ------------------------------------------------------------
-- v_active_alerts
-- Returns all unacknowledged alerts with sensor and actuator details.
-- Used by the dashboard notification zone.
-- ------------------------------------------------------------
CREATE VIEW v_active_alerts AS
SELECT
    a.id,
    a.type,
    a.message,
    a.severity,
    a.triggered_at,
    s.name         AS sensor_name,
    s.type         AS sensor_type,
    s.location     AS sensor_location,
    act.name       AS actuator_name,
    act.type       AS actuator_type
FROM alerts a
LEFT JOIN sensors   s   ON s.id   = a.sensor_id
LEFT JOIN actuators act ON act.id = a.actuator_id
WHERE a.is_acknowledged = FALSE
ORDER BY
    CASE a.severity
        WHEN 'high'   THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low'    THEN 3
    END,
    a.triggered_at DESC;


-- ------------------------------------------------------------
-- v_action_history
-- Returns full action history with user and actuator details.
-- Used by the history/log page and CSV export.
-- ------------------------------------------------------------
CREATE VIEW v_action_history AS
SELECT
    ac.id,
    ac.action_type,
    ac.source,
    ac.notes,
    ac.triggered_at,
    u.username      AS triggered_by_username,
    u.role          AS triggered_by_role,
    act.name        AS actuator_name,
    act.type        AS actuator_type,
    act.status      AS actuator_current_status
FROM actions ac
LEFT JOIN users     u   ON u.id   = ac.triggered_by
JOIN      actuators act ON act.id = ac.actuator_id
ORDER BY ac.triggered_at DESC;


-- ------------------------------------------------------------
-- v_alert_history
-- Returns full alert history including acknowledgement details.
-- Used by the history/log page and CSV export.
-- ------------------------------------------------------------
CREATE VIEW v_alert_history AS
SELECT
    a.id,
    a.type,
    a.message,
    a.severity,
    a.is_acknowledged,
    a.triggered_at,
    a.acknowledged_at,
    s.name          AS sensor_name,
    s.type          AS sensor_type,
    s.location      AS sensor_location,
    act.name        AS actuator_name,
    u.username      AS acknowledged_by_username
FROM alerts a
LEFT JOIN sensors   s   ON s.id   = a.sensor_id
LEFT JOIN actuators act ON act.id = a.actuator_id
LEFT JOIN users     u   ON u.id   = a.acknowledged_by
ORDER BY a.triggered_at DESC;
