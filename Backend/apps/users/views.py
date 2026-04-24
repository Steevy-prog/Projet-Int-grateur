import bcrypt
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.models import User
from apps.users.permissions import IsAdmin
from apps.users.serializers import (
    UserListSerializer,
    UserCreateSerializer,
    UserPatchSerializer,
    PasswordResetSerializer,
)


class UserListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('created_at')
        return Response(UserListSerializer(users, many=True).data)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def _get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get(self, request, user_id):
        user = self._get_user(user_id)
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserListSerializer(user).data)

    def patch(self, request, user_id):
        user = self._get_user(user_id)
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from deactivating their own account
        if user.id == request.user.id and request.data.get('is_active') is False:
            return Response(
                {'detail': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(user, serializer.validated_data)
        return Response(UserListSerializer(user).data)


class PasswordResetView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_hash = bcrypt.hashpw(
            serializer.validated_data['new_password'].encode('utf-8'),
            bcrypt.gensalt(),
        ).decode('utf-8')

        user.password_hash = new_hash
        user.save(update_fields=['password_hash'])

        return Response({'detail': 'Password updated successfully.'})
