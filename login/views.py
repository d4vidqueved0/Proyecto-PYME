"""
Vistas para manejar login, registro y cerrar sesión
"""
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
from .forms import RegistroForm, LoginForm


def cerrar_sesion(request):
    """
    Cierra la sesión del usuario actual y redirige a la página de login/registro
    """
    logout(request)
    return redirect("login_registro")


def login_registro(request):
    """
    Renderiza la plantilla principal para el login y registro
    """
    return render(request, "login/login.html")


def iniciar_sesion(request):
    """
    Maneja la lógica para iniciar sesión
    """
    if request.method == "GET":
        return render(request, "login/login.html")

    form = LoginForm(request.POST)
    if form.is_valid():
        email = request.POST['email']
        contraseña = request.POST['password']
        usuario = authenticate(request, email=email, password=contraseña)

        if usuario is None:
            return JsonResponse({'error': 'Credenciales incorrectas'}, status=400, safe=False)

        login(request, usuario)
        return JsonResponse('Se inició sesión correctamente', safe=False)
    print(form)
    errores = {}
    for x in form.errors.items():
        errores[x[0]] = x[1]
    print(errores)
    return JsonResponse(errores, status=400, safe=False)


def registrar_usuario(request):
    """
    Maneja la lógica para registrar un nuevo usuario
    """
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse('Se registró correctamente', safe=False)
        print(form)
        errores = {}
        for x in form.errors.items():
            errores[x[0]] = x[1]
        print(errores)
        return JsonResponse(errores, status=400, safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405, safe=False)




