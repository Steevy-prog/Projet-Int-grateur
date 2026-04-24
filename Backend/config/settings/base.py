from pathlib import Path
from urllib.parse import urlparse
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')


def _parse_db_url(url):
    p = urlparse(url)
    return {
        'NAME': p.path.lstrip('/'),
        'USER': p.username,
        'PASSWORD': p.password,
        'HOST': p.hostname,
        'PORT': str(p.port or 5432),
    }


INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    # Third-party
    'rest_framework',
    'corsheaders',
    'channels',
    # Project apps
    'apps.authentication',
    'apps.users',
    'apps.sensors',
    'apps.actuators',
    'apps.alerts',
    'apps.script_logs',
    'apps.exports',
    'apps.iot',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {'options': '-c search_path=public'},
        **_parse_db_url(config('DATABASE_URL')),
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://localhost:6379')],
        },
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.authentication.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'apps.authentication.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('ACCESS_TOKEN_LIFETIME_MINUTES', default=15, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('SECRET_KEY'),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ESP32 static API key — compared using hmac.compare_digest in IoT auth class
API_KEY_ESP32 = config('API_KEY_ESP32')

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
