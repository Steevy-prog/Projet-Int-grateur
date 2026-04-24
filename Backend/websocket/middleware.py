from urllib.parse import parse_qs
from django.utils import timezone
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


class JWTAuthMiddleware(BaseMiddleware):
    """
    Reads the access token from the WebSocket query string:
        ws://domain/ws/dashboard/?token=<access_token>

    WebSocket connections cannot send custom headers after the HTTP upgrade,
    so the token is passed as a query parameter instead.

    Sets scope['user'] to the authenticated User, or None if invalid.
    """

    async def __call__(self, scope, receive, send):
        token_str = _extract_token(scope)

        if token_str:
            scope['user'] = await _resolve_user(token_str)
        else:
            scope['user'] = None

        return await super().__call__(scope, receive, send)


def _extract_token(scope):
    query_string = scope.get('query_string', b'').decode('utf-8')
    params       = parse_qs(query_string)
    tokens       = params.get('token', [])
    return tokens[0] if tokens else None


@database_sync_to_async
def _resolve_user(raw_token):
    from apps.authentication.utils import hash_token
    from apps.authentication.models import AccessToken

    try:
        token = (
            AccessToken.objects
            .select_related('user', 'session')
            .get(token_hash=hash_token(raw_token))
        )
    except AccessToken.DoesNotExist:
        return None

    if token.revoked_at is not None:
        return None
    if token.expires_at <= timezone.now():
        return None
    if not token.session.is_active:
        return None
    if not token.user.is_active:
        return None

    return token.user


def JWTAuthMiddlewareStack(inner):
    """Wraps the inner application with JWT auth middleware."""
    return JWTAuthMiddleware(inner)
