import hmac
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class APIKeyAuthentication(BaseAuthentication):
    """
    Authenticates ESP32 requests via a static API key in the X-API-Key header.
    Returns a sentinel (None, True) so DRF treats the request as authenticated
    without a user object — permission is then enforced by HasValidAPIKey.
    """

    def authenticate(self, request):
        incoming_key = request.headers.get('X-API-Key', '')

        if not incoming_key:
            return None  # Let other authenticators try

        expected_key = settings.API_KEY_ESP32

        if not hmac.compare_digest(incoming_key, expected_key):
            raise AuthenticationFailed('Invalid API key.')

        # Return (user=None, auth=True) — no user object for machine clients
        return (None, True)

    def authenticate_header(self, request):
        return 'X-API-Key'


class HasValidAPIKey:
    """
    DRF permission class that allows access only when APIKeyAuthentication
    has validated the key (i.e. request.auth is True).
    """

    def has_permission(self, request, view):
        return request.auth is True
