from django import forms
from principal.models import Imagen
from .models import Servicio



class ImagenForm(forms.ModelForm):

    class Meta:
        model = Imagen
        fields= ('imagen',)

class ServicioForm(forms.ModelForm):

    class Meta:
        model= Servicio
        
        fields= '__all__'