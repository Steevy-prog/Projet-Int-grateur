from rest_framework import serializers
from apps.sensors.models import Sensor, SensorReading


class IoTReadingSerializer(serializers.Serializer):
    """Input payload sent by the ESP32 for a single sensor reading."""
    sensor_id = serializers.UUIDField()
    value     = serializers.DecimalField(max_digits=10, decimal_places=4)

    def validate_sensor_id(self, value):
        try:
            sensor = Sensor.objects.get(id=value, is_active=True)
        except Sensor.DoesNotExist:
            raise serializers.ValidationError('Sensor not found or inactive.')
        self._sensor = sensor
        return value

    def create(self, validated_data):
        return SensorReading.objects.create(
            sensor_id=validated_data['sensor_id'],
            value=validated_data['value'],
        )


class IoTBatchReadingSerializer(serializers.Serializer):
    """Allows ESP32 to send multiple readings in one request."""
    readings = IoTReadingSerializer(many=True)

    def validate_readings(self, value):
        if not value:
            raise serializers.ValidationError('At least one reading is required.')
        return value
