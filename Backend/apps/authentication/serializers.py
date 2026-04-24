from rest_framework import serializers
from apps.users.models import User
from apps.authentication.utils import verify_password


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email    = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Same message for both wrong email and wrong password to prevent enumeration
            raise serializers.ValidationError('Invalid credentials.')

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')

        if not verify_password(password, user.password_hash):
            raise serializers.ValidationError('Invalid credentials.')

        data['user'] = user
        return data


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'role', 'language']
