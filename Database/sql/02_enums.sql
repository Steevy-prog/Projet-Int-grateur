-- ============================================================
-- 02_enums.sql
-- Define all custom ENUM types used across tables.
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'viewer');

-- Supported UI languages
CREATE TYPE user_language AS ENUM ('fr', 'en');

-- Sensor types matching the physical sensors in the project
CREATE TYPE sensor_type AS ENUM (
    'humidity',       -- Soil humidity (YL-69)
    'temperature',    -- Ambient temperature (DHT22)
    'co2',            -- CO2 level (SEN0159)
    'luminosity',     -- Light level (BH1750)
    'water_level'     -- Reservoir water level
);

-- Actuator types matching the physical actuators in the project
CREATE TYPE actuator_type AS ENUM (
    'pump',           -- Irrigation pump
    'ventilation',    -- Ventilation fan
    'lighting'        -- Grow lights
);

-- Actuator current state
CREATE TYPE actuator_status AS ENUM ('on', 'off');

-- Action types that can be performed on actuators
CREATE TYPE action_type AS ENUM ('turn_on', 'turn_off');

-- Source of the action: who or what triggered it
CREATE TYPE action_source AS ENUM (
    'web',            -- Triggered manually via web interface
    'cli',            -- Triggered via batch script / CLI
    'auto'            -- Triggered automatically by the system
);

-- Alert types matching the project requirements
CREATE TYPE alert_type AS ENUM (
    'low_humidity',       -- Soil humidity below threshold
    'high_temperature',   -- Temperature above threshold
    'low_temperature',    -- Temperature below threshold
    'high_co2',           -- CO2 above threshold
    'low_water_level',    -- Reservoir water too low
    'low_luminosity',     -- Luminosity below threshold
    'sensor_failure'      -- Sensor stopped responding
);

-- Alert severity levels
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');

-- Sensor operational status
CREATE TYPE sensor_status AS ENUM ('online', 'offline', 'error');

-- Export types available from the application
CREATE TYPE export_type AS ENUM (
    'sensor_readings',    -- Historical sensor data
    'actions',            -- Action history
    'alerts'              -- Alert history
);
