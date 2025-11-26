const Meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const Dias = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miercoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado'
}

let fecha = new Date()
let mesActual = fecha.getMonth()
let añoActual = fecha.getFullYear()

const calendario = document.querySelector('#calendario')
const mesAño = document.querySelector('#mesAño')
const inputFecha = document.querySelector('#fecha')
const inputHora = document.querySelector('#hora')
const btnSiguienteMes = document.querySelector('#btnSiguienteMes')
const btnAnteriorMes = document.querySelector('#btnAnteriorMes')
const selectServicios = document.querySelector('#selectServicios')
const horasDisponibles = document.querySelector('#horasDisponibles')
const diasCalendario = document.querySelector('#diasCalendario')


function agregarDias() {

    diasCalendario.innerHTML = `
                        <div class='texto-secundario'>Lu</div>
                        <div class='texto-secundario'>Ma</div>
                        <div class='texto-secundario'>Mi</div>
                        <div class='texto-secundario'>Ju</div>
                        <div class='texto-secundario'>Vi</div>
                        <div class='texto-secundario'>Sa</div>
                        <div class='texto-secundario'>Do</div>
    `

    let primerDia = new Date(añoActual, mesActual, 1)
    let ultimoDia = new Date(añoActual, mesActual + 1, 0)

    let primerDiaSemana = primerDia.getDay()
    let diasMes = ultimoDia.getDate()

    let espaciosVacios = primerDiaSemana == 0 ? 6 : primerDiaSemana - 1

    for (let i = 0; i < espaciosVacios; i++) {

        let div = document.createElement('div')
        diasCalendario.appendChild(div)
    }
    for (let i = 1; i <= diasMes; i++) {

        let div = document.createElement('div')
        div.textContent = i
        div.classList.add('dias')
        div.classList.add('texto-secundario')
        diasCalendario.appendChild(div)
    }
    mesAño.textContent = `${Meses[mesActual]} ${añoActual}`
}

agregarDias()


calendario.addEventListener('click', (ev) => {
    if (ev.target.id == 'btnSiguienteCalendario') {
        mesActual++
        if (mesActual > 11) {
            mesActual = 0
            añoActual++
        }
        agregarDias()
    } else if (ev.target.id == 'btnAnteriorCalendario') {
        mesActual--
        if (mesActual < 0) {
            mesActual = 11
            añoActual--
        }
        agregarDias()
    } else if (ev.target.className.includes('dias')) {

        let dias = document.querySelectorAll('.dias')
        dias.forEach((dia) => {

            if (dia.classList.contains('dia-seleccionado')) {
                dia.classList.remove('dia-seleccionado')
            }
        })

        ev.target.classList.add('dia-seleccionado')

        let fechaSinFormateo = new Date(añoActual, mesActual, ev.target.textContent)
        let fechaFormateada = fechaSinFormateo.toISOString().split('T')[0]
        inputFecha.value = fechaFormateada

        let diaSelecctionado = Dias[new Date(añoActual, mesActual, ev.target.textContent).getDay()]

        let fechaSeleccionada = new Date(añoActual, mesActual, ev.target.textContent)

        inputHora.value = ''
        obtenerHorasOcupadas(fechaFormateada, diaSelecctionado, fechaSeleccionada)
        // mostrarHoras(diaSelecctionado, fechaSeleccionada)

    }



})


function obtenerHorasOcupadas(fecha, diaSelecctionado, fechaSeleccionada) {
    fetch(`/obtener_cita_dia/${fecha}/`)
        .then(response => response.json())
        .then(horasOcupadas => {
            mostrarHoras(diaSelecctionado, fechaSeleccionada, horasOcupadas)
        })
}



fetch('/obtener_servicios/')
    .then(response => response.json())
    .then(data => {

        data.forEach((servicio) => {
            let option = document.createElement('option')
            if (servicio.estado == 'Activo') {

                option.value = servicio.id

                option.textContent = `${servicio.nombre}`

                selectServicios.append(option)
            }

        })

    })


$(document).ready(function () {
    const $select = $('#selectServicios')

    $select.select2({
        language: {
            noResults: () => "No se encontraron resultados",
            searching: () => "Buscando...",
            errorLoading: () => "No se pudieron cargar los resultados"
        }
    })

    $select.on('change', function () {
        const valor = $(this).val()

        fetch(`/obtener_servicios/${valor}`)
            .then(response => response.json())
            .then(data => {

                if (data.length == undefined) {
                    document.querySelector('#valor').textContent = 'Valor: $' + data.valor
                } else {

                    $('#duracion').val('')
                    $('#valor').val('')
                }
            })
    })
})


