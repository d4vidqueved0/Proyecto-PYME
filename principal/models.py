from django.db import models

# Create your models here.

class Imagen(models.Model):

    titulo = models.CharField(max_length=50, null=True)
    imagen = models.ImageField(upload_to='imagenes/')
    categoria = models.CharField(max_length=50, default='carrusel')

    def __str__(self):
        return f'Imagen {self.id}'