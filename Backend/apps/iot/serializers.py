from rest_framework import serializers
from apps.sensors.models import Sensor, SensorReading


class IoTReadingSerializer(serializers.Serializer):
    """Input payload for a single sensor reading from the ESP32."""
    sensor_id = serializers.UUIDField()
    value     = serializers.DecimalField(max_digits=10, decimal_places=4)

    def validate_sensor_id(self, value):
        try:
            # Store the full sensor object so the view can use sensor= in create()
            # and avoid an extra DB query when broadcasting the reading unit.
            self._sensor_obj = Sensor.objects.get(id=value, is_active=True)
        except Sensor.DoesNotExist:
            raise serializers.ValidationError('Sensor not found or inactive.')
        return value

    def validate(self, data):
        # Expose the resolved sensor object alongside the validated data
        data['sensor'] = self._sensor_obj
        return data


class IoTBatchReadingSerializer(serializers.Serializer):
    """Allows the ESP32 to send all sensor readings in one HTTP request."""
    readings = IoTReadingSerializer(many=True)

    def validate_readings(self, value):
        if not value:
            raise serializers.ValidationError('At least one reading is required.')
        return value
