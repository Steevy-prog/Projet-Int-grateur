"""
MQTT message handler.

Topics consumed:
  {prefix}/readings/{sensor_type}   payload: {"value": <number>}
  {prefix}/status/{sensor_type}     payload: "online" | "offline" | "error"

sensor_type must match one of Sensor.Type choices:
  humidity | temperature | co2 | luminosity | water_level
"""
import json
import logging

from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from websocket.events import (
    DASHBOARD_GROUP,
    SENSOR_READING,
    ALERT_NEW,
    SENSOR_STATUS,
)

logger = logging.getLogger(__name__)

_channel_layer = None


def _get_channel_layer():
    global _channel_layer
    if _channel_layer is None:
        _channel_layer = get_channel_layer()
    return _channel_layer


def _broadcast(event: dict):
    """Send an event to the dashboard group via Redis channel layer.
    Catches exceptions so a Redis outage never crashes the MQTT subscriber."""
    try:
        async_to_sync(_get_channel_layer().group_send)(DASHBOARD_GROUP, event)
    except Exception:
        logger.exception('Failed to broadcast event type=%s', event.get('type'))


# ---------------------------------------------------------------------------
# Entry point — passed as on_message to paho
# ---------------------------------------------------------------------------

def process_message(client, userdata, msg):
    topic   = msg.topic
    payload = msg.payload.decode('utf-8').strip()

    parts = topic.split('/')
    if len(parts) < 3:
        logger.warning('Ignored malformed topic: %s', topic)
        return

    category    = parts[-2]   # 'readings' or 'status'
    sensor_type = parts[-1]   # 'temperature', 'co2', …

    try:
        if category == 'readings':
            _handle_reading(sensor_type, payload)
        elif category == 'status':
            _handle_status(sensor_type, payload)
        else:
            logger.debug('Ignored unknown category "%s" on topic %s', category, topic)
    except Exception:
        logger.exception('Unhandled error processing MQTT topic %s', topic)


# ---------------------------------------------------------------------------
# Reading handler
# ---------------------------------------------------------------------------

def _handle_reading(sensor_type: str, raw_payload: str):
    from apps.sensors.models import Sensor, SensorReading
    from apps.alerts.models  import Alert

    # Parse payload
    try:
        value = float(json.loads(raw_payload)['value'])
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        logger.warning('Bad reading payload for %s: %r', sensor_type, raw_payload)
        return

    # Resolve sensor — sensor object is kept to avoid N+1 on broadcast
    try:
        sensor = Sensor.objects.get(type=sensor_type, is_active=True)
    except Sensor.DoesNotExist:
        logger.warning('No active sensor for type "%s" — reading dropped.', sensor_type)
        return
    except Sensor.MultipleObjectsReturned:
        sensor = Sensor.objects.filter(type=sensor_type, is_active=True).first()

    ingested_at = timezone.now()

    # Create with sensor= (not sensor_id=) so reading.sensor is already loaded
    reading = SensorReading.objects.create(sensor=sensor, value=value)

    _broadcast({
        'type':        SENSOR_READING,
        'sensor_id':   str(sensor.id),
        'value':       value,
        'measured_at': reading.measured_at.isoformat(),
        'unit':        sensor.unit,
    })

    # The DB trigger runs synchronously inside the INSERT transaction,
    # so any alerts it created are already committed by the time we query.
    new_alerts = (
        Alert.objects
        .filter(sensor=sensor, triggered_at__gte=ingested_at)
        .select_related('sensor', 'actuator')
    )

    for alert in new_alerts:
        _broadcast({
            'type':          ALERT_NEW,
            'alert_id':      str(alert.id),
            'alert_type':    alert.type,
            'severity':      alert.severity,
            'message':       alert.message,
            'sensor_name':   alert.sensor.name   if alert.sensor   else None,
            'actuator_name': alert.actuator.name if alert.actuator else None,
            'triggered_at':  alert.triggered_at.isoformat(),
        })

    logger.info(
        'Reading saved: %s = %s %s%s',
        sensor.name, value, sensor.unit,
        f'  +{len(new_alerts)} alert(s)' if new_alerts else '',
    )


# ---------------------------------------------------------------------------
# Status handler
# ---------------------------------------------------------------------------

def _handle_status(sensor_type: str, raw_payload: str):
    from apps.sensors.models import Sensor

    status_value = raw_payload.lower()
    if status_value not in ('online', 'offline', 'error'):
        logger.warning('Unknown status %r for sensor type "%s".', status_value, sensor_type)
        return

    try:
        sensor = Sensor.objects.get(type=sensor_type)
    except Sensor.DoesNotExist:
        logger.warning('No sensor found for type "%s".', sensor_type)
        return
    except Sensor.MultipleObjectsReturned:
        sensor = Sensor.objects.filter(type=sensor_type).first()

    new_active = (status_value == 'online')

    if sensor.is_active != new_active:
        sensor.is_active = new_active
        # trg_log_sensor_status DB trigger fires automatically on this UPDATE
        sensor.save(update_fields=['is_active'])

        # Broadcast only when the status actually changed
        _broadcast({
            'type':      SENSOR_STATUS,
            'sensor_id': str(sensor.id),
            'status':    status_value,
            'reason':    None,
        })

        logger.info('Status update: %s → %s', sensor.name, status_value)
    else:
        logger.debug('Status unchanged for %s (%s) — no broadcast.', sensor.name, status_value)
