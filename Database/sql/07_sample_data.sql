-- ============================================================
-- 07_sample_data.sql
-- Realistic test data for development and demonstration.
-- Passwords are bcrypt hashes. Plain text versions:
--   admin_user  → Admin@1234
--   viewer_user → Viewer@1234
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- USERS
-- 1 admin (no created_by since it's the first account),
-- 1 viewer created by the admin.
-- ------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, role, language, is_active, created_by)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'admin_user',
    'admin@agriculture-intelligente.cm',
    crypt('hashed_placeholder_admin', gen_salt('bf')),
    'admin',
    'fr',
    TRUE,
    NULL
),
(
    '22222222-2222-2222-2222-222222222222',
    'viewer_user',
    'viewer@agriculture-intelligente.cm',
    crypt('hashed_placeholder_viewer', gen_salt('bf')),
    'viewer',
    'en',
    TRUE,
    '11111111-1111-1111-1111-111111111111'
);


-- ------------------------------------------------------------
-- SENSORS
-- One sensor per type as defined in the project.
-- ------------------------------------------------------------
INSERT INTO sensors (id, name, type, unit, location, is_active)
VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'Capteur Humidité Sol',      'humidity',    '%',   'Parcelle A', TRUE),
    ('aaaa0002-0000-0000-0000-000000000002', 'Capteur Température',       'temperature', '°C',  'Serre 1',    TRUE),
    ('aaaa0003-0000-0000-0000-000000000003', 'Capteur CO2',               'co2',         'ppm', 'Serre 1',    TRUE),
    ('aaaa0004-0000-0000-0000-000000000004', 'Capteur Luminosité',        'luminosity',  'lux', 'Parcelle A', TRUE),
    ('aaaa0005-0000-0000-0000-000000000005', 'Capteur Niveau Réservoir',  'water_level', '%',   'Réservoir',  TRUE);


-- ------------------------------------------------------------
-- ACTUATORS
-- One actuator per type as defined in the project.
-- ------------------------------------------------------------
INSERT INTO actuators (id, name, type, status)
VALUES
    ('bbbb0001-0000-0000-0000-000000000001', 'Pompe Irrigation',  'pump',        'off'),
    ('bbbb0002-0000-0000-0000-000000000002', 'Ventilateur Serre', 'ventilation', 'off'),
    ('bbbb0003-0000-0000-0000-000000000003', 'Éclairage Serre',   'lighting',    'off');


-- ------------------------------------------------------------
-- THRESHOLDS
-- Realistic agricultural thresholds per sensor type.
-- ------------------------------------------------------------
INSERT INTO thresholds (sensor_type, min_value, max_value, set_by)
VALUES
    ('humidity',    30.0,  80.0,  '11111111-1111-1111-1111-111111111111'),
    ('temperature', 15.0,  35.0,  '11111111-1111-1111-1111-111111111111'),
    ('co2',         NULL,  1000.0,'11111111-1111-1111-1111-111111111111'),
    ('luminosity',  200.0, NULL,  '11111111-1111-1111-1111-111111111111'),
    ('water_level', 20.0,  NULL,  '11111111-1111-1111-1111-111111111111');


