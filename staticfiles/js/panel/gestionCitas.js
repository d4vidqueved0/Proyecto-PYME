let calendar = null
let modalBootstrap = null
let modalCorreoBootstrap = null
let $select2 = null
let abortController = null

const COLORES_CITA = {
    Pendiente: '#FFD580',
    PendienteTexto: '#B38600',
    Asistida: '#A8E6CF',
    AsistidaTexto: '#26734D',
    Ausente: '#FF8C94',
    AusenteTexto: '#A8323E',
    Cancelada: '#CFCFCF',
    CanceladaTexto: '#555555'
}

export default {
    init: async () => {
        abortController = new AbortController()
        const signal = abortController.signal

        const modalEl = document.querySelector('#modalEditCita')
        if (modalEl) {
            modalBootstrap = new bootstrap.Modal(modalEl)
        }
        const modalCorreo = document.querySelector('#modalCancelarCita')
        if (modalCorreo) {
            modalCorreoBootstrap = new bootstrap.Modal(modalCorreo)
        }

        const selectEl = $('#select_buscar_servicios')
        if (selectEl.length) {
            $select2 = selectEl.select2()
            $select2.on('change', aplicarFiltro)
        }

        cargarServicios(signal)

        await cargarCalendario(signal)

        const filtroCliente = document.getElementById('id_usuario_buscar')
        if (filtroCliente) {
            filtroCliente.addEventListener('input', aplicarFiltro)
        }

        // Filtro Estado (Checkboxes)
        const filtrosEstado = document.querySelector('#filtrosEstado')
        if (filtrosEstado) {
            filtrosEstado.addEventListener('change', (ev) => {
                if (ev.target.tagName === 'INPUT') {
                    aplicarFiltro()
                }
            })
        }

        const btnEditCita = document.querySelector('#btnEditCita')
        if (btnEditCita) {
            btnEditCita.addEventListener('click', (ev) => {
                ev.preventDefault() 
                verificarCambioAsistencia()
            })
        }

        const btnCancelarCita = document.querySelector('#btnCancelarCita')
        if (btnCancelarCita) {
            btnCancelarCita.addEventListener('click', () => {
                document.querySelector('#destinatarioCorreo').value = document.querySelector('#id_usuario_edit').value
                document.querySelector('#id_cita').value = document.querySelector('#formEditCita').dataset.id
                modalBootstrap.hide()
                modalCorreoBootstrap.show()
            })
        }

        const formCorreo = document.querySelector('#formCorreo')
        if (formCorreo) {
            formCorreo.addEventListener('submit', (ev) => {
                ev.preventDefault()
                enviarCorreo()
            })
        }
    },

    destroy: () => {
        if (abortController) abortController.abort()

        if (calendar) {
            calendar.destroy()
            calendar = null
        }

        if ($select2) {
            $select2.select2('destroy')
            $('.select2-container').remove()
            $select2 = null
        }

        if (modalBootstrap) {
            modalBootstrap.hide()
            const backdrop = document.querySelector('.modal-backdrop')
            if (backdrop) backdrop.remove()
            modalBootstrap = null
        }
    }
}

async function cargarServicios(signal) {
    try {
        const response = await fetch('/obtener_servicios/', { signal })
        if (!response.ok) return

        const data = await response.json()
        const selectServicio = document.querySelector('#select_buscar_servicios')

        if (selectServicio) {
            selectServicio.innerHTML = ''
            data.forEach((servicio) => {
                let option = document.createElement('option')
                option.value = servicio.nombre
                option.textContent = servicio.nombre
                selectServicio.appendChild(option)
            })
            if ($select2) $select2.trigger('change')
        }
    } catch (e) {
        if (e.name !== 'AbortError') console.error("Error cargando servicios:", e)
    }
}

