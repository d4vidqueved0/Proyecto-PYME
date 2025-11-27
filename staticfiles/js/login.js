const btnCambiarFormLogin = document.getElementById('btnCambiarFormLogin')
const btnCambiarFormRegistro = document.getElementById('btnCambiarFormRegistro')

const seccionLogin = document.getElementById('formulario_login')
const seccionRegistro = document.getElementById('formulario_registro')

const formLogin = document.getElementById('formLogin')
const formRegistro = document.getElementById('formRegistro')

const btnInciarSesion = document.querySelector('#btnIniciarSesion')
const btnRegistrarse = document.querySelector('#btnRegistrarse')

formLogin.addEventListener('submit', (ev) => {
    ev.preventDefault()
    iniciarSesion()

})

formRegistro.addEventListener('submit', (ev) => {

    ev.preventDefault()
    registrarUsuario()

})


btnCambiarFormLogin.addEventListener('click', () => {

    cambiarForm()

})

btnCambiarFormRegistro.addEventListener('click', () => {

    cambiarForm()

})


function cambiarForm() {

    if (seccionLogin.classList.contains('oculto')) {

        seccionLogin.classList.remove('oculto')
        seccionLogin.classList.add('animacion')
        seccionRegistro.classList.add('oculto')
        seccionRegistro.classList.remove('animacion')


    } else {
        seccionLogin.classList.add('oculto')
        seccionLogin.classList.remove('animacion')
        seccionRegistro.classList.add('animacion')
        seccionRegistro.classList.remove('oculto')

    }

}

const btnVerContraseña = document.getElementById('btnVerContraseña')
const inputContraseñaLogin = document.getElementById('id_password')

const btnVerContraseña1 = document.getElementById('btnVerContraseña1')
const btnVerContraseña2 = document.getElementById('btnVerContraseña2')

const inputContraseñaRegistro1 = document.getElementById('id_password1_registro')
const inputContraseñaRegistro2 = document.getElementById('id_password2_registro')

function verContraseña(btn, input) {

    const icono = btn.querySelector('i')

    if (input.getAttribute('type') == 'password') {

        input.setAttribute('type', 'text')
        icono.classList.remove('bi-eye-slash')
        icono.classList.add('bi-eye')


    } else {
        input.setAttribute('type', 'password')
        icono.classList.add('bi-eye-slash')
        icono.classList.remove('bi-eye')
    }

}


btnVerContraseña.addEventListener('click', () => {

    verContraseña(btnVerContraseña, inputContraseñaLogin)

})

btnVerContraseña1.addEventListener('click', () => {

    verContraseña(btnVerContraseña1, inputContraseñaRegistro1)

})

btnVerContraseña2.addEventListener('click', () => {

    verContraseña(btnVerContraseña2, inputContraseñaRegistro2)

})


function iniciarSesion() {

    let form = new FormData(formLogin)
    btnInciarSesion.disabled = true
    btnInciarSesion.innerHTML = `
    Iniciar Sesión
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    `

    fetch('/iniciar_sesion/', {
        method: 'POST',
        body: form,
        headers: {

            'X-CSRFToken': form.get('csrfmiddlewaretoken')

        }
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw error
                })
            }
            return response.json()
        }).then(mensaje => {

            document.querySelector('#error_login').textContent = ''
            document.querySelector('#error_email_login').textContent = ''
            document.querySelector('#error_password_login').textContent = ''

            Swal.fire({
                position: "center",
                icon: "success",
                title: mensaje,
                showConfirmButton: false,
                timer: 1500,
                theme: 'light'
            }).then(() => {

                window.location.href = '/'

            })

        }).catch(error => {
            document.querySelector('#error_login').textContent = 'error' in error ? error.error : ''
            document.querySelector('#error_email_login').textContent = 'email' in error ? error.email : ''
            document.querySelector('#error_password_login').textContent = 'password' in error ? error.password : ''
        }).finally(() => {

            btnInciarSesion.disabled = false
            btnInciarSesion.innerHTML = 'Iniciar Sesión'

        })

}

function registrarUsuario() {
    let form = new FormData(formRegistro)
    btnRegistrarse.disabled = true
    btnRegistrarse.innerHTML = `
    Crear cuenta
<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    `
    fetch('/registrar_usuario/', {
        method: 'POST',
        body: form,
        headers: {

            'X-CSRFToken': form.get('csrfmiddlewaretoken')

        }

    }).then(response => {

        if (!response.ok) {
            return response.json().then(error => {
                throw error
            })
        }


        return response.json()

    }).then(mensaje => {

        document.querySelector('#error_registro').textContent = ''
        document.querySelector('#error_email_registro').textContent = ''
        document.querySelector('#error_nombre_registro').textContent = ''
        document.querySelector('#error_password1_registro').textContent = ''
        document.querySelector('#error_password2_registro').textContent = ''

        Swal.fire({
            position: "center",
            icon: "success",
            title: mensaje,
            showConfirmButton: false,
            timer: 1500,
            theme: 'light'
        }).then(() => {

            cambiarForm()
        })

    }).catch(error => {

        document.querySelector('#error_registro').textContent = 'error' in error ? error.error : ''
        document.querySelector('#error_email_registro').textContent = 'email' in error ? error.email : ''
        document.querySelector('#error_nombre_registro').textContent = 'nombre' in error ? error.nombre : ''
        document.querySelector('#error_password1_registro').textContent = 'password1' in error ? error.password1 : ''
        document.querySelector('#error_password2_registro').textContent = 'password2' in error ? error.password2[0] : ''


    }).finally(() => {

        btnRegistrarse.disabled = false
        btnRegistrarse.innerHTML = `
    Crear cuenta
    `

    })

}