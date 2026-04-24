import uuid
from django.db import models


class User(models.Model):
    class Role(models.TextChoices):
        ADMIN  = 'admin',  'Admin'
        VIEWER = 'viewer', 'Viewer'

    class Language(models.TextChoices):
        FR = 'fr', 'Français'
        EN = 'en', 'English'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username      = models.CharField(max_length=50, unique=True)
    email         = models.EmailField(max_length=150, unique=True)
    password_hash = models.TextField()
    role          = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)
    language      = models.CharField(max_length=2, choices=Language.choices, default=Language.FR)
    is_active     = models.BooleanField(default=True)
    created_by    = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_users',
        db_column='created_by'
    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField()  # managed by DB trigger

    class Meta:
        managed  = False
        db_table = 'users'

    def __str__(self):
        return self.username
