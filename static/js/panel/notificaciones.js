export default class Notificaciones {
    constructor() {
        this.intervalo = null
        this.badge = document.getElementById('badgeContador')
        this.lista = document.getElementById('contenidoNotificaciones')
        this.btnLimpiar = document.getElementById('btnLimpiarNotificaciones')
    }

    init() {        
        if (this.btnLimpiar) {
            this.btnLimpiar.addEventListener('click', (e) => {
                e.stopPropagation()
                this.limpiarCancelaciones()
            })
        }

        this.actualizarNotificaciones()
        this.intervalo = setInterval(() => this.actualizarNotificaciones(),10000)
    }

    async actualizarNotificaciones() {
        try {
            const [stockData, citasData] = await Promise.all([
                this.fetchStockBajo(),
                this.fetchCancelacionesCliente()
            ])

            const todas = [...stockData, ...citasData]
            this.renderizarMenu(todas)

            if (citasData.length > 0) {
                this.btnLimpiar.style.display = 'block'
            } else {
                this.btnLimpiar.style.display = 'none'
            }

        } catch (e) { console.error(e) }
    }

    async fetchStockBajo() {
        try {
            const res = await fetch('/api/insumo/?bajo_stock=true', {headers: {
                cache: 'no-store'
            }})
            const data = await res.json()
            const insumos = data.results
            return insumos.map(ins => ({
                titulo: 'Stock Bajo',
                mensaje: `El insumo <b>${ins.nombre}</b> tiene solo ${ins.cantidad} ${ins.unidad}.`,
                icono: 'bi-box-seam', color: 'text-warning', bg: 'bg-warning-subtle'
            }))
        } catch (e) { return [] }
    }

    async fetchCancelacionesCliente() {
        try {
            const res = await fetch('/api/cita/', {headers: {
                cache: 'no-store'
                
            }}) 
            const data = await res.json()
            const citas = data
            const canceladas = citas.filter(c => c.estado === 'Cancelada' && c.cancelado_por_usuario === true)

            return canceladas.map(cita => ({
                titulo: 'Cita Cancelada',
                mensaje: `Cliente <b>${cita.usuario.email || 'Usuario'}</b> canceló cita del ${cita.fecha}.`,
                icono: 'bi-calendar-x', color: 'text-danger', bg: 'bg-danger-subtle'
            }))
        } catch (e) { return [] }
    }

    async limpiarCancelaciones() {
        try {
            const csrf = document.querySelector('[name=csrfmiddlewaretoken]')?.value
            await fetch('/api/cita/limpiar_alertas/', { 
                method: 'POST',
                headers: { 'X-CSRFToken': csrf, 'Content-Type': 'application/json' }
            })            
            this.actualizarNotificaciones()
            
        } catch (e) { console.error("Error limpiando", e) }
    }

    renderizarMenu(notificaciones) {
        const total = notificaciones.length
        
        if (this.badge) {
            this.badge.textContent = total
            this.badge.style.display = total > 0 ? 'inline-block' : 'none'
        }

        this.lista.innerHTML = ''
        
        if (total === 0) {
            this.lista.innerHTML = `
                <div class="text-center p-4 text-muted">
                    <i class="bi bi-bell-slash fs-3 mb-2"></i><br>
                    <small>Estás al día</small>
                </div>`
            return
        }

        notificaciones.forEach(noti => {
            const item = document.createElement('div')
            item.className = "d-flex align-items-start p-3 border-bottom bg-white"
            item.innerHTML = `
                <div class="me-3 mt-1">
                    <span class="rounded-circle d-flex align-items-center justify-content-center ${noti.bg}" 
                          style="width: 40px height: 40px">
                        <i class="bi ${noti.icono} ${noti.color} fs-5"></i>
                    </span>
                </div>
                <div>
                    <h6 class="mb-1 fw-bold ${noti.color}" style="font-size:0.95rem">${noti.titulo}</h6>
                    <p class="mb-0 small text-secondary text-wrap" style="line-height:1.3">${noti.mensaje}</p>
                </div>`
            this.lista.appendChild(item)
        })
    }
}