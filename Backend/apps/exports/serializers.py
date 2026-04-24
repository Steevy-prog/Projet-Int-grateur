from rest_framework import serializers
from apps.exports.models import Export


class ExportSerializer(serializers.ModelSerializer):
    exported_by_username = serializers.CharField(source='exported_by.username', read_only=True)

    class Meta:
        model  = Export
        fields = ['id', 'exported_by_username', 'export_type', 'filters', 'file_path', 'created_at']


class ExportCreateSerializer(serializers.Serializer):
    export_type = serializers.ChoiceField(choices=Export.Type.choices)
    from_date   = serializers.DateTimeField(required=False)
    to_date     = serializers.DateTimeField(required=False)
    sensor_id   = serializers.UUIDField(required=False)
    sensor_type = serializers.CharField(required=False)
    severity    = serializers.CharField(required=False)

    def validate(self, data):
        from_date = data.get('from_date')
        to_date   = data.get('to_date')
        if from_date and to_date and from_date >= to_date:
            raise serializers.ValidationError('from_date must be before to_date.')
        return data
