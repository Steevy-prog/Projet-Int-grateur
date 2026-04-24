import uuid
from django.db import models
from apps.users.models import User


class ScriptLog(models.Model):
    class Source(models.TextChoices):
        CLI  = 'cli',  'CLI'
        AUTO = 'auto', 'Auto'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    executed_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='script_logs',
        db_column='executed_by'
    )
    command     = models.TextField()
    result      = models.TextField(null=True, blank=True)
    source      = models.CharField(max_length=5, choices=Source.choices, default=Source.CLI)
    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'script_logs'
        ordering = ['-executed_at']

    def __str__(self):
        return f'{self.command} @ {self.executed_at}'
