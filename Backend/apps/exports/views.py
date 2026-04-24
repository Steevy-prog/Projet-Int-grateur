from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.exports.models import Export
from apps.exports.serializers import ExportSerializer, ExportCreateSerializer
from apps.exports.csv_builder import BUILDERS


class ExportListCreateView(APIView):
    """
    GET  /api/exports/ — list past exports for the current user
    POST /api/exports/ — generate and stream a new CSV export
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exports = Export.objects.filter(exported_by=request.user).select_related('exported_by')
        return Response(ExportSerializer(exports, many=True).data)

    def post(self, request):
        serializer = ExportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data        = serializer.validated_data
        export_type = data['export_type']

        # Build the filters dict to store in JSONB and pass to the builder
        filters = {}
        for key in ('from_date', 'to_date', 'sensor_id', 'sensor_type', 'severity'):
            val = data.get(key)
            if val is not None:
                filters[key] = str(val)

        # Generate CSV content
        builder     = BUILDERS[export_type]
        csv_content = builder(filters)

        # Record the export in the DB (file_path left null — streamed directly)
        Export.objects.create(
            exported_by=request.user,
            export_type=export_type,
            filters=filters or None,
        )

        # Stream CSV directly to the client
        filename = f'agrismart_{export_type}.csv'
        response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
