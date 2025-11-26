from django import forms
from panel.models import Cita
from panel.models import Cita, HorarioAtencion



class CitaForm(forms.ModelForm):

    class Meta:
        model = Cita
        fields= ['fecha', 'hora', 'servicio']
        

    def clean(self):
        cleaned_data = super().clean()
        fecha = cleaned_data.get('fecha')
        hora = cleaned_data.get('hora')

        if fecha and hora:
            cita_existente = Cita.objects.filter(
                fecha=fecha, hora=hora
            ).exclude(estado='Cancelada').exists()

            if cita_existente:
                self.add_error('hora', 'Lo sentimos, este horario ya fue reservado.')
                return cleaned_data 

        
            horario_negocio = HorarioAtencion.objects.get(id=1)
            dia_semana_num = fecha.weekday()
            
            mapa_dias = {
                0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves',
                4: 'viernes', 5: 'sabado', 6: 'domingo'
            }
            nombre_dia = mapa_dias[dia_semana_num]

            apertura = getattr(horario_negocio, f'{nombre_dia}_inicio')
            cierre = getattr(horario_negocio, f'{nombre_dia}_fin')

            if not apertura or not cierre:
                self.add_error('fecha', 'El negocio está cerrado este día')
                return cleaned_data

            if hora < apertura or hora >= cierre:
                self.add_error('hora', f'El negocio está cerrado a esa hora')
                return cleaned_data 
                
         

        return cleaned_data