async function cargarCalendario(signal) {
    try {
        const response = await fetch('/api/cita/', { signal })
        if (!response.ok) throw new Error("Error API Citas")
        const data = await response.json()

        let eventos = data.map((cita) => ({
            id: cita.id,
            estado: cita.estado,
            title: cita.servicio.nombre,
            start: `${cita.fecha}T${cita.hora}`,
            extendedProps: {
                estado: cita.estado,
                servicio: cita.servicio.nombre,
                servicioId: cita.servicio.id,
                cliente: cita.usuario.email
            }
        }))

        const calendarEl = document.getElementById('calendario')
        if (!calendarEl) return

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            eventTimeFormat: {
                hour: '2-digit', minute: '2-digit', hour12: false
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listMonth'
            },
            events: eventos,

            eventDidMount: function (info) {
                const estado = info.event.extendedProps.estado
                const cliente = info.event.extendedProps.cliente
                const servicio = info.event.extendedProps.servicio

                info.el.style.backgroundColor = COLORES_CITA[estado] || '#ccc'
                info.el.style.color = COLORES_CITA[estado + 'Texto'] || '#000'
                info.el.style.borderColor = COLORES_CITA[estado] || '#ccc'

                info.el.dataset.id = info.event.id
                info.el.dataset.estado = estado
                info.el.dataset.cliente = cliente ? cliente.toLowerCase() : ''
                info.el.dataset.servicio = servicio
                aplicarFiltroLogica(info.el)
            },

            eventClick: async function (info) {
                const idCita = info.event.id
                const formEdit = document.querySelector('#formEditCita')

                if (formEdit) {
                    formEdit.dataset.id = idCita
                    formEdit.dataset.idServicio = info.event.extendedProps.servicioId
                }

                try {
                    const res = await fetch(`/api/cita/${idCita}`)
                    const detalle = await res.json()

                    document.querySelector('#id_usuario_edit').value = detalle.usuario.email
                    document.querySelector('#id_servicio_edit').value = detalle.servicio.nombre
                    document.querySelector('#id_fecha_edit').value = detalle.fecha
                    document.querySelector('#id_hora_edit').value = detalle.hora
                    document.querySelector('#id_estado_edit').value = detalle.estado

                    if (modalBootstrap) modalBootstrap.show()

                } catch (error) {
                    console.error("Error cargando detalle cita", error)
                }
            }
        })

        calendar.render()
        aplicarFiltro() 

    } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
    }
}


function aplicarFiltro() {
    const inputsEstado = document.querySelectorAll('#filtrosEstado input[type="checkbox"]')
    const estadosSeleccionados = Array.from(inputsEstado).filter(i => i.checked).map(i => i.value)

    const textoCliente = document.getElementById('id_usuario_buscar')?.value.toLowerCase() || ''
    const serviciosSeleccionados = $('#select_buscar_servicios').val() || []

    const citasCalendario = document.querySelectorAll('[data-estado]')

    citasCalendario.forEach((el) => {
        const est = el.dataset.estado
        const cli = el.dataset.cliente
        const serv = el.dataset.servicio

        const cumpleEstado = !estadosSeleccionados.length || estadosSeleccionados.includes(est)
        const cumpleCliente = !textoCliente || cli.includes(textoCliente)
        const cumpleServicio = !serviciosSeleccionados.length || serviciosSeleccionados.includes(serv)

        if (cumpleEstado && cumpleCliente && cumpleServicio) {
            if (el.closest('.fc-daygrid-event-harness')) {
                el.closest('.fc-daygrid-event-harness').style.display = ''
            }
            el.style.display = ''
        } else {
            if (el.closest('.fc-daygrid-event-harness')) {
                el.closest('.fc-daygrid-event-harness').style.display = 'none'
            }
            el.style.display = 'none'
        }
    })
}

function aplicarFiltroLogica(el) {
    const inputsEstado = document.querySelectorAll('#filtrosEstado input[type="checkbox"]')
    const estadosVal = Array.from(inputsEstado).filter(i => i.checked).map(i => i.value)
    const textoCliente = document.getElementById('id_usuario_buscar')?.value.toLowerCase() || ''
    const serviciosVal = $('#select_buscar_servicios').val() || []

    const est = el.dataset.estado
    const cli = el.dataset.cliente
    const serv = el.dataset.servicio

    const cumpleEstado = !estadosVal.length || estadosVal.includes(est)
    const cumpleCliente = !textoCliente || cli.includes(textoCliente)
    const cumpleServicio = !serviciosVal.length || serviciosVal.includes(serv)

    if (cumpleEstado && cumpleCliente && cumpleServicio) {
        if (el.closest('.fc-daygrid-event-harness')) el.closest('.fc-daygrid-event-harness').style.display = ''
        el.style.display = ''
    } else {
        if (el.closest('.fc-daygrid-event-harness')) el.closest('.fc-daygrid-event-harness').style.display = 'none'
        el.style.display = 'none'
    }
}


