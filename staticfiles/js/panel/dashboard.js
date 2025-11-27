let charts = {
    citas: null,
    servicios: null,
    lineas: null
}

let abortController = null

export default {

    init: async () => {
        abortController = new AbortController()

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(t => new bootstrap.Tooltip(t));

        const filtroPeriodo = document.querySelector('#filtrosDashboard')

        const ejecutarCarga = async (dias) => {

            const infoCitas = await fetchDias(dias)
            const infoClientes = await fetchClientes(dias)

            if (!infoCitas || !infoClientes) return

            document.querySelector('#nuevosClientes').textContent = infoClientes.length
            document.querySelector('#citasPeriodo').textContent = infoCitas.length

            const { conteo } = LabelCountAnidado(infoCitas, 'nombre')

            const [claveMax] = Object.entries(conteo).reduce(
                ([maxClave, maxValue], [clave, valor]) => valor > maxValue ? [clave, valor] : [maxClave, maxValue],
                ['', -Infinity]
            )
            document.querySelector('#servicioPopular').textContent = claveMax || 'N/A'

            const ganancia = infoCitas.reduce((a, b) => {
                return b.estado === 'Asistida' ? a + b.servicio.valor : a
            }, 0)

            document.querySelector('#ganancias').textContent = new Intl.NumberFormat('es-cl', {
                style: 'currency', currency: 'CLP'
            }).format(ganancia)

            const clientesAnterior = await fetchClientesDiferencia((dias * 2), dias)
            const citasAnterior = await fetchCitasDiferencia((dias * 2), dias)

            const varClientes = calcularVariacion(infoClientes.length, clientesAnterior ? clientesAnterior.length : 0)
            actualizarDOMVariacion('#nuevosClientesPor', varClientes.porcentaje)

            const gananciaAnterior = (citasAnterior || []).reduce((a, b) => {
                return b.estado === 'Asistida' ? a + b.servicio.valor : a
            }, 0)
            const varGanancia = calcularVariacion(ganancia, gananciaAnterior)
            actualizarDOMVariacion('#gananciasPor', varGanancia.porcentaje)

            const varCitas = calcularVariacion(infoCitas.length, citasAnterior ? citasAnterior.length : 0)
            actualizarDOMVariacion('#citasPor', varCitas.porcentaje)

            const { labels: labelsEstado, valores: valoresEstado } = labelCount(infoCitas, 'estado')
            crearGraficoTorta('graficoCitas', 'citas', labelsEstado, valoresEstado, 'pie')

            const { labels: labelsServicios, valores: valoresServicios } = LabelCountAnidado(infoCitas, 'nombre')
            crearGraficoTorta('graficoMejoresServicios', 'servicios', labelsServicios, valoresServicios, 'doughnut')

            const infoFiltrado = infoCitas.filter((cita) => cita.estado != 'Cancelada' && cita.estado != 'Ausente')

            const diasLabel = saberDias(dias)

            const conteoBD = infoFiltrado.reduce((acc, obj) => {
  
                let f = obj.fecha_creacion ? obj.fecha_creacion.split('T')[0] : obj.fecha
                
                acc[f] = (acc[f] || 0) + 1
                return acc
            }, {})

            const datosCompletos = diasLabel.reduce((acc, fecha) => {
                acc[fecha] = conteoBD[fecha] || 0
                return acc
            }, {})

            const labelsLineas = Object.keys(datosCompletos).reverse()
            const valoresLineas = Object.values(datosCompletos).reverse()

            crearGraficoLinea('graficoLineas', labelsLineas, valoresLineas)
        }

        await ejecutarCarga(7)

        if (filtroPeriodo) {
            filtroPeriodo.addEventListener('change', (ev) => {
                ejecutarCarga(parseInt(ev.target.value))
            });
        }
    },

    destroy: () => {

        if (abortController) abortController.abort()

        if (charts.citas) charts.citas.destroy()
        if (charts.servicios) charts.servicios.destroy()
        if (charts.lineas) charts.lineas.destroy()

        charts = { citas: null, servicios: null, lineas: null }

        document.querySelectorAll('.tooltip').forEach(e => e.remove())
    }
}

