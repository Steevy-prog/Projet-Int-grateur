from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from apps.authentication.models import Session, AccessToken, RefreshToken
from apps.authentication.serializers import LoginSerializer, UserMeSerializer
from apps.authentication.utils import (
    generate_tokens, hash_token,
    set_refresh_cookie, clear_refresh_cookie,
)


class LoginView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user       = serializer.validated_data['user']
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Create session
        session = Session.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Generate tokens
        access_str, refresh_str, access_exp, refresh_exp = generate_tokens(user)

        # Persist hashed tokens
        AccessToken.objects.create(
            session=session,
            user=user,
            token_hash=hash_token(access_str),
            expires_at=access_exp,
        )
        RefreshToken.objects.create(
            session=session,
            user=user,
            token_hash=hash_token(refresh_str),
            expires_at=refresh_exp,
        )

        response = Response({
            'access_token': access_str,
            'user': UserMeSerializer(user).data,
        }, status=status.HTTP_200_OK)

        set_refresh_cookie(response, refresh_str)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # request.auth is the AccessToken instance (set by JWTAuthentication)
        token   = request.auth
        session = token.session
        now     = timezone.now()

        # Revoke all tokens in this session
        AccessToken.objects.filter(session=session, revoked_at__isnull=True).update(revoked_at=now)
        RefreshToken.objects.filter(session=session, revoked_at__isnull=True).update(revoked_at=now)

        # Revoke the session itself
        session.revoked_at = now
        session.save(update_fields=['revoked_at'])

        response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response)
        return response


class TokenRefreshView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    def post(self, request):
        raw_refresh = request.COOKIES.get('refresh_token')
        if not raw_refresh:
            return Response({'detail': 'Refresh token missing.'}, status=status.HTTP_401_UNAUTHORIZED)

        token_hash = hash_token(raw_refresh)

        try:
            old_token = (
                RefreshToken.objects
                .select_related('user', 'session')
                .get(token_hash=token_hash)
            )
        except RefreshToken.DoesNotExist:
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not old_token.is_valid:
            return Response({'detail': 'Refresh token expired or revoked.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not old_token.session.is_active:
            return Response({'detail': 'Session has been terminated.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = old_token.user
        now  = timezone.now()

        # Rotate: revoke old refresh token and old access tokens
        old_token.revoked_at = now
        old_token.last_used_at = now
        old_token.save(update_fields=['revoked_at', 'last_used_at'])

        AccessToken.objects.filter(
            session=old_token.session, revoked_at__isnull=True
        ).update(revoked_at=now)

        # Issue new token pair
        access_str, refresh_str, access_exp, refresh_exp = generate_tokens(user)

        AccessToken.objects.create(
            session=old_token.session,
            user=user,
            token_hash=hash_token(access_str),
            expires_at=access_exp,
        )
        RefreshToken.objects.create(
            session=old_token.session,
            user=user,
            token_hash=hash_token(refresh_str),
            expires_at=refresh_exp,
        )

        response = Response({'access_token': access_str}, status=status.HTTP_200_OK)
        set_refresh_cookie(response, refresh_str)
        return response
