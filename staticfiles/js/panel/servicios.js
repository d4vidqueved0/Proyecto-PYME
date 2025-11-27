import selectorIconos from '../SelectorIconos.js' 

let abortController = null
let modals = {
    add: null,
    edit: null
}
let iconSelectors = {
    add: null,
    edit: null
}

export default {
    init: async () => {
        abortController = new AbortController()
        const signal = abortController.signal

        const busquedaServicio = document.getElementById('buscarServicio')
        const filtroEstado = document.getElementById('estadosServicios')
        const btnAgregar = document.getElementById('btnAgregarServicio')
        const btnEditar = document.getElementById('btnEditServicio')
        const tbody = document.querySelector('tbody')
        const paginacion = document.getElementById('paginacion')

        const modalAddEl = document.getElementById('modalAgregarServicio')
        const modalEditEl = document.getElementById('modalEditServicio')

        if (modalAddEl) modals.add = new bootstrap.Modal(modalAddEl)
        if (modalEditEl) modals.edit = new bootstrap.Modal(modalEditEl)

        iconSelectors.add = new selectorIconos({
            input: "#id_icono",
            trigger: "#iconoServicio",
            container: "#Iconos",
            search: "#buscadorIcono",
            jsonPath: "/static/font-awesome/metadata/icons.json",
        })

        iconSelectors.edit = new selectorIconos({
            input: "#id_icono_edit",
            trigger: "#iconoServicioEdit",
            container: "#IconosEdit",
            search: "#buscadorIconoEdit",
            jsonPath: "/static/font-awesome/metadata/icons.json",
        })

        if (tbody) tbody.innerHTML = ''
        mostrarServicios("/api/servicios", signal)

        if (busquedaServicio) {
            busquedaServicio.addEventListener('input', () => actualizarLista(signal))
        }
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => actualizarLista(signal))
        }

        if (paginacion) {
            paginacion.addEventListener('click', (ev) => {
                if (ev.target.tagName == 'BUTTON' && ev.target.classList.contains('btn')) {
                    let pagina = ev.target.textContent
                    const busqueda = busquedaServicio ? busquedaServicio.value : ''
                    const estado = filtroEstado ? filtroEstado.value : ''
                    const enlacePagina = '/api/servicios/?page='

                    mostrarServicios(`${enlacePagina}${pagina}&search=${busqueda}&estado=${estado}`, signal)
                }
            })
        }

        if (btnAgregar) {
            btnAgregar.addEventListener('click', (ev) => {
                ev.preventDefault()
                const formServicio = document.getElementById('formServicio')
                validarYEnviarFormServicio(formServicio, modals.add)
            })
        }

        if (btnEditar) {
            btnEditar.addEventListener('click', (ev) => {
                ev.preventDefault()
                const formEdit = document.getElementById('formModalEdit')
                editServicio(formEdit, modals.edit)
            })
        }

        if (tbody) {
            tbody.addEventListener('click', (ev) => {
                if (ev.target.id.includes('btnEliminar')) {
                    let id = ev.target.id.replace('btnEliminar', '')
                    confirmarEliminacion(id, ev.target.closest('tr'))
                }

                if (ev.target.id.includes('btnEditar')) {
                    let id = ev.target.id.replace('btnEditar', '')
                    cargarDatosEdicion(id, modals.edit)
                }
            })
        }
    },

    destroy: () => {

        if (abortController) abortController.abort()

        if (modals.add) { modals.add.hide(); modals.add = null }
        if (modals.edit) { modals.edit.hide(); modals.edit = null }
        const backdrops = document.querySelectorAll('.modal-backdrop')
        backdrops.forEach(b => b.remove())
        iconSelectors = { add: null, edit: null }
    }
}




function actualizarLista(signal) {
    const busqueda = document.getElementById('buscarServicio').value
    const estado = document.getElementById('estadosServicios').value
    mostrarServicios(`/api/servicios/?search=${busqueda}&estado=${estado}`, signal)
}

