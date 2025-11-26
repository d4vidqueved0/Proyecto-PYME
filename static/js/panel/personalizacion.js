let abortController = null

export default {
    init: async () => {
        abortController = new AbortController()
        const signal = abortController.signal

        const btnGuardarHorario = document.getElementById('btnGuardarHorario')
        const btnGuardarNegocio = document.getElementById('btnGuardarDatosNegocio')
        const formHorario = document.getElementById('formHorario')
        const formNegocio = document.getElementById('formDatosNegocio')
        const seccionTemas = document.getElementById('seccionTemas')
        const seccionImagenes = document.getElementById('seccionImagenes')
        const dropZone = document.getElementById('drop-carrusel')
        const inputDrop = dropZone ? dropZone.querySelector('input') : null

        cargarDatosNegocio(formNegocio, signal)
        cargarHorarioNegocio(formHorario, signal)
        cargarImagenesPanel(signal)
        actualizarUITema() 

        
        if (btnGuardarHorario) {
            btnGuardarHorario.addEventListener('click', () => {
                guardarFormulario(
                    '/api/horario_negocio/1/', 
                    'PUT', 
                    formHorario, 
                    'Horario modificado correctamente', 
                    'No se pudo modificar el horario',
                    'horario' 
                )
            })
        }

        if (btnGuardarNegocio) {
            btnGuardarNegocio.addEventListener('click', () => {
                guardarFormulario(
                    '/api/negocio/1/', 
                    'PATCH', 
                    formNegocio, 
                    'Datos del negocio actualizados', 
                    'No se pudieron actualizar los datos',
                    'negocio' 
                )
            })
        }

        if (seccionTemas) {
            seccionTemas.addEventListener('click', (ev) => {
                if (ev.target.classList.contains('bi-circle')) {
                    const nuevoTema = ev.target.id.replace('btnTema', '').toLowerCase()
                    cambiarTema(nuevoTema, formNegocio) 
                }
            })
        }

        if (seccionImagenes) {
            seccionImagenes.addEventListener('click', (ev) => {
                if (ev.target.classList.contains('btn-eliminar')) {
                    let id = ev.target.id.replace('btnEliminarImagen', '')
                    confirmarEliminacionImagen(id, ev.target.closest('.item-imagen'))
                }
            })
        }

        if (dropZone && inputDrop) {
            dropZone.addEventListener('click', () => inputDrop.click())
            inputDrop.addEventListener('click', (e) => e.stopPropagation()) 

            inputDrop.addEventListener('change', () =>procesarSubidaImagenes(inputDrop.files))

            dropZone.addEventListener('dragover', (ev) => {
                ev.preventDefault()
                dropZone.classList.add('drop-activo')
            })

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drop-activo')
            })

            dropZone.addEventListener('drop', (ev) => {
                ev.preventDefault()
                dropZone.classList.remove('drop-activo')
                const files = ev.dataTransfer.files
                if (files.length) {
                    inputDrop.files = files 
                    procesarSubidaImagenes(files)
                }
            })
        }
    },

  
    destroy: () => {
        if (abortController) abortController.abort()
    }
}



async function cargarDatosNegocio(form, signal) {
    try {
        const res = await fetch('/api/negocio/1/', { signal })
        if (!res.ok) return
        const data = await res.json()
        
        if(form.nombre) form.nombre.value = data.nombre
        if(form.descripcion) form.descripcion.value = data.descripcion
        if(form.direccion) form.direccion.value = data.direccion
        if(form.telefono) form.telefono.value = data.telefono
        if(form.email) form.email.value = data.email
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
    }
}

