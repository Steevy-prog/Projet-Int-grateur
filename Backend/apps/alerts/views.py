from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.alerts.models import Alert
from apps.alerts.serializers import AlertSerializer
from apps.users.permissions import IsAdmin


class AlertListView(APIView):
    """
    GET /api/alerts/
    Optional filters: ?severity=high&acknowledged=false&from=&to=
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = Alert.objects.select_related('sensor', 'actuator', 'acknowledged_by').all()

        severity     = request.query_params.get('severity')
        acknowledged = request.query_params.get('acknowledged')
        from_date    = request.query_params.get('from')
        to_date      = request.query_params.get('to')

        if severity:
            alerts = alerts.filter(severity=severity)

        if acknowledged is not None:
            is_ack = acknowledged.lower() == 'true'
            alerts = alerts.filter(is_acknowledged=is_ack)

        if from_date:
            alerts = alerts.filter(triggered_at__gte=from_date)
        if to_date:
            alerts = alerts.filter(triggered_at__lte=to_date)

        return Response(AlertSerializer(alerts, many=True).data)


class AlertAcknowledgeView(APIView):
    """POST /api/alerts/:id/acknowledge/ — admin only."""
    permission_classes = [IsAdmin]

    def post(self, request, alert_id):
        try:
            alert = Alert.objects.select_related('sensor', 'actuator').get(id=alert_id)
        except Alert.DoesNotExist:
            return Response({'detail': 'Alert not found.'}, status=status.HTTP_404_NOT_FOUND)

        if alert.is_acknowledged:
            return Response({'detail': 'Alert already acknowledged.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        alert.is_acknowledged  = True
        alert.acknowledged_by  = request.user
        alert.acknowledged_at  = now
        alert.save(update_fields=['is_acknowledged', 'acknowledged_by', 'acknowledged_at'])

        _broadcast_alert_acknowledged(alert)

        return Response(AlertSerializer(alert).data)


def _broadcast_alert_acknowledged(alert):
    """Push alert.acknowledged event to all connected WebSocket clients."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'dashboard',
        {
            'type':              'alert.acknowledged',
            'alert_id':          str(alert.id),
            'acknowledged_by':   alert.acknowledged_by.username,
            'acknowledged_at':   alert.acknowledged_at.isoformat(),
        },
    )
