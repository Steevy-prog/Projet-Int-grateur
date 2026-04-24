from django.urls import path
from apps.script_logs.views import ScriptLogListView

urlpatterns = [
    path('', ScriptLogListView.as_view(), name='script-log-list'),
]
