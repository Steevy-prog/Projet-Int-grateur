from rest_framework import serializers
from apps.script_logs.models import ScriptLog


class ScriptLogSerializer(serializers.ModelSerializer):
    executed_by_username = serializers.CharField(
        source='executed_by.username', read_only=True, default=None
    )

    class Meta:
        model  = ScriptLog
        fields = [
            'id', 'executed_by_username', 'command',
            'result', 'source', 'executed_at',
        ]


class ScriptLogCreateSerializer(serializers.Serializer):
    """Used by CLI scripts posting their own execution logs via API key auth."""
    command = serializers.CharField()
    result  = serializers.CharField(required=False, allow_blank=True, default='')
    source  = serializers.ChoiceField(choices=ScriptLog.Source.choices, default=ScriptLog.Source.CLI)

    def create(self, validated_data):
        return ScriptLog.objects.create(
            executed_by=self.context.get('user'),
            **validated_data,
        )
