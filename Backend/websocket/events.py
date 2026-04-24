"""
Shared constants for WebSocket group names and event types.

- DASHBOARD_GROUP must match the group name used in group_add / group_send calls.
- Event type strings must match the consumer handler method names with dots→underscores
  (e.g. 'sensor.reading' → consumer method sensor_reading).

Import these in every file that calls channel_layer.group_send() or
references the dashboard group, so a rename only needs one change here.
"""

DASHBOARD_GROUP     = 'dashboard'

SENSOR_READING      = 'sensor.reading'
ALERT_NEW           = 'alert.new'
ALERT_ACKNOWLEDGED  = 'alert.acknowledged'
ACTUATOR_UPDATED    = 'actuator.updated'
SENSOR_STATUS       = 'sensor.status'
