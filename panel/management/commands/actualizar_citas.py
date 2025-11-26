from django.core.management.base import BaseCommand
from django.utils import timezone
from panel.models import Cita
from datetime import datetime, timedelta

class Command(BaseCommand):
    def handle(self, *args, **options):
        ahora = timezone.now()

        citas_pendientes = Cita.objects.filter(estado='Pendiente')
        contador = 0

        for cita in citas_pendientes:
            try:
                cita_dt_naive = datetime.combine(cita.fecha, cita.hora)

                cita_dt = timezone.make_aware(cita_dt_naive, timezone.get_current_timezone())
                limite_tolerancia = cita_dt + timedelta(hours=1)

                if ahora > limite_tolerancia:
                    cita.estado = 'Ausente'
                    cita.save()
                    contador += 1
            except Exception as e:
                print(f'Error procesando cita {cita.id}: {e}')
        if contador > 0:
           print(f'{contador} citas marcadas como ausentes')
        else:
            print('Ninguna cita marcada como Ausente')