from django.urls import path
from apps.users.views import UserListCreateView, UserDetailView, PasswordResetView

urlpatterns = [
    path('',                          UserListCreateView.as_view(), name='user-list-create'),
    path('<uuid:user_id>/',           UserDetailView.as_view(),     name='user-detail'),
    path('<uuid:user_id>/reset-password/', PasswordResetView.as_view(), name='user-reset-password'),
]
