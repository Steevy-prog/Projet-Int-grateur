from django.urls import path
from apps.exports.views import ExportListCreateView

urlpatterns = [
    path('', ExportListCreateView.as_view(), name='export-list-create'),
]
