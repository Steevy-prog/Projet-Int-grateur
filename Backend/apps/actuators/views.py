from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.actuators.models import Actuator, Action
from apps.actuators.serializers import ActuatorSerializer, ActionSerializer, TriggerActionSerializer
from apps.users.permissions import IsAdmin

from websocket.events import DASHBOARD_GROUP, ACTUATOR_UPDATED


class ActuatorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        actuators = Actuator.objects.all().order_by('created_at')
        return Response(ActuatorSerializer(actuators, many=True).data)


class ActuatorActionView(APIView):
    """POST /api/actuators/:id/action/ — admin only, triggers on/off."""
    permission_classes = [IsAdmin]

    def post(self, request, actuator_id):
        try:
            actuator = Actuator.objects.get(id=actuator_id)
        except Actuator.DoesNotExist:
            return Response({'detail': 'Actuator not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TriggerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = Action.objects.create(
            actuator=actuator,
            triggered_by=request.user,
            action_type=serializer.validated_data['action_type'],
            source=Action.Source.WEB,
            notes=serializer.validated_data.get('notes', ''),
        )

        # trg_actuator_on_action DB trigger updates actuator.status + last_triggered_at.
        # Refresh to get those trigger-managed values before broadcasting.
        actuator.refresh_from_db()

        _broadcast_actuator_update(actuator)

        return Response({
            'action':   ActionSerializer(action).data,
            'actuator': ActuatorSerializer(actuator).data,
        }, status=status.HTTP_201_CREATED)


def _broadcast_actuator_update(actuator):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        DASHBOARD_GROUP,
        {
            'type':              ACTUATOR_UPDATED,
            'actuator_id':       str(actuator.id),
            'status':            actuator.status,
            'last_triggered_at': (
                actuator.last_triggered_at.isoformat()
                if actuator.last_triggered_at else None
            ),
        },
    )
