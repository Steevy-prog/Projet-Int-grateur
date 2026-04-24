import logging
import paho.mqtt.client as mqtt
from django.conf import settings

logger = logging.getLogger(__name__)


def build_client(on_message):
    """
    Create, configure, and connect a paho MQTT client.
    The caller supplies the on_message callback and then calls client.loop_forever().
    """
    client = mqtt.Client(
        client_id=settings.MQTT_CLIENT_ID,
        clean_session=True,
        protocol=mqtt.MQTTv311,
    )

    if settings.MQTT_USERNAME:
        client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

    client.on_connect    = _on_connect
    client.on_disconnect = _on_disconnect
    client.on_message    = on_message

    # Exponential back-off: retry every 2s → up to 60s between attempts
    client.reconnect_delay_set(min_delay=2, max_delay=60)

    client.connect(
        host=settings.MQTT_BROKER_HOST,
        port=settings.MQTT_BROKER_PORT,
        keepalive=60,
    )

    return client


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        prefix = settings.MQTT_TOPIC_PREFIX
        client.subscribe(f'{prefix}/readings/#', qos=1)
        client.subscribe(f'{prefix}/status/#',   qos=1)
        logger.info(
            'MQTT connected. Subscribed to %s/readings/# and %s/status/#',
            prefix, prefix,
        )
    else:
        # rc codes: 1=bad protocol, 2=bad client id, 3=broker unavailable,
        #           4=bad credentials, 5=not authorised
        logger.error('MQTT connection refused (rc=%d).', rc)


def _on_disconnect(client, userdata, rc):
    if rc != 0:
        logger.warning('MQTT disconnected unexpectedly (rc=%d). Will retry.', rc)
    else:
        logger.info('MQTT disconnected cleanly.')
