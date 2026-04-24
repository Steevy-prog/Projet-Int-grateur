import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

from websocket.events import (
    DASHBOARD_GROUP,
    SENSOR_READING,
    ALERT_NEW,
    ALERT_ACKNOWLEDGED,
    ACTUATOR_UPDATED,
    SENSOR_STATUS,
)

logger = logging.getLogger(__name__)


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    Single WebSocket consumer for the dashboard.
    All authenticated clients join the 'dashboard' group and receive
    sensor.reading, alert.new, alert.acknowledged, actuator.updated,
    and sensor.status events broadcast from REST views and the MQTT subscriber.
    """

    async def connect(self):
        user = self.scope.get('user')

        if user is None:
            logger.warning('WS connect rejected: no authenticated user')
            await self.accept()
            await self.close(code=4001)
            return

        await self.accept()

        try:
            await self.channel_layer.group_add(DASHBOARD_GROUP, self.channel_name)
        except Exception as exc:
            logger.error('WS connect: channel_layer.group_add failed: %s', exc)
            await self.close(code=4002)
            return

        await self.send(json.dumps({
            'type':    'connection.established',
            'user_id': str(user.id),
            'role':    user.role,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(DASHBOARD_GROUP, self.channel_name)

    # ------------------------------------------------------------------
    # Event handlers — method name = event type with dots → underscores
    # ------------------------------------------------------------------

    async def sensor_reading(self, event):
        try:
            await self.send(json.dumps({
                'type':        SENSOR_READING,
                'sensor_id':   event['sensor_id'],
                'value':       event['value'],
                'measured_at': event['measured_at'],
                'unit':        event['unit'],
            }))
        except KeyError as exc:
            logger.warning('Malformed %s event — missing key: %s', SENSOR_READING, exc)

    async def alert_new(self, event):
        try:
            await self.send(json.dumps({
                'type':          ALERT_NEW,
                'alert_id':      event['alert_id'],
                'alert_type':    event['alert_type'],
                'severity':      event['severity'],
                'message':       event['message'],
                'sensor_name':   event.get('sensor_name'),
                'actuator_name': event.get('actuator_name'),
                'triggered_at':  event['triggered_at'],
            }))
        except KeyError as exc:
            logger.warning('Malformed %s event — missing key: %s', ALERT_NEW, exc)

    async def alert_acknowledged(self, event):
        try:
            await self.send(json.dumps({
                'type':            ALERT_ACKNOWLEDGED,
                'alert_id':        event['alert_id'],
                'acknowledged_by': event['acknowledged_by'],
                'acknowledged_at': event['acknowledged_at'],
            }))
        except KeyError as exc:
            logger.warning('Malformed %s event — missing key: %s', ALERT_ACKNOWLEDGED, exc)

    async def actuator_updated(self, event):
        try:
            await self.send(json.dumps({
                'type':              ACTUATOR_UPDATED,
                'actuator_id':       event['actuator_id'],
                'status':            event['status'],
                'last_triggered_at': event.get('last_triggered_at'),
            }))
        except KeyError as exc:
            logger.warning('Malformed %s event — missing key: %s', ACTUATOR_UPDATED, exc)

    async def sensor_status(self, event):
        try:
            await self.send(json.dumps({
                'type':      SENSOR_STATUS,
                'sensor_id': event['sensor_id'],
                'status':    event['status'],
                'reason':    event.get('reason'),
            }))
        except KeyError as exc:
            logger.warning('Malformed %s event — missing key: %s', SENSOR_STATUS, exc)
