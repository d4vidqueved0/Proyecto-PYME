from django.urls import path
from . import views


urlpatterns = [

    path('', views.panel_control, name='panel_control'),
    path('personalizacion/', views.personalizacion, name='personalizacion'),
    path('inventario/', views.gestion_inventario, name='gestion_inventario'),
    path('servicios/', views.gestion_servicios, name='gestion_servicios'),
    path('citas/', views.gestion_citas, name='gestion_citas'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('obtener_tema/', views.obtener_tema, name='obtener_tema'),
    path('obtener_servicios/', views.obtener_servicios, name='obtener_servicios'),
    path('mis-citas/cancelar/<int:cita_id>/', views.cancelar_cita_cliente, name='cancelar_cita_cliente'),
    path('mi-cuenta/', views.cliente_home, name='cliente_home'),
    path('mi-cuenta/citas/', views.cliente_citas, name='cliente_citas'),
    path('mi-cuenta/datos/', views.cliente_datos, name='cliente_datos'),
]