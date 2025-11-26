"""Vistas del panel"""

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone

from datetime import datetime, timedelta

from .models import Tema, Servicio, Negocio, Cita, HorarioAtencion, Insumo, Usuario
from .serializers import (
    ServicioSerializer,
    ImagenSerializer,
    NegocioSerializer,
    TemaSerializer,
    CitaSerializer,
    HorarioAtencioSerializer,
    InsumoSerializer,
    UsuarioSerializer,
)
from .forms import ImagenForm
from rest_framework.decorators import action
from django.db.models import F


def render_spa(
    request, template_name, context={}, parent_template="panel/administrador/panel.html"
):
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        return render(request, template_name, context)
    full_context = {**context, "seccion_inicial": template_name}
    return render(request, parent_template, full_context)


@login_required
@staff_member_required
def panel_control(request):
    """Template panel"""
    return render(request, "panel/administrador/panel.html")


@login_required
@staff_member_required
def personalizacion(request):
    """Template personalizacion"""
    return render_spa(request, "panel/administrador/personalizacion.html")


@login_required
@staff_member_required
def gestion_inventario(request):
    """Template inventario"""
    return render_spa(request, "panel/administrador/inventario.html")


@login_required
@staff_member_required
def gestion_citas(request):
    """Template citas"""
    return render_spa(request, "panel/administrador/citas.html")


@login_required
@staff_member_required
def dashboard(request):
    """Template dashboard"""
    return render_spa(request, "panel/administrador/dashboard.html")


@login_required
@staff_member_required
def gestion_servicios(request):
    """Template servicios"""
    return render_spa(request, "panel/administrador/gestion_servicios.html")


def obtener_tema(request):
    """Obtener tema actual"""
    if request.method == "GET":
        nombres = [t.nombre for t in Tema.objects.all()]  # pylint: disable=no-member
        return JsonResponse(nombres, safe=False)
    return JsonResponse({"error": "Método no permitido"}, status=405)


def obtener_servicios(request):
    """Obtener servicios para mostrarlos en la pantalla principal"""
    if request.method == "GET":
        servicios = [
            {
                "id": s.id,
                "nombre": s.nombre,
                "descripcion": s.descripcion,
                "estado": s.estado,
                "icono": s.icono,
                "valor": s.valor,
            }
            for s in Servicio.objects.all()  # pylint: disable=no-member
        ]
        return JsonResponse(servicios, safe=False)
    return JsonResponse({"error": "Método no permitido"}, status=405)


