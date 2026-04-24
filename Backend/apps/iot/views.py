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

from websocket.events import DASHBOARD_GROUP, SENSOR_READING, ALERT_NEW


class IoTReadingView(APIView):
    """
    POST /api/iot/readings/
    HTTP fallback for manual testing — primary ingestion path is MQTT.
    Accepts a batch of sensor readings from the ESP32 (or test scripts).
    """
    authentication_classes = [APIKeyAuthentication]
    permission_classes     = [HasValidAPIKey]

    def post(self, request):
        serializer = IoTBatchReadingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ingested_at = timezone.now()
        readings    = []

        for item in serializer.validated_data['readings']:
            # Create with sensor= (not sensor_id=) so the FK object is already
            # loaded in memory — avoids N+1 when broadcasting below.
            reading = SensorReading.objects.create(
                sensor=item['sensor'],
                value=item['value'],
            )
            readings.append(reading)

        _broadcast_readings_and_alerts(readings, ingested_at)

        return Response({'ingested': len(readings)}, status=status.HTTP_201_CREATED)


def _broadcast_readings_and_alerts(readings, since):
    channel_layer = get_channel_layer()

    for reading in readings:
        async_to_sync(channel_layer.group_send)(
            DASHBOARD_GROUP,
            {
                'type':        SENSOR_READING,
                'sensor_id':   str(reading.sensor.id),
                'value':       float(reading.value),
                'measured_at': reading.measured_at.isoformat(),
                'unit':        reading.sensor.unit,
            },
        )

    # Query for alerts the DB trigger created for these sensors since ingestion
    sensor_ids = [r.sensor_id for r in readings]
    new_alerts = (
        Alert.objects
        .filter(sensor_id__in=sensor_ids, triggered_at__gte=since)
        .select_related('sensor', 'actuator')
    )

    for alert in new_alerts:
        async_to_sync(channel_layer.group_send)(
            DASHBOARD_GROUP,
            {
                'type':          ALERT_NEW,
                'alert_id':      str(alert.id),
                'alert_type':    alert.type,
                'severity':      alert.severity,
                'message':       alert.message,
                'sensor_name':   alert.sensor.name   if alert.sensor   else None,
                'actuator_name': alert.actuator.name if alert.actuator else None,
                'triggered_at':  alert.triggered_at.isoformat(),
            },
        )
