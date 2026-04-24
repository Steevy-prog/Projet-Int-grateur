from django.urls import path
from apps.iot.views import IoTReadingView

urlpatterns = [
    path('readings/', IoTReadingView.as_view(), name='iot-readings'),
]
