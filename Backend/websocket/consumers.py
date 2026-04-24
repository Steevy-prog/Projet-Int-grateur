import json
from channels.generic.websocket import AsyncWebsocketConsumer

DASHBOARD_GROUP = 'dashboard'


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    Single WebSocket consumer for the dashboard.
    All authenticated clients join the 'dashboard' group and receive
    sensor.reading, alert.new, alert.acknowledged, actuator.updated,
    and sensor.status events broadcast from the REST views.
    """

    async def connect(self):
        user = self.scope.get('user')

        if user is None:
            await self.close(code=4001)  # Unauthorized
            return

        await self.channel_layer.group_add(DASHBOARD_GROUP, self.channel_name)
        await self.accept()

        await self.send(json.dumps({
            'type':    'connection.established',
            'user_id': str(user.id),
            'role':    user.role,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(DASHBOARD_GROUP, self.channel_name)

    # ------------------------------------------------------------------
    # Event handlers — method names are event type with dots → underscores
    # ------------------------------------------------------------------

    async def sensor_reading(self, event):
        await self.send(json.dumps({
            'type':        'sensor.reading',
            'sensor_id':   event['sensor_id'],
            'value':       event['value'],
            'measured_at': event['measured_at'],
            'unit':        event['unit'],
        }))

    async def alert_new(self, event):
        await self.send(json.dumps({
            'type':          'alert.new',
            'alert_id':      event['alert_id'],
            'alert_type':    event['alert_type'],
            'severity':      event['severity'],
            'message':       event['message'],
            'sensor_name':   event.get('sensor_name'),
            'actuator_name': event.get('actuator_name'),
            'triggered_at':  event['triggered_at'],
        }))

    async def alert_acknowledged(self, event):
        await self.send(json.dumps({
            'type':             'alert.acknowledged',
            'alert_id':         event['alert_id'],
            'acknowledged_by':  event['acknowledged_by'],
            'acknowledged_at':  event['acknowledged_at'],
        }))

    async def actuator_updated(self, event):
        await self.send(json.dumps({
            'type':               'actuator.updated',
            'actuator_id':        event['actuator_id'],
            'status':             event['status'],
            'last_triggered_at':  event.get('last_triggered_at'),
        }))

    async def sensor_status(self, event):
        await self.send(json.dumps({
            'type':      'sensor.status',
            'sensor_id': event['sensor_id'],
            'status':    event['status'],
            'reason':    event.get('reason'),
        }))
