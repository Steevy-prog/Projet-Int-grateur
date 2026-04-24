import uuid
from django.db import models
from apps.users.models import User


class Sensor(models.Model):
    class Type(models.TextChoices):
        HUMIDITY    = 'humidity',    'Humidity'
        TEMPERATURE = 'temperature', 'Temperature'
        CO2         = 'co2',         'CO2'
        LUMINOSITY  = 'luminosity',  'Luminosity'
        WATER_LEVEL = 'water_level', 'Water Level'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=100)
    type       = models.CharField(max_length=20, choices=Type.choices)
    unit       = models.CharField(max_length=20)
    location   = models.CharField(max_length=150, null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'sensors'

    def __str__(self):
        return f'{self.name} ({self.type})'


class SensorReading(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sensor      = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='readings')
    value       = models.DecimalField(max_digits=10, decimal_places=4)
    measured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'sensor_readings'
        ordering = ['-measured_at']

    def __str__(self):
        return f'{self.sensor.name}: {self.value} @ {self.measured_at}'


class SensorStatusLog(models.Model):
    class Status(models.TextChoices):
        ONLINE  = 'online',  'Online'
        OFFLINE = 'offline', 'Offline'
        ERROR   = 'error',   'Error'

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sensor    = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='status_logs')
    status    = models.CharField(max_length=10, choices=Status.choices)
    reason    = models.TextField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'sensor_status_logs'
        ordering = ['-logged_at']


class Threshold(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sensor_type = models.CharField(max_length=20, choices=Sensor.Type.choices, unique=True)
    min_value   = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    max_value   = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    set_by      = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='thresholds',
        db_column='set_by'
    )
    updated_at  = models.DateTimeField()  # managed by DB trigger

    class Meta:
        managed  = False
        db_table = 'thresholds'

    def __str__(self):
        return f'Threshold({self.sensor_type}: {self.min_value}–{self.max_value})'
