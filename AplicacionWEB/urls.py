"""
URL configuration for AplicacionWEB project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from panel import views as views_panel

router = DefaultRouter()

router.register(r'servicios', views_panel.ServicioViewSet, basename='servicio-api')
router.register(r'imagenes', views_panel.ImagenViewSet, basename='imagen-api')
router.register(r'negocio', views_panel.NegocioViewSet, basename='negocio-api')
router.register(r'tema', views_panel.TemaViewSet, basename='tema-api')
router.register(r'cita', views_panel.CitaViewSet, basename='cita-api')
router.register(r'horario_negocio', views_panel.HorarioAtencionViewSet, basename='horario_atencion-api')
router.register(r'insumo', views_panel.InsumoViewSet, basename='insumo-api'),
router.register(r'usuario', views_panel.UsuarioViewSet, basename='usuario-api'),


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('login.urls')),
    path('', include('principal.urls')),
    path('panel/', include('panel.urls')),
    path('api/', include(router.urls)),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)