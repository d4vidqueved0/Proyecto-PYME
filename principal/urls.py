from django.urls import path
from . import views

urlpatterns = [

    path('', views.principal, name='principal'),
    path('obtener_imagenes/', views.obtener_imagenes_principal, name='obtener_imagenes'),
    path('obtener_info_negocio/', views.obtener_info_negocio, name='info_negocio'),
    path('agendar_cita/', views.agendar_cita, name='agendar_cita'),
    path('obtener_servicios/', views.obtener_servicios, name='obtener_servicios'),
    path('obtener_servicios/<int:servicio_id>/', views.obtener_detalle_servicio, name='detalles_servicio'),
    path('obtener_horario/', views.obtener_horario_dia, name='obtener_horario'),
    path('estado_login/', views.estado_login, name='estado_login'),
    path('obtener_cita_dia/<str:fecha>/', views.obtener_citas_dia, name='obtener_cita_dia'),
    path('cancelar_cita_correo/', views.cancelar_cita_correo, name='cancelar_cita_correo'),
]