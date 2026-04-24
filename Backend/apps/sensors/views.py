from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.sensors.models import Sensor, SensorReading, Threshold
from apps.sensors.serializers import (
    SensorSerializer,
    SensorReadingSerializer,
    ThresholdSerializer,
    ThresholdPatchSerializer,
)
from apps.users.permissions import IsAdmin


class SensorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sensors = Sensor.objects.prefetch_related('readings', 'status_logs').all()
        return Response(SensorSerializer(sensors, many=True).data)


class SensorDetailView(APIView):
    """PATCH /api/sensors/:id/ — activate or deactivate a sensor (admin only)."""
    permission_classes = [IsAdmin]

    def patch(self, request, sensor_id):
        try:
            sensor = Sensor.objects.get(id=sensor_id)
        except Sensor.DoesNotExist:
            return Response({'detail': 'Sensor not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get('is_active')
        if is_active is None or not isinstance(is_active, bool):
            return Response(
                {'detail': 'is_active (boolean) is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sensor.is_active = is_active
        # trg_log_sensor_status DB trigger fires automatically on this save
        sensor.save(update_fields=['is_active'])

        return Response(SensorSerializer(sensor).data)


class SensorReadingsView(APIView):
    """GET /api/sensors/:id/readings/ — historical readings with optional date filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request, sensor_id):
        try:
            sensor = Sensor.objects.get(id=sensor_id)
        except Sensor.DoesNotExist:
            return Response({'detail': 'Sensor not found.'}, status=status.HTTP_404_NOT_FOUND)

        readings = SensorReading.objects.filter(sensor=sensor)

        from_date = request.query_params.get('from')
        to_date   = request.query_params.get('to')

        if from_date:
            readings = readings.filter(measured_at__gte=from_date)
        if to_date:
            readings = readings.filter(measured_at__lte=to_date)

        # Cap at 500 points to protect the dashboard from huge payloads
        readings = readings[:500]

        return Response(SensorReadingSerializer(readings, many=True).data)


class SensorLatestView(APIView):
    """GET /api/sensors/:id/latest/ — most recent reading for one sensor."""
    permission_classes = [IsAuthenticated]

    def get(self, request, sensor_id):
        try:
            sensor = Sensor.objects.get(id=sensor_id)
        except Sensor.DoesNotExist:
            return Response({'detail': 'Sensor not found.'}, status=status.HTTP_404_NOT_FOUND)

        reading = SensorReading.objects.filter(sensor=sensor).first()
        if not reading:
            return Response({'detail': 'No readings available.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(SensorReadingSerializer(reading).data)


class ThresholdListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        thresholds = Threshold.objects.select_related('set_by').all()
        return Response(ThresholdSerializer(thresholds, many=True).data)


class ThresholdDetailView(APIView):
    """PATCH /api/thresholds/:sensor_type/ — update min/max threshold (admin only)."""
    permission_classes = [IsAdmin]

    def patch(self, request, sensor_type):
        try:
            threshold = Threshold.objects.get(sensor_type=sensor_type)
        except Threshold.DoesNotExist:
            return Response({'detail': 'Threshold not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ThresholdPatchSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(threshold, serializer.validated_data)
        return Response(ThresholdSerializer(threshold).data)
