from rest_framework import serializers
from apps.actuators.models import Actuator, Action


class ActuatorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Actuator
        fields = ['id', 'name', 'type', 'status', 'last_triggered_at', 'created_at']


class ActionSerializer(serializers.ModelSerializer):
    actuator_name       = serializers.CharField(source='actuator.name', read_only=True)
    actuator_type       = serializers.CharField(source='actuator.type', read_only=True)
    triggered_by_username = serializers.CharField(source='triggered_by.username', read_only=True, default=None)

    class Meta:
        model  = Action
        fields = [
            'id', 'actuator_id', 'actuator_name', 'actuator_type',
            'triggered_by_username', 'action_type', 'source', 'notes', 'triggered_at',
        ]


class TriggerActionSerializer(serializers.Serializer):
    """Input for POST /api/actuators/:id/action/"""
    action_type = serializers.ChoiceField(choices=Action.Type.choices)
    notes       = serializers.CharField(required=False, allow_blank=True, default='')
