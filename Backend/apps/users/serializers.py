import bcrypt
from rest_framework import serializers
from apps.users.models import User


class UserListSerializer(serializers.ModelSerializer):
    """Used for list and detail responses — never exposes password_hash."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default=None)

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'role', 'language',
            'is_active', 'created_by_username', 'created_at', 'updated_at',
        ]


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    email    = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    role     = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.VIEWER)
    language = serializers.ChoiceField(choices=User.Language.choices, default=User.Language.FR)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def create(self, validated_data):
        plain_password = validated_data.pop('password')
        password_hash  = bcrypt.hashpw(
            plain_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        from django.utils import timezone
        return User.objects.create(
            **validated_data,
            password_hash=password_hash,
            created_by=self.context['request'].user,
            updated_at=timezone.now(),
        )


class UserPatchSerializer(serializers.Serializer):
    """Admin can update role, language, and active status only."""
    role      = serializers.ChoiceField(choices=User.Role.choices, required=False)
    language  = serializers.ChoiceField(choices=User.Language.choices, required=False)
    is_active = serializers.BooleanField(required=False)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(validated_data.keys()))
        return instance


class PasswordResetSerializer(serializers.Serializer):
    """Admin generates a one-time reset token for a user."""
    new_password = serializers.CharField(write_only=True, min_length=8)
