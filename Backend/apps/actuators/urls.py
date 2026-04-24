from django.urls import path
from apps.actuators.views import ActuatorListView, ActuatorActionView, ActuatorActionsView

urlpatterns = [
    path('',                          ActuatorListView.as_view(),    name='actuator-list'),
    path('actions/',                  ActuatorActionsView.as_view(), name='actuator-actions'),
    path('<uuid:actuator_id>/action/', ActuatorActionView.as_view(), name='actuator-action'),
]
