from rest_framework import serializers
from .models import Servicio, Negocio, Tema, Cita, HorarioAtencion, Insumo
from login.models import Usuario
from principal.models import Imagen
from login.models import Usuario

class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio

        fields = '__all__'


class ImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imagen

        fields = ['id', 'titulo', 'imagen', 'categoria']

class NegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio

        fields = ['id', 'nombre', 'descripcion', 'direccion', 'telefono', 'email']

class TemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tema

        fields = ['id', 'nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model= Usuario

        fields = ['id', 'first_name', 'email']


        
class CitaSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()
    servicio = ServicioSerializer()


    class Meta:
        model = Cita
    
        fields = '__all__'

class HorarioAtencioSerializer(serializers.ModelSerializer):

    class Meta:
        model = HorarioAtencion
    
        fields = '__all__'

class InsumoSerializer(serializers.ModelSerializer):

    servicios = serializers.PrimaryKeyRelatedField(
        queryset=Servicio.objects.all(),
        many=True
    )
    class Meta:
        model = Insumo

        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
    
        fields = ['id', 'first_name', 'email', 'date_joined', 'is_superuser']