import csv
import io


def build_sensor_readings_csv(filters: dict) -> str:
    from apps.sensors.models import SensorReading

    qs = SensorReading.objects.select_related('sensor').all()

    if filters.get('from_date'):
        qs = qs.filter(measured_at__gte=filters['from_date'])
    if filters.get('to_date'):
        qs = qs.filter(measured_at__lte=filters['to_date'])
    if filters.get('sensor_id'):
        qs = qs.filter(sensor_id=filters['sensor_id'])
    if filters.get('sensor_type'):
        qs = qs.filter(sensor__type=filters['sensor_type'])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'sensor_name', 'sensor_type', 'unit', 'location', 'value', 'measured_at'])

    for r in qs.iterator():
        writer.writerow([
            r.id,
            r.sensor.name,
            r.sensor.type,
            r.sensor.unit,
            r.sensor.location,
            r.value,
            r.measured_at.isoformat(),
        ])

    return output.getvalue()


def build_actions_csv(filters: dict) -> str:
    from apps.actuators.models import Action

    qs = Action.objects.select_related('actuator', 'triggered_by').all()

    if filters.get('from_date'):
        qs = qs.filter(triggered_at__gte=filters['from_date'])
    if filters.get('to_date'):
        qs = qs.filter(triggered_at__lte=filters['to_date'])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'actuator_name', 'actuator_type', 'action_type', 'source', 'triggered_by', 'notes', 'triggered_at'])

    for a in qs.iterator():
        writer.writerow([
            a.id,
            a.actuator.name,
            a.actuator.type,
            a.action_type,
            a.source,
            a.triggered_by.username if a.triggered_by else '',
            a.notes or '',
            a.triggered_at.isoformat(),
        ])

    return output.getvalue()


def build_alerts_csv(filters: dict) -> str:
    from apps.alerts.models import Alert

    qs = Alert.objects.select_related('sensor', 'actuator', 'acknowledged_by').all()

    if filters.get('from_date'):
        qs = qs.filter(triggered_at__gte=filters['from_date'])
    if filters.get('to_date'):
        qs = qs.filter(triggered_at__lte=filters['to_date'])
    if filters.get('severity'):
        qs = qs.filter(severity=filters['severity'])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'id', 'type', 'severity', 'message', 'sensor_name', 'actuator_name',
        'is_acknowledged', 'acknowledged_by', 'triggered_at', 'acknowledged_at',
    ])

    for a in qs.iterator():
        writer.writerow([
            a.id,
            a.type,
            a.severity,
            a.message,
            a.sensor.name  if a.sensor   else '',
            a.actuator.name if a.actuator else '',
            a.is_acknowledged,
            a.acknowledged_by.username if a.acknowledged_by else '',
            a.triggered_at.isoformat(),
            a.acknowledged_at.isoformat() if a.acknowledged_at else '',
        ])

    return output.getvalue()


BUILDERS = {
    'sensor_readings': build_sensor_readings_csv,
    'actions':         build_actions_csv,
    'alerts':          build_alerts_csv,
}