function verificarCambioAsistencia() {
    const estadoNuevo = document.querySelector('#id_estado_edit').value
    const form = document.querySelector('#formEditCita')

    if (estadoNuevo === 'Asistida') {
        modalBootstrap.hide() 
        iniciarDescuentoStock(form.dataset.id, form.dataset.idServicio)
    } else {
        editarCitaFetch()
    }
}

async function iniciarDescuentoStock(idCita, idServicio) {
    try {
        const res = await fetch(`/api/insumo/?servicio=${idServicio}`)
        const insumos = await res.json()

        if (!insumos || insumos.length === 0) {
            editarCitaFetch()
            return
        }

        let htmlList = `<div class="list-group text-start" style="max-height:300px overflow:auto">
            <p class="mb-2 small text-muted">Confirma el consumo de insumos para esta cita:</p>`


        insumos.results.forEach(ins => {
            htmlList += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold">${ins.nombre}</span><br>
                        <small class="text-muted">Stock: ${ins.cantidad} ${ins.unidad}</small>
                    </div>
                    <input type="number" class="form-control input-stock-descuento" 
                    data-id="${ins.id}" value="1" min="0" max="${ins.cantidad}" style="width:80px">
                </div>`
        })
        htmlList += `</div>`

        Swal.fire({
            title: 'Consumo de insumos',
            html: htmlList,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                const descuentos = []
                document.querySelectorAll('.input-stock-descuento').forEach(i => {
                    const val = parseInt(i.value)
                    if (val > 0) descuentos.push({ id: i.dataset.id, cantidad: val })
                })
                ejecutarDescuento(idCita, descuentos)
            } else {
                modalBootstrap.show()
            }
        })

    } catch (e) {
        console.error(e)
        editarCitaFetch() 
    }
}

async function ejecutarDescuento(idCita, descuentos) {
    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value
    try {
        if (descuentos.length > 0) {
            await fetch('/api/insumo/descontar_stock/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
                body: JSON.stringify({ descuentos })
            })
        }
        editarCitaFetch()
    } catch (e) {
        Swal.fire('Error', 'Falló el descuento de stock', 'error')
        modalBootstrap.show()
    }
}

function editarCitaFetch() {
    const formEdit = document.querySelector('#formEditCita')
    if (!formEdit) return

    const id = formEdit.dataset.id
    const formData = new FormData(formEdit)
    const csrfToken = formData.get('csrfmiddlewaretoken')

    fetch(`/api/cita/${id}/`, {
        method: 'PATCH',
        body: formData,
        headers: { 'X-CSRFToken': csrfToken }
    })
        .then(async response => {
            if (!response.ok) {
                const errores = await response.json()
                throw errores
            }
            if (modalBootstrap) modalBootstrap.hide()

            Swal.fire({
                position: "center", icon: "success", theme: 'light',
                title: "Cita actualizada correctamente",
                showConfirmButton: false, timer: 1500
            })

            if (calendar) {
                calendar.destroy()
                cargarCalendario()
            }
        })
        .catch(errores => {
            Swal.fire('Error', 'No se pudo guardar los cambios', 'error')
        })
}

function enviarCorreo() {
    const form = new FormData(document.querySelector('#formCorreo'))
    fetch('/cancelar_cita_correo/', {
        method: 'POST',
        body: form,
        headers: { 'X-CSRFToken': form.get('csrfmiddlewaretoken') }
    }).then(response => response.json())
        .then(data => {
            Swal.fire({
                position: "center", icon: "success", theme: 'light',
                title: data,
                showConfirmButton: false, timer: 3000
            })
            if (calendar) {
                calendar.destroy()
                cargarCalendario()
            }
            modalCorreoBootstrap.hide()
        })
}