async function cargarHorarioNegocio(form, signal) {
    try {
        const res = await fetch('/api/horario_negocio/1/', { signal })
        if (!res.ok) return
        const data = await res.json()

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`)
            if (input) input.value = data[key] || ""
        })
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
    }
}

async function guardarFormulario(url, method, form, msgSuccess, msgError, tipoError) {
    const formData = new FormData(form)
    if (tipoError === 'horario') formData.set('negocio', 1)

    limpiarErroresDOM() 

    try {
        const response = await fetch(url, {
            method: method,
            body: formData,
            headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') },
            signal: abortController?.signal
        })

        if (!response.ok) {
            const errorData = await response.json()
            mostrarErroresDOM(errorData, tipoError)
            throw new Error('Error de validación')
        }

        Swal.fire({
            position: "center", icon: "success", title: msgSuccess,
            showConfirmButton: false, timer: 1500, theme: 'light'
        })

    } catch (error) {
        if (error.message !== 'Error de validación' && error.name !== 'AbortError') {
            console.error(error)
        }
        if(error.message === 'Error de validación') {
             Swal.fire({
                position: "center", icon: "error", title: msgError,
                showConfirmButton: true, theme: 'light'
            })
        }
    }
}

function actualizarUITema() {
    const temaActual = document.body.getAttribute('data-tema') || 'claro' 
    const btns = document.querySelectorAll('#seccionTemas button')
    
    btns.forEach(btn => {
        const nombreBtn = btn.id.replace('btnTema', '').toLowerCase()
        if (nombreBtn === temaActual.toLowerCase()) {
            btn.classList.remove('bi-circle')
            btn.classList.add('bi-check-circle')
        } else {
            btn.classList.add('bi-circle')
            btn.classList.remove('bi-check-circle')
        }
    })
}

async function cambiarTema(nuevoTema, formReferencia) {
    const csrf = formReferencia.querySelector('[name=csrfmiddlewaretoken]').value
    
    try {
        const res = await fetch('/api/tema/1/', {
            method: 'PUT',
            body: JSON.stringify({ nombre: nuevoTema }),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf
            },
            signal: abortController?.signal
        })

        if (res.ok) {
            document.body.setAttribute('data-tema', nuevoTema)
            actualizarUITema()
            Swal.fire({
                position: "center", icon: "success", title: "Tema actualizado",
                showConfirmButton: false, timer: 1000, theme: 'light'
            })
        } else {
            throw new Error()
        }
    } catch (e) {
        Swal.fire({ position: "center", icon: "error", title: "Error al cambiar tema", theme: 'light' })
    }
}

async function cargarImagenesPanel(signal) {
    const contenedor = document.getElementById('seccionImagenes')
    if (!contenedor) return

    try {
        const res = await fetch('/api/imagenes/', { signal })
        const data = await res.json()


        contenedor.innerHTML = '' 

        data.forEach(img => {
            const div = document.createElement('div')
            div.classList.add('item-imagen')
            div.innerHTML = `
                <img class="rounded-3" src="${img.imagen}">
                <button id='btnEliminarImagen${img.id}' class="bi bi-trash btn btn-eliminar btn-sm position-absolute end-0 m-1"></button>
            `
            contenedor.appendChild(div)
        })
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
    }
}

async function procesarSubidaImagenes(files) {
    const formDrop = document.getElementById('form-drop')
    
    try {
        const res = await fetch('/api/imagenes/')
        const data = await res.json()
        
        if (data.length >= 5) {
            Swal.fire({
                icon: "error", title: "Límite alcanzado",
                text: 'Máximo 5 imágenes. Borra una para continuar.',
                theme: 'bootstrap-5'
            })
            return
        }

        const formData = new FormData(formDrop)
   

        const uploadRes = await fetch('/api/imagenes/', {
            method: 'POST',
            body: formData
        })

        if (uploadRes.ok) {
            Swal.fire({
                icon: "success", title: "Imagen agregada correctamente",
                showConfirmButton: false, timer: 1500, theme: 'bootstrap-5'
            })
            cargarImagenesPanel() // Recargar galería
        } else {
            throw new Error('Error subida')
        }

    } catch (e) {
        Swal.fire({ icon: "error", title: "Error al subir imagen", theme: 'bootstrap-5' })
    }
}

function confirmarEliminacionImagen(id, elementoDOM) {
    Swal.fire({
        title: "¿Estás seguro de eliminar la imagen?", icon: "warning", theme: 'light',
        showCancelButton: true,
        confirmButtonText: "Si",
        cancelButtonText: 'No',
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarImagenAPI(id, elementoDOM)
        }
    })
}

async function eliminarImagenAPI(id, elementoDOM) {
    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value
    
    try {
        const res = await fetch(`/api/imagenes/${id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrf }
        })

        if (res.ok) {
            elementoDOM.remove()
            Swal.fire({
                icon: "success", title: "Imagen eliminada correctamente",
                showConfirmButton: false, timer: 1500, theme: 'light'
            })
        } else {
            throw new Error()
        }
    } catch (e) {
        Swal.fire({ icon: "error", title: "No se pudo eliminar", theme: 'light' })
    }
}


function limpiarErroresDOM() {
    document.querySelectorAll('[id^="error_"]').forEach(el => el.textContent = '')
}

function mostrarErroresDOM(errores, tipo) {
    if (tipo === 'negocio') {
        const campos = ['nombre', 'descripcion', 'direccion', 'telefono', 'email']
        campos.forEach(campo => {
            if (errores[campo]) {
                const el = document.getElementById(`error_${campo}`)
                if (el) el.textContent = errores[campo][0]
            }
        })
    }

    if (tipo === 'horario') {
        Object.keys(errores).forEach(key => {
            const el = document.getElementById(`error_${key}`)
            if (el) el.textContent = errores[key][0]
        })
    }
}