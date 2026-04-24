import uuid
from django.db import models
from apps.users.models import User


class Session(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    ip_address       = models.CharField(max_length=45, null=True, blank=True)
    user_agent       = models.TextField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now_add=True)
    revoked_at       = models.DateTimeField(null=True, blank=True)  # NULL = still active

    class Meta:
        managed  = False
        db_table = 'sessions'

    @property
    def is_active(self):
        return self.revoked_at is None


class AccessToken(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session    = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='access_tokens')
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_tokens')
    token_hash = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)  # NULL = still valid

    class Meta:
        managed  = False
        db_table = 'access_tokens'

    @property
    def is_valid(self):
        from django.utils import timezone
        return self.revoked_at is None and self.expires_at > timezone.now()


class RefreshToken(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session      = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='refresh_tokens')
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token_hash   = models.TextField(unique=True)
    expires_at   = models.DateTimeField()
    created_at   = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at   = models.DateTimeField(null=True, blank=True)  # NULL = still valid

    class Meta:
        managed  = False
        db_table = 'refresh_tokens'

    @property
    def is_valid(self):
        from django.utils import timezone
        return self.revoked_at is None and self.expires_at > timezone.now()


class PasswordResetToken(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    used_at    = models.DateTimeField(null=True, blank=True)  # NULL = not yet used
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'password_reset_tokens'

    @property
    def is_valid(self):
        from django.utils import timezone
        return self.used_at is None and self.expires_at > timezone.now()
