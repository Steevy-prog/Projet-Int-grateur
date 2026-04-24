from django.urls import path
from apps.sensors.views import (
    SensorListView,
    SensorDetailView,
    SensorReadingsView,
    SensorLatestView,
    ThresholdListView,
    ThresholdDetailView,
)

urlpatterns = [
    # Sensors
    path('',                              SensorListView.as_view(),    name='sensor-list'),
    path('<uuid:sensor_id>/',             SensorDetailView.as_view(),  name='sensor-detail'),
    path('<uuid:sensor_id>/readings/',    SensorReadingsView.as_view(), name='sensor-readings'),
    path('<uuid:sensor_id>/latest/',      SensorLatestView.as_view(),  name='sensor-latest'),

    # Thresholds — separate prefix /api/thresholds/ wired in config/urls.py
]

threshold_urlpatterns = [
    path('',               ThresholdListView.as_view(),              name='threshold-list'),
    path('<str:sensor_type>/', ThresholdDetailView.as_view(),        name='threshold-detail'),
]
