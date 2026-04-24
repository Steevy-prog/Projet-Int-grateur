"""
Django management command: starts the MQTT subscriber.

Usage:
    python manage.py mqtt_subscriber

This process should run alongside Daphne (the ASGI server).
In production, manage it with a process supervisor (e.g. Supervisor, systemd, or
a second Procfile worker dyno).

  Procfile example:
    web:    daphne -b 0.0.0.0 -p $PORT config.asgi:application
    worker: python manage.py mqtt_subscriber
"""
import logging
import signal
import sys

from django.core.management.base import BaseCommand

from apps.iot.mqtt_client import build_client
from apps.iot.handler     import process_message

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe to the MQTT broker and ingest sensor readings into the database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting MQTT subscriber…'))
        logger.info('MQTT subscriber starting.')

        client = build_client(on_message=process_message)

        # Allow graceful shutdown on SIGTERM (e.g. from Heroku / Docker / systemd)
        def _shutdown(signum, frame):
            self.stdout.write(self.style.WARNING('\nSIGTERM received — disconnecting.'))
            client.disconnect()
            sys.exit(0)

        signal.signal(signal.SIGTERM, _shutdown)

        try:
            # Blocking call — paho handles reconnects internally
            client.loop_forever(retry_first_connection=True)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Interrupted by user — disconnecting.'))
        finally:
            client.disconnect()
            logger.info('MQTT subscriber stopped.')
