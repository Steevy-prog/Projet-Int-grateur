from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.iot.authentication import APIKeyAuthentication, HasValidAPIKey
from apps.iot.serializers import IoTBatchReadingSerializer
from apps.alerts.models import Alert
from apps.sensors.models import SensorReading


class IoTReadingView(APIView):
    """
    POST /api/iot/readings/
    Accepts one or more sensor readings from the ESP32.
    After saving, queries for any alerts the DB trigger created,
    then broadcasts everything via WebSocket.
    """
    authentication_classes = [APIKeyAuthentication]
    permission_classes     = [HasValidAPIKey]

    def post(self, request):
        serializer = IoTBatchReadingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ingested_at = timezone.now()
        saved_readings = []

        for item in serializer.validated_data['readings']:
            reading = SensorReading.objects.create(
                sensor_id=item['sensor_id'],
                value=item['value'],
            )
            saved_readings.append(reading)

        # Broadcast each reading and any alerts the DB trigger created
        _broadcast_readings_and_alerts(saved_readings, ingested_at)

        return Response(
            {'ingested': len(saved_readings)},
            status=status.HTTP_201_CREATED,
        )


def _broadcast_readings_and_alerts(readings, since):
    channel_layer = get_channel_layer()

    for reading in readings:
        # Broadcast the sensor reading
        async_to_sync(channel_layer.group_send)(
            'dashboard',
            {
                'type':        'sensor.reading',
                'sensor_id':   str(reading.sensor_id),
                'value':       float(reading.value),
                'measured_at': reading.measured_at.isoformat(),
                'unit':        reading.sensor.unit,
            },
        )

    # Query for alerts the trigger created for these sensor IDs since ingestion started
    sensor_ids = [r.sensor_id for r in readings]
    new_alerts = Alert.objects.filter(
        sensor_id__in=sensor_ids,
        triggered_at__gte=since,
    ).select_related('sensor', 'actuator')

    for alert in new_alerts:
        async_to_sync(channel_layer.group_send)(
            'dashboard',
            {
                'type':          'alert.new',
                'alert_id':      str(alert.id),
                'alert_type':    alert.type,
                'severity':      alert.severity,
                'message':       alert.message,
                'sensor_name':   alert.sensor.name  if alert.sensor   else None,
                'actuator_name': alert.actuator.name if alert.actuator else None,
                'triggered_at':  alert.triggered_at.isoformat(),
            },
        )
