import uuid
from django.db import models
from apps.users.models import User
from apps.sensors.models import Sensor
from apps.actuators.models import Actuator


class Alert(models.Model):
    class Type(models.TextChoices):
        LOW_HUMIDITY    = 'low_humidity',    'Low Humidity'
        HIGH_TEMPERATURE = 'high_temperature', 'High Temperature'
        LOW_TEMPERATURE  = 'low_temperature',  'Low Temperature'
        HIGH_CO2        = 'high_co2',        'High CO2'
        LOW_WATER_LEVEL = 'low_water_level', 'Low Water Level'
        LOW_LUMINOSITY  = 'low_luminosity',  'Low Luminosity'
        SENSOR_FAILURE  = 'sensor_failure',  'Sensor Failure'

    class Severity(models.TextChoices):
        LOW    = 'low',    'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH   = 'high',   'High'

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sensor          = models.ForeignKey(
        Sensor, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='alerts'
    )
    actuator        = models.ForeignKey(
        Actuator, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='alerts'
    )
    type            = models.CharField(max_length=20, choices=Type.choices)
    message         = models.TextField()
    severity        = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MEDIUM)
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='acknowledged_alerts',
        db_column='acknowledged_by'
    )
    triggered_at    = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed  = False
        db_table = 'alerts'
        ordering = ['-triggered_at']

    def __str__(self):
        return f'[{self.severity}] {self.type} @ {self.triggered_at}'
