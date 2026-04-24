import uuid
from django.db import models
from apps.users.models import User


class Export(models.Model):
    class Type(models.TextChoices):
        SENSOR_READINGS = 'sensor_readings', 'Sensor Readings'
        ACTIONS         = 'actions',         'Actions'
        ALERTS          = 'alerts',          'Alerts'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exports')
    export_type = models.CharField(max_length=20, choices=Type.choices)
    filters     = models.JSONField(null=True, blank=True)  # e.g. {"from": "2025-01-01", "sensor_id": "..."}
    file_path   = models.TextField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'exports'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.export_type} export by {self.exported_by.username}'
