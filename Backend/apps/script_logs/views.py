import hmac
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.script_logs.models import ScriptLog
from apps.script_logs.serializers import ScriptLogSerializer, ScriptLogCreateSerializer
from apps.users.permissions import IsAdmin


class ScriptLogListView(APIView):
    """
    GET  /api/script-logs/ — admin only, with optional filters
    POST /api/script-logs/ — CLI scripts post their execution record (API key auth)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return []  # Auth handled manually via API key below
        return [IsAdmin()]

    def get(self, request):
        logs = ScriptLog.objects.select_related('executed_by').all()

        from_date = request.query_params.get('from')
        to_date   = request.query_params.get('to')

        if from_date:
            logs = logs.filter(executed_at__gte=from_date)
        if to_date:
            logs = logs.filter(executed_at__lte=to_date)

        return Response(ScriptLogSerializer(logs, many=True).data)

    def post(self, request):
        # CLI scripts authenticate with the same static API key as the ESP32
        incoming_key = request.headers.get('X-API-Key', '')
        expected_key = settings.API_KEY_ESP32

        if not hmac.compare_digest(incoming_key, expected_key):
            return Response({'detail': 'Invalid API key.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Optionally resolve a user from the request body if provided
        user = None
        user_id = request.data.get('executed_by')
        if user_id:
            from apps.users.models import User
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass

        serializer = ScriptLogCreateSerializer(
            data=request.data,
            context={'user': user},
        )
        serializer.is_valid(raise_exception=True)
        log = serializer.save()

        return Response(ScriptLogSerializer(log).data, status=status.HTTP_201_CREATED)
