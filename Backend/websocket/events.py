"""
WebSocket event type constants.
These must match the 'type' field used in channel_layer.group_send() calls
across all apps, and the handler method names in the consumer
(dots replaced with underscores for the method name).
"""

SENSOR_READING      = 'sensor.reading'
ALERT_NEW           = 'alert.new'
ALERT_ACKNOWLEDGED  = 'alert.acknowledged'
ACTUATOR_UPDATED    = 'actuator.updated'
SENSOR_STATUS       = 'sensor.status'