const btnAgendarCita = document.getElementById('btnAgendarCita')

btnAgendarCita.addEventListener('click', (ev) => {
    btnAgendarCita.disabled = true
    btnAgendarCita.innerHTML = `Agendar cita <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>`

    ev.preventDefault()

    let formulario = document.querySelector('form')
    let formData = new FormData(formulario)

    fetch('/agendar_cita/', {
        body: formData,
        method: 'POST'
    })
        .then(async response => {
            const data = await response.json()

            if (!response.ok) {
                return Promise.reject(data)
            }
            return data
        })
        .then(data => {
            // --- ZONA DE ÉXITO (Solo llega aquí si status fue 200) ---

            Swal.fire({
                position: "center",
                icon: "success",
                title: data, // Mensaje del servidor
                showConfirmButton: false,
                timer: 2000,
                theme: 'light'
            }).then(() => {
                window.location.href = '/agendar_cita/'
            })

            document.querySelector('#mensajeFecha').textContent = ''
            document.querySelector('#mensajeServicio').textContent = ''
            document.querySelector('#mensajeHora').textContent = ''
        })
        .catch(error => {
            console.error("Errores recibidos:", error)

            document.querySelector('#mensajeFecha').textContent = error.fecha ? error.fecha[0] : ''
            document.querySelector('#mensajeServicio').textContent = error.servicio ? error.servicio[0] : ''
            document.querySelector('#mensajeHora').textContent = error.hora ? error.hora[0] : ''

            if (!error.fecha && !error.servicio && !error.hora) {
                Swal.fire({
                    position: "center",
                    icon: "error",
                    title: "Error al agendar",
                    text: "Verifique los datos e intente nuevamente",
                    showConfirmButton: true,
                    theme: 'light'
                })
            }
        })
        .finally(() => {
            btnAgendarCita.disabled = false
            btnAgendarCita.innerHTML = `Agendar cita`
        })
})

function mostrarHoras(dia, fechaSeleccionada, horasOcupadas) {
    const hoy = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
    const horaActual = fecha.toTimeString().slice(0, 5)
    const fechaSinHora = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate())

    horasDisponibles.innerHTML = ''
    horasDisponibles.classList.remove('horas')
    fetch('/obtener_horario/')
        .then(response => response.json())
        .then(data => {
            const inicio = data[`${dia.toLowerCase()}_inicio`]
            const fin = data[`${dia.toLowerCase()}_fin`]
            if (fechaSinHora < hoy) return



            let comienzo = inicio.slice(0, 5)
            while (comienzo < fin.slice(0, 5)) {
                if (horasOcupadas.includes(`${comienzo}:00`)) {
                    const button = document.createElement('button')
                    button.classList.add('btn', 'btn-cancelar')
                    button.type = 'button'
                    button.textContent = comienzo
                    button.disabled = true
                    button.style.border = 'none'
                    button.style.cursor = 'not-allowed'
                    horasDisponibles.append(button)

                }
                else if (fechaSinHora > hoy || comienzo > horaActual) {
                    const button = document.createElement('button')
                    button.classList.add('btn', 'btn-cancelar')
                    button.type = 'button'
                    button.textContent = comienzo
                    horasDisponibles.append(button)
                }

                const [h, m] = comienzo.split(":").map(Number)
                const fecha = new Date()
                fecha.setHours(h, m)
                fecha.setHours(fecha.getHours() + 1)

                comienzo = fecha.toTimeString().slice(0, 5)
            }


            horasDisponibles.classList.add('horas')
        })
}




horasDisponibles.addEventListener('click', (ev) => {
    if (ev.target.tagName == 'BUTTON') {
        let horas = horasDisponibles.querySelectorAll('button')
        horas.forEach((hora) => {
            if (hora.classList.contains('btn-principal')) {
                hora.classList.remove('btn-principal')
                hora.classList.add('btn-cancelar')
            }
        })
        ev.target.classList.add('btn-principal')
        ev.target.classList.remove('btn-cancelar')
        inputHora.value = ev.target.textContent + ':00'
    }
})

