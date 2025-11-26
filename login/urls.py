from django.urls import path
from . import views
from django.contrib.auth import views as views_reset

urlpatterns = [
    path('cerrar_sesion/', views.cerrar_sesion, name='cerrar_sesion'),
    path('login_registro/', views.login_registro, name='login_registro'),
    path('olvide_mi_contraseña/', views_reset.PasswordResetView.as_view(template_name='login/reset_contraseña.html'), name='password_reset'),
    path('olvide_mi_contraseña/enviado/', views_reset.PasswordResetDoneView.as_view(template_name='login/reset_enviado.html'), name='password_reset_done'),
    path('olvide_mi_contraseña/enviado/<uidb64>/<token>/', views_reset.PasswordResetConfirmView.as_view(template_name='login/reset_confirmado.html'), name='password_reset_confirm'),
    path('olvide_mi_contraseña/enviado/completado', views_reset.PasswordResetCompleteView.as_view(template_name='login/reset_completado.html'), name='password_reset_complete'),
    path('iniciar_sesion/', views.iniciar_sesion, name='iniciarSesion'),
    path('registrar_usuario/', views.registrar_usuario, name='registarUsuario'),
]