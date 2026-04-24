from django.urls import path, include
from apps.sensors.urls import threshold_urlpatterns

urlpatterns = [
    path('api/auth/',        include('apps.authentication.urls')),
    path('api/users/',       include('apps.users.urls')),
    path('api/sensors/',     include('apps.sensors.urls')),
    path('api/thresholds/',  include((threshold_urlpatterns, 'thresholds'))),
    path('api/actuators/',   include('apps.actuators.urls')),
    path('api/alerts/',      include('apps.alerts.urls')),
    path('api/script-logs/', include('apps.script_logs.urls')),
    path('api/exports/',     include('apps.exports.urls')),
    path('api/iot/',         include('apps.iot.urls')),
]
