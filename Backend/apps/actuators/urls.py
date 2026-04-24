from django.urls import path
from apps.actuators.views import ActuatorListView, ActuatorActionView

urlpatterns = [
    path('',                          ActuatorListView.as_view(),   name='actuator-list'),
    path('<uuid:actuator_id>/action/', ActuatorActionView.as_view(), name='actuator-action'),
]
