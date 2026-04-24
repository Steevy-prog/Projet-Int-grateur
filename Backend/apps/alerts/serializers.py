from rest_framework import serializers
from apps.alerts.models import Alert


class AlertSerializer(serializers.ModelSerializer):
    sensor_name             = serializers.CharField(source='sensor.name',    read_only=True, default=None)
    sensor_type             = serializers.CharField(source='sensor.type',    read_only=True, default=None)
    sensor_location         = serializers.CharField(source='sensor.location', read_only=True, default=None)
    actuator_name           = serializers.CharField(source='actuator.name',  read_only=True, default=None)
    actuator_type           = serializers.CharField(source='actuator.type',  read_only=True, default=None)
    acknowledged_by_username = serializers.CharField(
        source='acknowledged_by.username', read_only=True, default=None
    )

    class Meta:
        model  = Alert
        fields = [
            'id', 'type', 'message', 'severity', 'is_acknowledged',
            'triggered_at', 'acknowledged_at', 'acknowledged_by_username',
            'sensor_name', 'sensor_type', 'sensor_location',
            'actuator_name', 'actuator_type',
        ]
