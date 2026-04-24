import uuid
from django.db import models
from apps.users.models import User


class Actuator(models.Model):
    class Type(models.TextChoices):
        PUMP        = 'pump',        'Pump'
        VENTILATION = 'ventilation', 'Ventilation'
        LIGHTING    = 'lighting',    'Lighting'

    class Status(models.TextChoices):
        ON  = 'on',  'On'
        OFF = 'off', 'Off'

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name             = models.CharField(max_length=100)
    type             = models.CharField(max_length=20, choices=Type.choices)
    status           = models.CharField(max_length=5, choices=Status.choices, default=Status.OFF)
    last_triggered_at = models.DateTimeField(null=True, blank=True)  # updated by DB trigger
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'actuators'

    def __str__(self):
        return f'{self.name} ({self.status})'


class Action(models.Model):
    class Type(models.TextChoices):
        TURN_ON  = 'turn_on',  'Turn On'
        TURN_OFF = 'turn_off', 'Turn Off'

    class Source(models.TextChoices):
        WEB  = 'web',  'Web'
        CLI  = 'cli',  'CLI'
        AUTO = 'auto', 'Auto'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actuator     = models.ForeignKey(Actuator, on_delete=models.CASCADE, related_name='actions')
    triggered_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='actions',
        db_column='triggered_by'
    )
    action_type  = models.CharField(max_length=10, choices=Type.choices)
    source       = models.CharField(max_length=5, choices=Source.choices)
    notes        = models.TextField(null=True, blank=True)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'actions'
        ordering = ['-triggered_at']

    def __str__(self):
        return f'{self.action_type} on {self.actuator.name} via {self.source}'
