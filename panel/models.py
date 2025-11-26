from datetime import time
from django.db import models
from login.models import Usuario

# Create your models here.


class Insumo(models.Model):

    nombre = models.CharField(max_length=50, unique=True)
    cantidad = models.PositiveIntegerField()
    costo = models.PositiveIntegerField()
    UNIDADES = [
        ("Unidad", "Unidad"),
        ("Kilogramo", "Kilogramo"),
        ("Gramo", "Gramo"),
        ("Litro", "Litro"),
        ("Mililitro", "Mililitro"),
        ("Metro", "Metro"),
        ("Centímetro", "Centímetro"),
        ("Milímetro", "Milímetro"),
        ("Paquete", "Paquete"),
        ("Caja", "Caja"),
    ]
    stock_minimo = models.PositiveIntegerField()
    unidad = models.CharField(max_length=10, choices=UNIDADES)

    def __str__(self):
        return self.nombre


class Servicio(models.Model):

    Estados = [("Activo", "Activo"), ("Inactivo", "Inactivo")]

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=200)
    icono = models.CharField(max_length=50, blank=True)
    estado = models.CharField(choices=Estados, max_length=20)
    valor = models.PositiveIntegerField()
    insumos = models.ManyToManyField(Insumo, blank=True, related_name="servicios")

    def __str__(self):
        return self.nombre


class Tema(models.Model):

    nombre = models.CharField(max_length=20)


class Negocio(models.Model):

    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=1000)
    direccion = models.CharField(max_length=100)
    telefono = models.CharField(max_length=12)
    email = models.EmailField(max_length=50)

    def __str__(self):
        return self.nombre


class Cita(models.Model):

    Estados = [
        ("Pendiente", "Pendiente"),
        ("Cancelada", "Cancelada"),
        ("Asistida", "Asistida"),
        ("Ausente", "Ausente"),
    ]
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(choices=Estados, default="Pendiente")
    cancelado_por_usuario = models.BooleanField(default=False)
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    def __str__(self):
        return f"Cita {self.id}"


class HorarioAtencion(models.Model):
    negocio = models.OneToOneField("Negocio", on_delete=models.CASCADE)

    lunes_inicio = models.TimeField(null=True, blank=True)
    lunes_fin = models.TimeField(null=True, blank=True)
    martes_inicio = models.TimeField(null=True, blank=True)
    martes_fin = models.TimeField(null=True, blank=True)
    miercoles_inicio = models.TimeField(null=True, blank=True)
    miercoles_fin = models.TimeField(null=True, blank=True)
    jueves_inicio = models.TimeField(null=True, blank=True)
    jueves_fin = models.TimeField(null=True, blank=True)
    viernes_inicio = models.TimeField(null=True, blank=True)
    viernes_fin = models.TimeField(null=True, blank=True)
    sabado_inicio = models.TimeField(null=True, blank=True)
    sabado_fin = models.TimeField(null=True, blank=True)
    domingo_inicio = models.TimeField(null=True, blank=True)
    domingo_fin = models.TimeField(null=True, blank=True)

    def __str__(self):
        return "Horario del negocio " + self.negocio.nombre
