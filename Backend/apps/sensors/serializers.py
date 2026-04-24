from rest_framework import serializers
from apps.sensors.models import Sensor, SensorReading, SensorStatusLog, Threshold


class SensorStatusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SensorStatusLog
        fields = ['id', 'status', 'reason', 'logged_at']


class SensorSerializer(serializers.ModelSerializer):
    latest_value    = serializers.SerializerMethodField()
    latest_read_at  = serializers.SerializerMethodField()
    last_status     = serializers.SerializerMethodField()

    class Meta:
        model  = Sensor
        fields = [
            'id', 'name', 'type', 'unit', 'location', 'is_active',
            'created_at', 'latest_value', 'latest_read_at', 'last_status',
        ]

    def get_latest_value(self, obj):
        reading = obj.readings.first()  # ordered by -measured_at
        return float(reading.value) if reading else None

    def get_latest_read_at(self, obj):
        reading = obj.readings.first()
        return reading.measured_at if reading else None

    def get_last_status(self, obj):
        log = obj.status_logs.first()  # ordered by -logged_at
        return log.status if log else 'unknown'


class SensorReadingSerializer(serializers.ModelSerializer):
    sensor_name = serializers.CharField(source='sensor.name', read_only=True)
    sensor_type = serializers.CharField(source='sensor.type', read_only=True)
    sensor_unit = serializers.CharField(source='sensor.unit', read_only=True)

    class Meta:
        model  = SensorReading
        fields = ['id', 'sensor_id', 'sensor_name', 'sensor_type', 'sensor_unit', 'value', 'measured_at']


class ThresholdSerializer(serializers.ModelSerializer):
    set_by_username = serializers.CharField(source='set_by.username', read_only=True, default=None)

    class Meta:
        model  = Threshold
        fields = ['id', 'sensor_type', 'min_value', 'max_value', 'set_by_username', 'updated_at']


class ThresholdPatchSerializer(serializers.Serializer):
    min_value = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True, required=False)
    max_value = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True, required=False)

    def validate(self, data):
        min_v = data.get('min_value')
        max_v = data.get('max_value')
        if min_v is not None and max_v is not None and min_v >= max_v:
            raise serializers.ValidationError('min_value must be less than max_value.')
        return data

    def update(self, instance, validated_data):
        from django.utils import timezone
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.set_by    = self.context['request'].user
        instance.updated_at = timezone.now()
        instance.save(update_fields=[*validated_data.keys(), 'set_by', 'updated_at'])
        return instance