class ServicioPagination(PageNumberPagination):
    """Paginacion para servicios"""

    page_size = 3
    page_size_query_param = "page_size"

    def get_paginated_response(self, data):
        """Datos para crear botones de paginacion y mostrar resultados de la pagina"""
        total = self.page.paginator.count
        return Response(
            {
                "count": total,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_count": len(self.page.object_list),
                "start_index": self.page.start_index(),
                "end_index": self.page.end_index(),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


class ServicioViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Api servicio"""

    queryset = Servicio.objects.all()  # pylint: disable=no-member
    serializer_class = ServicioSerializer
    pagination_class = ServicioPagination
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filtros servicios"""
        queryset = super().get_queryset()
        search = self.request.GET.get("search")
        estado = self.request.GET.get("estado")
        if search:
            queryset = queryset.filter(nombre__icontains=search)
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset.order_by("id")


class ImagenViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Api imagen"""

    queryset = ImagenForm.Meta.model.objects.all()  # pylint: disable=no-member
    serializer_class = ImagenSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]


class NegocioViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Api informacion negocio"""

    queryset = Negocio.objects.all()  # pylint: disable=no-member
    serializer_class = NegocioSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]


class TemaViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Api tema"""

    queryset = Tema.objects.all()  # pylint: disable=no-member
    serializer_class = TemaSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]


class CitaViewSet(viewsets.ModelViewSet):
    """Api cita"""

    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filtro citas por año, mes o rango"""
        queryset = super().get_queryset()

        ultimos = self.request.query_params.get("ultimos")
        inicio = self.request.query_params.get("inicio")
        fin = self.request.query_params.get("fin")

        if ultimos:
            dias = int(ultimos)
            fecha_limite = timezone.now() - timedelta(days=dias)
            queryset = queryset.filter(fecha__gte=fecha_limite)

        if inicio and fin:
            inicioNum = int(inicio)
            finNum = int(fin)
            fecha_inicio = timezone.now() - timedelta(days=inicioNum)
            fecha_fin = timezone.now() - timedelta(days=finNum)
            queryset = queryset.filter(fecha__gte=fecha_inicio, fecha__lt=fecha_fin)

        return queryset

    @action(detail=False, methods=["post"])
    def limpiar_alertas(self, request):
        """
        Marca las citas canceladas por el usuario para limpiar la notificación.
        """
        try:
            citas_actualizadas = Cita.objects.filter(
                estado="Cancelada", cancelado_por_usuario=True
            ).update(cancelado_por_usuario=False)

            return Response(
                {
                    "status": "success",
                    "message": f"Se limpiaron {citas_actualizadas} notificaciones",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HorarioAtencionViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """Vista para gestión de horarios de atención."""

    queryset = HorarioAtencion.objects.all()  # pylint: disable=no-member
    serializer_class = HorarioAtencioSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]


class InsumoPagination(PageNumberPagination):
    """Paginación para insumos."""

    page_size = 4
    page_size_query_param = "page_size"

    def get_paginated_response(self, data):
        """Retorna respuesta con metadatos de paginación."""
        total = self.page.paginator.count
        return Response(
            {
                "count": total,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_count": len(self.page.object_list),
                "start_index": self.page.start_index(),
                "end_index": self.page.end_index(),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


class InsumoViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Vista para gestión de insumos."""

    queryset = Insumo.objects.all().order_by("id")  # pylint: disable=no-member
    serializer_class = InsumoSerializer
    pagination_class = InsumoPagination
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.GET.get("search")
        if search:
            queryset = queryset.filter(nombre__icontains=search)

        servicio_id = self.request.query_params.get("servicio")
        if servicio_id:
            queryset = queryset.filter(servicios__id=servicio_id)

        bajo_stock = self.request.query_params.get("bajo_stock")
        if bajo_stock:
            queryset = queryset.filter(cantidad__lte=F("stock_minimo"))

        return queryset.order_by("id")

    @action(detail=False, methods=["post"])
    def descontar_stock(self, request):
        descuentos = request.data.get("descuentos", [])

        for item in descuentos:
            try:
                insumo = Insumo.objects.get(pk=item["id"])
                cantidad_a_restar = int(item["cantidad"])

                if insumo.cantidad >= cantidad_a_restar:
                    insumo.cantidad -= cantidad_a_restar
                    insumo.save()
            except (Insumo.DoesNotExist, ValueError):
                pass 

        return Response({"status": "Stock actualizado"}, status=200)


class UsuarioViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """Api usuario"""

    queryset = Usuario.objects.all()  # pylint: disable=no-member
    serializer_class = UsuarioSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filtros usuario"""
        queryset = super().get_queryset()
        ultimos = self.request.query_params.get("ultimos")
        inicio = self.request.query_params.get("inicio")
        fin = self.request.query_params.get("fin")

        if ultimos:
            dias = int(ultimos)
            fecha_limite = datetime.now() - timedelta(days=dias)
            queryset = queryset.filter(
                date_joined__gte=fecha_limite, is_superuser=False
            )
            print(fecha_limite, "Estoooooo")
        if inicio and fin:
            inicioNum = int(inicio)
            finNum = int(fin)
            fecha_inicio = datetime.now() - timedelta(days=inicioNum)
            fecha_fin = datetime.now() - timedelta(days=finNum)
            queryset = queryset.filter(
                date_joined__gte=fecha_inicio, date_joined__lt=fecha_fin
            )
            print(fecha_inicio, fecha_fin)

        return queryset

@login_required
def cancelar_cita_cliente(request, cita_id):
    cita = get_object_or_404(Cita, id=cita_id, usuario=request.user)
    if cita.estado in ["Cancelada", "Asistida", "Ausente"]:
        return JsonResponse(
            {"status": "error", "message": "Esta cita ya no se puede cancelar."},
            status=400,
        )
    try:
        cita.estado = "Cancelada"
        cita.cancelado_por_usuario = True
        cita.save()

        return JsonResponse(
            {"status": "success", "message": "Cita cancelada correctamente"}
        )
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@login_required
def cliente_home(request):
    return redirect("cliente_citas")


@login_required
def cliente_citas(request):
    citas = Cita.objects.filter(usuario=request.user).order_by("-fecha", "-hora")
    context = {"citas": citas}
    return render_spa(
        request,
        "panel/cliente/citas_cliente.html",
        context,
        "panel/cliente/panel_cliente.html",
    )


@login_required
def cliente_datos(request):
    if request.method == "POST":
        user = request.user
        user.first_name = request.POST.get("first_name")
        user.email = request.POST.get("email")
        try:
            user.save()
            return JsonResponse("Datos actualizados correctamente", safe=False)
        except Exception as e:
            return JsonResponse({"general": ["Error al guardar"]}, status=400)
    context = {"usuario": request.user}
    return render_spa(
        request,
        "panel/cliente/datos_cliente.html",
        context,
        "panel/cliente/panel_cliente.html",
    )
