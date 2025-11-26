let abortController = null

const ITEMS_POR_PAGINA = 5 
let paginaActual = 1
let filtroActual = 'todos' 

export default {
    init: async () => {
        abortController = new AbortController()
        
        // Resetear variables
        paginaActual = 1
        filtroActual = 'todos'

        // 1. Inicializar Paginación
        renderizarPaginacion()

        // 2. Listeners
        const contenedor = document.getElementById('tabla-citas-container')
        if (contenedor) {
            contenedor.addEventListener('click', manejarClickTabla)
        }

        const contenedorPaginacion = document.getElementById('paginacion-cliente')
        if (contenedorPaginacion) {
            contenedorPaginacion.addEventListener('click', manejarClickPaginacion)
        }

        const selectFiltro = document.getElementById('filtro-estado-citas')
        if (selectFiltro) {
            selectFiltro.addEventListener('change', (e) => {
                filtroActual = e.target.value
                paginaActual = 1 
                renderizarPaginacion()
            })
        }
    },

    destroy: () => {
        if (abortController) abortController.abort()
        
        const contenedor = document.getElementById('tabla-citas-container')
        const contenedorPaginacion = document.getElementById('paginacion-cliente')
        const selectFiltro = document.getElementById('filtro-estado-citas')

        if (contenedor) contenedor.removeEventListener('click', manejarClickTabla)
        if (contenedorPaginacion) contenedorPaginacion.removeEventListener('click', manejarClickPaginacion)
        
        paginaActual = 1
        filtroActual = 'todos'
    }
}


function renderizarPaginacion() {
    const contenedor = document.getElementById('tabla-citas-container')
    if (!contenedor) return

    const todasLasTarjetas = Array.from(contenedor.querySelectorAll('.cita-cliente'))
    
    // --- A. FILTRADO (USANDO SOLO EL DIV) ---
    const tarjetasVisibles = todasLasTarjetas.filter(tarjeta => {
        if (filtroActual === 'todos') return true
        
        // ✅ CAMBIO: Leemos directamente el atributo data-estado del div padre
        return tarjeta.dataset.estado === filtroActual
    })

    // Ocultar las que no coinciden
    todasLasTarjetas.forEach(t => {
        if (!tarjetasVisibles.includes(t)) {
            t.style.display = 'none'
        }
    })

    // --- B. PAGINACIÓN ---
    const totalItems = tarjetasVisibles.length
    const totalPaginas = Math.ceil(totalItems / ITEMS_POR_PAGINA)

    const pagContainer = document.getElementById('paginacion-cliente')

    if (totalItems === 0 && todasLasTarjetas.length > 0) {
        if(pagContainer) pagContainer.innerHTML = '<small class="text-muted">No hay citas con este estado.</small>'
        return
    }

    if (totalPaginas <= 1) {
        tarjetasVisibles.forEach(t => {
            t.style.display = '' 
            t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
        })
        if(pagContainer) pagContainer.innerHTML = ''
        return
    }

    // Rango actual
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    const fin = inicio + ITEMS_POR_PAGINA

    // Mostrar solo el rango
    tarjetasVisibles.forEach((tarjeta, index) => {
        if (index >= inicio && index < fin) {
            tarjeta.style.display = '' 
            tarjeta.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
        } else {
            tarjeta.style.display = 'none'
        }
    })

    dibujarControles(totalPaginas)
}


function dibujarControles(totalPaginas) {
    const contenedorBotones = document.getElementById('paginacion-cliente')
    if(!contenedorBotones) return
    
    contenedorBotones.innerHTML = ''

    const btnPrev = crearBoton('<i class="bi bi-chevron-left"></i>', 'prev', paginaActual === 1)
    contenedorBotones.appendChild(btnPrev)

    for (let i = 1; i <= totalPaginas; i++) {
        const activo = i === paginaActual
        const btn = crearBoton(i, 'ir', false, activo)
        btn.dataset.pagina = i
        contenedorBotones.appendChild(btn)
    }

    const btnNext = crearBoton('<i class="bi bi-chevron-right"></i>', 'next', paginaActual === totalPaginas)
    contenedorBotones.appendChild(btnNext)
}

function crearBoton(texto, accion, disabled, activo = false) {
    const btn = document.createElement('button')
    btn.className = `btn btn-sm ${activo ? 'btn-primary' : 'btn-outline-secondary'} ${disabled ? 'disabled' : ''}`
    btn.innerHTML = texto
    btn.dataset.accion = accion
    if (disabled) btn.disabled = true
    return btn
}

function manejarClickPaginacion(e) {
    const btn = e.target.closest('button')
    if (!btn || btn.disabled) return

    const contenedor = document.getElementById('tabla-citas-container')
    
    // Recalculamos usando la misma lógica del DIV
    const todas = Array.from(contenedor.querySelectorAll('.cita-cliente'))
    const filtradas = todas.filter(t => filtroActual === 'todos' || t.dataset.estado === filtroActual)
    
    const totalPaginas = Math.ceil(filtradas.length / ITEMS_POR_PAGINA)
    const accion = btn.dataset.accion

    if (accion === 'prev' && paginaActual > 1) paginaActual--
    else if (accion === 'next' && paginaActual < totalPaginas) paginaActual++
    else if (accion === 'ir') paginaActual = parseInt(btn.dataset.pagina)

    renderizarPaginacion()
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' })
}


// ==========================================
// CANCELACIÓN
// ==========================================

function manejarClickTabla(e) {
    const btn = e.target.closest('.btn-danger')
    if (btn) {
        const id = btn.dataset.id
        confirmarCancelacion(id, btn)
    }
}

function confirmarCancelacion(id, btn) {
    Swal.fire({
        title: '¿Estas seguro de cancelar la cita?',
        text: "Se le notificará al administrador",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Volver'
    }).then((result) => {
        if (result.isConfirmed) {
            cancelarCita(id, btn)
        }
    })
}

function cancelarCita(id, btn) {
    fetch(`/panel/mis-citas/cancelar/${id}/`, {
        signal: abortController?.signal
    })
    .then(res => {
        if(res.ok) {
            Swal.fire({
                position: "center",
                icon: "success",
                title: 'Se canceló correctamente la cita',
                showConfirmButton: false,
                timer: 1500,
                theme: 'light'
            })
            
            // 1. Actualizar el texto visual (Tu lógica original)
            let estado = document.querySelector(`[data-estado="Pendiente${id}"]`)
            if(estado){
                estado.textContent = ` Cancelado`
                estado.classList.add('text-muted')
                estado.classList.remove('fw-bold')
            }

            // 2. IMPORTANTE: Actualizar el dataset del DIV PADRE
            // Esto asegura que si cambias el filtro, esta cita se mueva a "Canceladas"
            const tarjetaPadre = btn.closest('.cita-cliente')
            if (tarjetaPadre) {
                tarjetaPadre.dataset.estado = 'Cancelada' // <--- Actualizamos el dato para el filtro
            }

            // 3. Eliminar botón
            btn.closest('div').remove()

        } else {
            Swal.fire('Error', 'No se pudo cancelar.', 'error')
        }
    })
}