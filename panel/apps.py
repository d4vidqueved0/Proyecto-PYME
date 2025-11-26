from django.apps import AppConfig
from django.db.models.signals import post_migrate
import sys

def crear_datos_iniciales(sender, **kwargs):
    from .models import Negocio, HorarioAtencion, Tema


    Tema.objects.get_or_create(nombre='claro')

    if not Negocio.objects.exists():
        negocio = Negocio.objects.create(
            id=1,
            nombre="Mi Pyme",
            direccion='Por defecto',
            telefono="99999999",
            email="admin@pyme.com",
            descripcion="Lorem ipsum dolor sit amet consectetur adipiscing elit taciti mi feugiat, varius id justo ligula dignissim commodo laoreet nulla maecenas, fusce vehicula purus risus sed blandit natoque lacus semper. Ad pulvinar vel eget ultrices urna sagittis, tellus nec parturient condimentum massa, cursus sociosqu tempus convallis mattis. Ridiculus himenaeos elementum a lacinia mattis ligula enim tempor, taciti habitant urna tristique suscipit libero quam sagittis, euismod vivamus facilisis maecenas iaculis aliquam nibh.",
        )
    else:
        negocio = Negocio.objects.get(id=1)

    if not HorarioAtencion.objects.filter(negocio=negocio).exists():
        HorarioAtencion.objects.create(
            negocio=negocio,
            lunes_inicio="09:00", lunes_fin="18:00",
            martes_inicio="09:00", martes_fin="18:00",
            miercoles_inicio="09:00", miercoles_fin="18:00",
            jueves_inicio="09:00", jueves_fin="18:00",
            viernes_inicio="09:00", viernes_fin="18:00",
            sabado_inicio="10:00", sabado_fin="14:00",
            domingo_inicio="00:00", domingo_fin="00:00",

        )

class PanelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'panel'

    def ready(self):
        post_migrate.connect(crear_datos_iniciales, sender=self)
        if 'makemigrations' in sys.argv or 'migrate' in sys.argv:
            return