function actualizarDOMVariacion(selector, porcentaje) {
    const elemento = document.querySelector(selector)
    if (!elemento) return

    const porc = parseFloat(porcentaje)
    if (porc > 0) {
        elemento.style.color = 'green'
        elemento.innerHTML = `<i class="bi bi-arrow-up-short"></i> ${porcentaje}%`
    } else if (porc < 0) {
        elemento.style.color = 'red'
        elemento.innerHTML = `<i class="bi bi-arrow-down-short"></i> ${porcentaje}%`
    } else {
        elemento.style.color = 'gray'
        elemento.innerHTML = `0%`
    }
}

function calcularVariacion(actual, anterior) {
    const diferencia = actual - anterior
    const porcentaje = anterior === 0
        ? (actual === 0 ? 0 : 100)
        : ((diferencia / anterior) * 100).toFixed(2)
    return { diferencia, porcentaje }
}

function saberDias(dias) {
    const hoy = new Date()
    let diasPeriodo = []
    const formatoLocal = (f) => {
        const y = f.getFullYear()
        const m = String(f.getMonth() + 1).padStart(2, "0")
        const d = String(f.getDate()).padStart(2, "0")
        return `${y}-${m}-${d}`
    }
    for (let i = 0; i < dias; i++) {
        let nueva = new Date(hoy)
        nueva.setDate(hoy.getDate() - i)
        diasPeriodo.push(formatoLocal(nueva))
    }
    return diasPeriodo
}

function labelCount(array, atributo) {
    let conteo = array.reduce((a, b) => {
        let propiedad = b[atributo]
        a[propiedad] = (a[propiedad] || 0) + 1
        return a
    }, {})
    return { labels: Object.keys(conteo), valores: Object.values(conteo) }
}

function LabelCountAnidado(array, atributo) {
    let conteo = array.reduce((a, b) => {
        if (b.servicio && b.servicio[atributo]) {
            let propiedad = b.servicio[atributo]
            a[propiedad] = (a[propiedad] || 0) + 1
        }
        return a;
    }, {});
    return { labels: Object.keys(conteo), valores: Object.values(conteo), conteo }
}

async function fetchHelper(url) {
    try {
        const response = await fetch(url, { signal: abortController?.signal })
        if (!response.ok) return null
        return await response.json()
    } catch (e) {
        if (e.name !== 'AbortError') console.error("Error fetch:", e)
        return null
    }
}

async function fetchDias(dias) {
    return fetchHelper(`/api/cita/?ultimos=${dias}`)
}
async function fetchClientes(dias) {
    return fetchHelper(`/api/usuario/?ultimos=${dias}`)
}
async function fetchCitasDiferencia(inicio, fin) {
    return fetchHelper(`/api/cita/?inicio=${inicio}&fin=${fin}`)
}
async function fetchClientesDiferencia(inicio, fin) {
    return fetchHelper(`/api/usuario/?inicio=${inicio}&fin=${fin}`)
}


function crearGraficoTorta(canvasId, chartKey, labels, data, tipo) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const paleta = ["#4E8DF5", "#6BA5F9", "#3A66DD", "#1E3A8A", "#38BDF8", "#74A3F6", "#3A6FC9", "#1C99D5", "#8DBBFB", "#5E85E7"]
    const colores = labels.map((_, i) => paleta[i % paleta.length])
    if (charts[chartKey]) {
        charts[chartKey].destroy()
    }
    charts[chartKey] = new Chart(ctx, {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label: 'Cantidad',
                data,
                backgroundColor: colores,
                borderWidth: 0
            }]
        },
        plugins: [ChartDataLabels],
        options: {
            cutout: tipo === 'doughnut' ? "50%" : "0%",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'circle', padding: 30 }
                },
                datalabels: {
                    color: "#fff",
                    anchor: 'center',
                    align: 'center',
                    font: { size: 14, weight: 'bold' },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
                        return ((value / total) * 100).toFixed(1) + "%"
                    }
                }
            }
        }
    })
}

function crearGraficoLinea(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (charts.lineas) {
        charts.lineas.destroy()
    }

    charts.lineas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Citas',
                data: data,
                fill: true,
                borderColor: "#3A66DD",
                backgroundColor: "rgba(58, 102, 221, 0.1)",
                tension: .2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    })
}