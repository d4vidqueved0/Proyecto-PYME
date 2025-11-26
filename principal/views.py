"""Vistas de la app principal """

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import render

from panel.models import Servicio, Negocio, HorarioAtencion, Cita
from .forms import CitaForm
from .models import Imagen


def principal(_request):
    """ Renderiza el template principal """
    return render(_request, 'principal/principal.html')


def obtener_imagenes_principal(_request):
    """ Obtener las imagenes para agregarlas al carrusel """
    imagenes = Imagen.objects.all()  # pylint: disable=no-member
    lista_imagenes = [{'titulo': img.titulo, 'url': img.imagen.url} for img in imagenes]
    return JsonResponse(lista_imagenes, safe=False)


def obtener_info_negocio(_request):
    """Obtener información del negocio"""
    info = Negocio.objects.get(id=1)  # pylint: disable=no-member
    dicc_info = {
        'nombre': info.nombre,
        'descripcion': info.descripcion,
        'direccion': info.direccion,
        'telefono': info.telefono,
        'email': info.email,
    }
    return JsonResponse(dicc_info, safe=False)


def cancelar_cita_correo(request):
    if request.method == 'POST':
        asunto = request.POST.get('asunto')
        mensaje = request.POST.get('mensaje')
        destinatario = request.POST.get('destinatario')
        id = request.POST.get('id_cita')
        print(mensaje, asunto, destinatario)
        try:
            send_mail(

                subject= asunto,
                message= mensaje,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinatario],
                fail_silently=False,
            )
            cita = Cita.objects.get(id=id)
            cita.estado = 'Cancelada'
            cita.save()
        except Exception as error:
            print('Error', error)
        return JsonResponse('Se canceló la cita y se le notificó al cliente correctamente', safe=False)
    
    return JsonResponse('errores', status=400, safe=False)

@login_required
def agendar_cita(request):
    """Agendar una cita y envíar confirmación por correo """
    if request.method == 'GET':
        return render(request, 'principal/agendar_cita.html')

    form = CitaForm(request.POST)
    if form.is_valid():
        cita = form.save(commit=False)
        cita.usuario = request.user
        servicio_id = request.POST.get('servicio')
        servicio = Servicio.objects.get(id=servicio_id)  # pylint: disable=no-member
        cita.servicio = servicio
        cita.save()
        ubicacion = Negocio.objects.get(id=1)  # pylint: disable=no-member
        try:
            send_mail(
                subject='Confirmación de cita',
                message=(
                    f'Hola {request.user.first_name},\n\n'
                    f'Tu cita para el servicio "{servicio.nombre}" '
                    f'ha sido agendada correctamente.\n\n'
                    f'Fecha: {cita.fecha}\nHora: {cita.hora}\n'
                    f'Ubicación: {ubicacion.direccion}\n\n'
                    'Gracias por preferirnos.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=False,
            )
        except Exception as error:  # pylint: disable=broad-exception-caught
            print("Error al enviar correo:", error)

        return JsonResponse('Se agendó la cita correctamente', safe=False)

    errores = dict(form.errors.items())
    return JsonResponse(errores, status=400, safe=False)


def obtener_servicios(request):
    """Retorna todos los servicios """
    if request.method == 'GET':
        servicios = Servicio.objects.all().values()  # pylint: disable=no-member
        return JsonResponse(list(servicios), safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def obtener_detalle_servicio(request, servicio_id):
    """ Detalle de un servicio específico """
    if request.method == 'GET':
        servicio = Servicio.objects.filter(id=servicio_id).values().first()  # pylint: disable=no-member
        return JsonResponse(servicio, safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def obtener_horario_dia(request):
    """ Obtener horario de atencion """
    if request.method == 'GET':
        horario = HorarioAtencion.objects.filter(id=1).values().first()  # pylint: disable=no-member
        return JsonResponse(horario, safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def estado_login(request):
    """ Verificar si el usuario está autenticado """
    if request.method == 'GET':
        if request.user.is_authenticated:
            return JsonResponse({'estado': True}, safe=False)
        return JsonResponse({'estado': False}, safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def obtener_citas_dia(request, fecha):
    """ Obtener citas por fecha para marcar las citas ocupadas """
    if request.method == 'GET':
        lista_horas = []
        citas_filtradas = Cita.objects.filter(fecha=fecha).values()
        for cita in list(citas_filtradas):
            if cita['estado'] != 'Cancelada':
                lista_horas.append(cita['hora'])
        return JsonResponse(lista_horas, safe=False)
