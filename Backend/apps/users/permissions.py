from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Grants access only to authenticated users with role == 'admin'."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_active
            and request.user.role == 'admin'
        )
