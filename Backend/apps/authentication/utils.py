import hashlib
import bcrypt
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


def hash_token(raw_token: str) -> str:
    """SHA-256 hash of a raw token string for safe DB storage."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a bcrypt password hash produced by PostgreSQL crypt()."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            stored_hash.encode('utf-8'),
        )
    except Exception:
        return False


def generate_tokens(user):
    """
    Generate a simplejwt access + refresh token pair for a user.
    Returns (access_token_str, refresh_token_str, access_expires_at, refresh_expires_at).
    """
    from django.utils import timezone

    refresh = RefreshToken()
    refresh['user_id'] = str(user.id)
    refresh['role'] = user.role

    access = refresh.access_token

    access_expires_at  = timezone.now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_expires_at = timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    return str(access), str(refresh), access_expires_at, refresh_expires_at


def set_refresh_cookie(response, refresh_token_str):
    """Set the refresh token as a secure httpOnly cookie."""
    max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        key='refresh_token',
        value=refresh_token_str,
        max_age=max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
    )


def clear_refresh_cookie(response):
    """Remove the refresh token cookie on logout."""
    response.delete_cookie('refresh_token')