-- ------------------------------------------------------------
-- SENSOR READINGS
-- A few historical readings per sensor to populate the dashboard.
-- ------------------------------------------------------------
INSERT INTO sensor_readings (sensor_id, value, measured_at)
VALUES
    -- Humidity readings (normal range)
    ('aaaa0001-0000-0000-0000-000000000001', 62.5,  NOW() - INTERVAL '2 hours'),
    ('aaaa0001-0000-0000-0000-000000000001', 58.0,  NOW() - INTERVAL '1 hour'),
    ('aaaa0001-0000-0000-0000-000000000001', 25.0,  NOW() - INTERVAL '30 minutes'),  -- Below threshold → triggers alert
    ('aaaa0001-0000-0000-0000-000000000001', 24.0,  NOW()),

    -- Temperature readings
    ('aaaa0002-0000-0000-0000-000000000002', 22.0,  NOW() - INTERVAL '2 hours'),
    ('aaaa0002-0000-0000-0000-000000000002', 27.5,  NOW() - INTERVAL '1 hour'),
    ('aaaa0002-0000-0000-0000-000000000002', 36.0,  NOW() - INTERVAL '30 minutes'),  -- Above threshold → triggers alert
    ('aaaa0002-0000-0000-0000-000000000002', 37.2,  NOW()),

    -- CO2 readings
    ('aaaa0003-0000-0000-0000-000000000003', 450.0, NOW() - INTERVAL '2 hours'),
    ('aaaa0003-0000-0000-0000-000000000003', 620.0, NOW() - INTERVAL '1 hour'),
    ('aaaa0003-0000-0000-0000-000000000003', 980.0, NOW() - INTERVAL '30 minutes'),
    ('aaaa0003-0000-0000-0000-000000000003', 850.0, NOW()),

    -- Luminosity readings
    ('aaaa0004-0000-0000-0000-000000000004', 1200.0,NOW() - INTERVAL '2 hours'),
    ('aaaa0004-0000-0000-0000-000000000004', 800.0, NOW() - INTERVAL '1 hour'),
    ('aaaa0004-0000-0000-0000-000000000004', 150.0, NOW() - INTERVAL '30 minutes'),  -- Below threshold → triggers alert
    ('aaaa0004-0000-0000-0000-000000000004', 100.0, NOW()),

    -- Water level readings
    ('aaaa0005-0000-0000-0000-000000000005', 75.0,  NOW() - INTERVAL '2 hours'),
    ('aaaa0005-0000-0000-0000-000000000005', 50.0,  NOW() - INTERVAL '1 hour'),
    ('aaaa0005-0000-0000-0000-000000000005', 15.0,  NOW() - INTERVAL '30 minutes'),  -- Below threshold → triggers alert
    ('aaaa0005-0000-0000-0000-000000000005', 10.0,  NOW());


-- ------------------------------------------------------------
-- ACTIONS
-- A mix of manual (web), CLI, and automatic actions.
-- ------------------------------------------------------------
INSERT INTO actions (actuator_id, triggered_by, action_type, source, notes, triggered_at)
VALUES
    -- Admin manually turns on the pump via web
    ('bbbb0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'turn_on',  'web',  'Arrosage manuel déclenché par admin',          NOW() - INTERVAL '3 hours'),
    ('bbbb0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'turn_off', 'web',  'Arrosage arrêté manuellement',                 NOW() - INTERVAL '2 hours 30 minutes'),

    -- System auto-triggers ventilation
    ('bbbb0002-0000-0000-0000-000000000002', NULL,                                   'turn_on',  'auto', 'Température critique détectée',               NOW() - INTERVAL '1 hour'),
    ('bbbb0002-0000-0000-0000-000000000002', NULL,                                   'turn_off', 'auto', 'Température revenue à la normale',            NOW() - INTERVAL '45 minutes'),

    -- CLI script triggers lighting
    ('bbbb0003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'turn_on',  'cli',  'Éclairage déclenché via script batch',        NOW() - INTERVAL '20 minutes');


-- ------------------------------------------------------------
-- SCRIPT_LOGS
-- Sample CLI script execution records.
-- ------------------------------------------------------------
INSERT INTO script_logs (executed_by, command, result, source, executed_at)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'irrigate --duration=30',
        'SUCCESS: Pump activated for 30 seconds',
        'cli',
        NOW() - INTERVAL '3 hours'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'ventilate --on',
        'SUCCESS: Ventilation started',
        'cli',
        NOW() - INTERVAL '2 hours'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'light --off',
        'SUCCESS: Lighting turned off',
        'cli',
        NOW() - INTERVAL '1 hour'
    );


-- ------------------------------------------------------------
-- SENSOR STATUS LOGS
-- Initial online status logged for all sensors.
-- ------------------------------------------------------------
INSERT INTO sensor_status_logs (sensor_id, status, reason, logged_at)
VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'online', 'Initial system startup', NOW() - INTERVAL '6 hours'),
    ('aaaa0002-0000-0000-0000-000000000002', 'online', 'Initial system startup', NOW() - INTERVAL '6 hours'),
    ('aaaa0003-0000-0000-0000-000000000003', 'online', 'Initial system startup', NOW() - INTERVAL '6 hours'),
    ('aaaa0004-0000-0000-0000-000000000004', 'online', 'Initial system startup', NOW() - INTERVAL '6 hours'),
    ('aaaa0005-0000-0000-0000-000000000005', 'online', 'Initial system startup', NOW() - INTERVAL '6 hours');


-- ------------------------------------------------------------
-- NOTE: Alerts are NOT inserted manually here.
-- They are automatically generated by trigger trg_check_threshold_on_reading
-- when the sensor readings above are inserted.
-- Check the alerts table after running this file to see them.
-- ------------------------------------------------------------
