from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.authentication.models import AccessToken
from apps.authentication.utils import hash_token


class JWTAuthentication(BaseAuthentication):
    """
    Reads Authorization: Bearer <token>, hashes it, looks it up in
    access_tokens table, validates expiry and revocation status.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return None  # Let other authenticators try or return 401

        raw_token = auth_header.split(' ', 1)[1].strip()
        if not raw_token:
            return None

        token_hash = hash_token(raw_token)

        try:
            token = (
                AccessToken.objects
                .select_related('user', 'session')
                .get(token_hash=token_hash)
            )
        except AccessToken.DoesNotExist:
            raise AuthenticationFailed('Invalid or unrecognised token.')

        if token.revoked_at is not None:
            raise AuthenticationFailed('Token has been revoked.')

        if token.expires_at <= timezone.now():
            raise AuthenticationFailed('Token has expired.')

        if not token.session.is_active:
            raise AuthenticationFailed('Session has been terminated.')

        if not token.user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        return (token.user, token)

    def authenticate_header(self, request):
        return 'Bearer'
