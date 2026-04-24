-- ============================================================
-- 06_triggers.sql
-- Automated database-level logic triggered by data changes.
-- ============================================================


-- ------------------------------------------------------------
-- TRIGGER 1: Auto-update updated_at on USERS
-- Fires every time a user row is updated.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_users_updated_at();


-- ------------------------------------------------------------
-- TRIGGER 2: Auto-update last_activity_at on SESSIONS
-- Fires every time an access token for that session is updated
-- (e.g. when the token is used and last_used_at is refreshed).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions
    SET last_activity_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_activity_on_token_use
AFTER UPDATE ON refresh_tokens
FOR EACH ROW
WHEN (NEW.last_used_at IS DISTINCT FROM OLD.last_used_at)
EXECUTE FUNCTION fn_update_session_activity();


-- ------------------------------------------------------------
-- TRIGGER 3: Auto-update last_triggered_at on ACTUATORS
-- Fires every time a new action is inserted for an actuator.
-- Also updates the actuator's current status.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_actuator_on_action()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE actuators
    SET
        last_triggered_at = NOW(),
        status = CASE NEW.action_type
                    WHEN 'turn_on'  THEN 'on'::actuator_status
                    WHEN 'turn_off' THEN 'off'::actuator_status
                 END
    WHERE id = NEW.actuator_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actuator_on_action
AFTER INSERT ON actions
FOR EACH ROW
EXECUTE FUNCTION fn_update_actuator_on_action();


-- ------------------------------------------------------------
-- TRIGGER 4: Auto-generate alert when a sensor reading
-- crosses a defined threshold.
-- Fires after every new sensor reading is inserted.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_threshold_and_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_threshold     thresholds%ROWTYPE;
    v_sensor        sensors%ROWTYPE;
    v_alert_type    alert_type;
    v_severity      alert_severity;
    v_message       TEXT;
    v_actuator_id   UUID;
BEGIN
    -- Fetch the sensor
    SELECT * INTO v_sensor FROM sensors WHERE id = NEW.sensor_id;

    -- Fetch the threshold for this sensor type
    SELECT * INTO v_threshold FROM thresholds WHERE sensor_type = v_sensor.type;

    -- No threshold defined, nothing to check
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Check lower bound
    IF v_threshold.min_value IS NOT NULL AND NEW.value < v_threshold.min_value THEN
        CASE v_sensor.type
            WHEN 'humidity'    THEN v_alert_type := 'low_humidity';
            WHEN 'temperature' THEN v_alert_type := 'low_temperature';
            WHEN 'luminosity'  THEN v_alert_type := 'low_luminosity';
            WHEN 'water_level' THEN v_alert_type := 'low_water_level';
            ELSE RETURN NEW;
        END CASE;

        v_severity := 'high';
        v_message  := 'Sensor ' || v_sensor.name || ' value ' || NEW.value ||
                      ' ' || v_sensor.unit || ' is below minimum threshold of ' ||
                      v_threshold.min_value || ' ' || v_sensor.unit || '.';

        -- Find the relevant actuator to respond
        SELECT id INTO v_actuator_id
        FROM actuators
        WHERE type = CASE v_sensor.type
                        WHEN 'humidity'   THEN 'pump'::actuator_type
                        WHEN 'luminosity' THEN 'lighting'::actuator_type
                        ELSE NULL
                     END
        LIMIT 1;

        INSERT INTO alerts (sensor_id, actuator_id, type, message, severity)
        VALUES (NEW.sensor_id, v_actuator_id, v_alert_type, v_message, v_severity);
    END IF;

    -- Check upper bound
    IF v_threshold.max_value IS NOT NULL AND NEW.value > v_threshold.max_value THEN
        CASE v_sensor.type
            WHEN 'temperature' THEN v_alert_type := 'high_temperature';
            WHEN 'co2'         THEN v_alert_type := 'high_co2';
            ELSE RETURN NEW;
        END CASE;

        v_severity := 'high';
        v_message  := 'Sensor ' || v_sensor.name || ' value ' || NEW.value ||
                      ' ' || v_sensor.unit || ' exceeded maximum threshold of ' ||
                      v_threshold.max_value || ' ' || v_sensor.unit || '.';

        -- Find the ventilation actuator for temperature and CO2 alerts
        SELECT id INTO v_actuator_id
        FROM actuators
        WHERE type = 'ventilation'
        LIMIT 1;

        INSERT INTO alerts (sensor_id, actuator_id, type, message, severity)
        VALUES (NEW.sensor_id, v_actuator_id, v_alert_type, v_message, v_severity);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_threshold_on_reading
AFTER INSERT ON sensor_readings
FOR EACH ROW
EXECUTE FUNCTION fn_check_threshold_and_alert();


-- ------------------------------------------------------------
-- TRIGGER 5: Auto-log sensor status when it goes offline.
-- Fires when a sensor's is_active field is set to FALSE.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_log_sensor_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        INSERT INTO sensor_status_logs (sensor_id, status, reason)
        VALUES (
            NEW.id,
            CASE WHEN NEW.is_active THEN 'online'::sensor_status
                 ELSE 'offline'::sensor_status
            END,
            'Sensor active status changed from ' || OLD.is_active || ' to ' || NEW.is_active
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_sensor_status
AFTER UPDATE ON sensors
FOR EACH ROW
EXECUTE FUNCTION fn_log_sensor_status_change();


-- ------------------------------------------------------------
-- TRIGGER 6: Auto-update thresholds updated_at
-- Fires every time a threshold row is updated.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_thresholds_updated_at
BEFORE UPDATE ON thresholds
FOR EACH ROW
EXECUTE FUNCTION fn_update_thresholds_updated_at();
