from django.contrib import admin
from .models import Insumo, Servicio, Cita

# Register your models here.

admin.site.register(Insumo)
admin.site.register(Servicio)

admin.site.register(Cita)