function mostrarServicios(url, signal) {
    fetch(url, { signal })
        .then(response => {
            if (!response.ok) throw new Error(`Error al cargar los servicios: ${response.status}`)
            return response.json()
        })
        .then(data => {
            const tbody = document.querySelector('tbody')
            const paginacion = document.getElementById('paginacion')
            const resultados = document.getElementById('resultados')

            if (!tbody) return 

            tbody.innerHTML = ''
            paginacion.innerHTML = ''

            data.results.forEach(s => {
                const estado = s.estado === 'Activo'
                    ? `<td><small style='background-color: var(--color-activo)' class='px-3 py-2 rounded-3 estadoServicio'><i class="bi bi-circle-fill activo"></i>${s.estado}</small></td>`
                    : `<td><small style='background-color: var(--color-inactivo)' class='px-3 py-2 rounded-3 estadoServicio'><i class="bi bi-circle-fill inactivo"></i>${s.estado}</small></td>`

                const tr = document.createElement('tr')
                tr.id = `idFila${s.id}`
                tr.dataset.servicio = s.nombre

                tr.innerHTML = `
                    <td class='fw-bold'>${s.nombre}
                        <p class='text-break fw-normal'>${s.descripcion}</p>
                    </td>
                    <td>$${s.valor}</td>
                    ${estado}
                    <td class='botones' style='width:15%'>
                        <button id='btnEditar${s.id}' class="bi bi-pen btn" style='color:var(--color-boton-editar)'></button>
                        <button id='btnEliminar${s.id}' class="bi bi-trash btn" style='color:var(--color-boton-eliminar)'></button>
                    </td>
                `
                tbody.appendChild(tr)
            })

            if (resultados) {
                if (data.results.length) {
                    resultados.textContent = `Mostrando ${data.start_index}-${data.end_index} de ${data.count}`
                } else {
                    resultados.textContent = 'No se encontraron resultados'
                }
            }

            const totalPaginas = data.total_pages
            const paginaActual = data.current_page

            for (let i = 1; i <= totalPaginas; i++) {
                if (i < paginaActual - 2 && i !== 1) {
                    if (!paginacion.querySelector('button.puntos')) {
                        crearBotonPuntos(paginacion, 'puntos')
                    }
                    continue
                }
                if (i > paginaActual + 2 && i !== totalPaginas) {
                    if (!paginacion.querySelector('button.puntosFinal')) {
                        crearBotonPuntos(paginacion, 'puntosFinal')
                    }
                    continue
                }

                const button = document.createElement('button')
                button.classList.add('btn')
                button.textContent = i
                if (i === paginaActual) button.classList.add('btn-principal')
                paginacion.appendChild(button)
            }
        })
        .catch(error => {
            if (error.name !== 'AbortError') console.error("Error en mostrarServicios:", error)
        })
}

function crearBotonPuntos(contenedor, clase) {
    let btnPuntos = document.createElement('button')
    btnPuntos.textContent = '...'
    btnPuntos.classList.add(clase)
    btnPuntos.style.border = 'none'
    btnPuntos.style.background = 'var(--color-fondo-principal)'
    contenedor.appendChild(btnPuntos)
}

function validarYEnviarFormServicio(form, modalInstance) {
    const formData = new FormData(form)

    fetch('/api/servicios/', {
        method: 'POST',
        body: formData,
        headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
    })
        .then(response => {
            if (!response.ok) return response.json().then(errors => Promise.reject(errors))
            return response.json()
        })
        .then(nuevoServicio => {
            Swal.fire({
                position: "center", icon: "success", title: "Se agregó correctamente el servicio",
                showConfirmButton: false, timer: 1500, theme: 'bootstrap-5'
            })

            mostrarServicios("/api/servicios")

            if (modalInstance) modalInstance.hide()

            document.getElementById('iconoServicio').innerHTML = ''
            limpiarErroresAdd()
            form.reset()
        })
        .catch(errores => {
            mostrarErroresAdd(errores)
        })
}

function cargarDatosEdicion(id, modalInstance) {
    const formEdit = document.getElementById('formModalEdit')

    fetch(`/api/servicios/${id}/`)
        .then(response => response.json())
        .then(data => {
            formEdit.dataset.idEdit = id

            document.querySelector('#id_nombre_edit').value = data.nombre
            document.querySelector('#id_descripcion_edit').value = data.descripcion
            document.querySelector('#id_valor_edit').value = data.valor
            document.querySelector('#id_estado_edit').value = data.estado

            const contenedorIcono = document.querySelector('#iconoServicioEdit')
            contenedorIcono.innerHTML = ''

            if (data.icono != '') {
                let i = document.createElement('i')
                i.className = `${data.icono} fs-1`
                document.querySelector('#id_icono_edit').value = data.icono 
                contenedorIcono.appendChild(i)
            } else {
                document.querySelector('#id_icono_edit').value = ''
            }

            if (modalInstance) modalInstance.show()
        })
}

