from django.urls import path
from apps.alerts.views import AlertListView, AlertAcknowledgeView

urlpatterns = [
    path('',                          AlertListView.as_view(),        name='alert-list'),
    path('<uuid:alert_id>/acknowledge/', AlertAcknowledgeView.as_view(), name='alert-acknowledge'),
]