function editServicio(form, modalInstance) {
    let idEdit = form.dataset.idEdit
    let formEditData = new FormData(form)

    fetch(`/api/servicios/${idEdit}/`, {
        method: 'PATCH',
        body: formEditData,
        headers: { 'X-CSRFToken': formEditData.get('csrfmiddlewaretoken') }
    })
        .then(response => {
            if (response.ok) {

                actualizarFilaTabla(idEdit, formEditData)

                if (modalInstance) modalInstance.hide()

                Swal.fire({
                    position: "center", icon: "success", title: "Se editó correctamente",
                    showConfirmButton: false, timer: 1500, theme: 'bootstrap-5'
                })
                limpiarErroresEdit()
            } else {
                return response.json().then(errors => Promise.reject(errors))
            }
        })
        .catch(errores => {
            mostrarErroresEdit(errores)
        })
}

function confirmarEliminacion(id, fila) {
    Swal.fire({
        title: "¿Estas seguro de eliminar el servicio?", icon: "warning", theme: 'light',
        showCancelButton: true, confirmButtonColor: "#3085d6", cancelButtonColor: "#d33",
        confirmButtonText: "Si"
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarServicio(id, fila)
        }
    })
}

function eliminarServicio(id, fila) {
    const csrftToken = document.querySelector('[name=csrfmiddlewaretoken]').value

    fetch(`/api/servicios/${id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': csrftToken }
    })
        .then(response => {
            if (response.ok) {
                fila.remove()
                Swal.fire({
                    position: "center", icon: "success", theme: 'light',
                    title: "Se eliminó correctamente el servicio",
                    showConfirmButton: false, timer: 1500
                })
            } else {
                Swal.fire({
                    position: "center", icon: "error", theme: 'light',
                    title: "No se pudo eliminar el servicio", text: 'Intente de nuevo',
                    showConfirmButton: false, timer: 1500
                })
            }
        })
}


function actualizarFilaTabla(id, formData) {
    let fila = document.getElementById(`idFila${id}`)
    if (!fila) return 

    let campos = fila.querySelectorAll('td')
    let nombre = formData.get('nombre')
    let desc = formData.get('descripcion')
    let valor = formData.get('valor')
    let estado = formData.get('estado')

    campos[0].textContent = nombre
    campos[0].innerHTML += `<p class="text-break fw-normal">${desc}</p>`
    campos[1].textContent = `$${valor}`

    let estadoClass = estado == 'Activo'
        ? `<td> <small style='background-color: var(--color-activo)' class='px-3 py-2 rounded-3 estadoServicio' > <i class="bi bi-circle-fill activo"></i>${estado} </small> </td>`
        : `<td> <small style='background-color: var(--color-inactivo)' class='px-3 py-2 rounded-3 estadoServicio' > <i class="bi bi-circle-fill inactivo"></i>${estado} </small> </td>`

    campos[2].outerHTML = estadoClass
}

function limpiarErroresAdd() {
    document.querySelector('#error_nombre_servicio').textContent = ''
    document.querySelector('#error_descripcion_servicio').textContent = ''
    document.querySelector('#error_estado_servicio').textContent = ''
    document.querySelector('#error_valor_servicio').textContent = ''
}

function mostrarErroresAdd(errores) {
    document.querySelector('#error_nombre_servicio').textContent = 'nombre' in errores ? errores.nombre[0] : ''
    document.querySelector('#error_descripcion_servicio').textContent = 'descripcion' in errores ? errores.descripcion[0] : ''
    document.querySelector('#error_estado_servicio').textContent = 'estado' in errores ? 'Seleccione un estado' : ''
    document.querySelector('#error_valor_servicio').textContent = 'valor' in errores ? errores.valor[0] : ''
}

function limpiarErroresEdit() {
    document.querySelector('#error_nombre_servicio_edit').textContent = ''
    document.querySelector('#error_descripcion_servicio_edit').textContent = ''
    document.querySelector('#error_estado_servicio_edit').textContent = ''
    document.querySelector('#error_valor_servicio_edit').textContent = ''
}

function mostrarErroresEdit(errores) {
    document.querySelector('#error_nombre_servicio_edit').textContent = 'nombre' in errores ? errores.nombre[0] : ''
    document.querySelector('#error_descripcion_servicio_edit').textContent = 'descripcion' in errores ? errores.descripcion[0] : ''
    document.querySelector('#error_estado_servicio_edit').textContent = 'estado' in errores ? 'Seleccione un estado' : ''
    document.querySelector('#error_valor_servicio_edit').textContent = 'valor' in errores ? errores.valor[0] : ''
}