const indicadorImagen = document.querySelector('.carousel-indicators')
const espacioImagen = document.querySelector('.carousel-inner')

const seccionServicio = document.getElementById('seccionServicios')


fetch('obtener_imagenes/')
  .then(response => response.json())
  .then(data => {

    imagenCarousel(data)


  })

function imagenCarousel(lista) {

  if (lista.length == 0) {

    document.getElementById('carouselExampleIndicators').innerHTML = ''

  } else {


    lista.forEach((img, indice) => {

      let isActive = indice == 0

      indicadorImagen.innerHTML += `<button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="${isActive ? '0' : indice}" class="${isActive ? 'active' : indice}" aria-current="true" aria-label="Slide ${indice + 1}"></button>`


      espacioImagen.innerHTML += `<div data-bs-interval="7000" class="carousel-item ${isActive ? 'active' : ''}">
      <img src="${img.url}" class="d-block w-100" alt="${img.titulo}">
    </div>`


    })

  }


}



function agregarServiciosPrincipal(array) {

  array.forEach((s) => {

    if (s.estado == 'Activo') {

      let div = document.createElement('div')
      div.classList.add('item-servicio')
      div.classList.add('tarjeta')
      div.classList.add('p-3')
      let existeIcono = s.icono ? `
        <i class='${s.icono} fs-1' style='color:var(--color-boton-confirmar)'></i>
        ` : ''

      div.innerHTML = `
        ${existeIcono}
       <h3 class="texto-principal">${s.nombre}</h3>
       <p class="texto-secundario text-break">${s.descripcion}</p>
      
  
      `
      seccionServicio.appendChild(div)

    }


  })


}

fetch("/panel/obtener_servicios").then(response => response.json()).then(data => {
  agregarServiciosPrincipal(data)

})


const btnAgendarCita = document.getElementById('btnAgendarCita')




const seccionNegocio = document.getElementById('infoNegocio')

let titulo = document.getElementById('tituloPagina')
let descripcion = document.getElementById('descripcionPagina')

let campos = seccionNegocio.querySelectorAll('li')

fetch('obtener_info_negocio/')
  .then(response => response.json())
  .then(data => {


    titulo.textContent = data.nombre
    descripcion.textContent = data.descripcion
    campos[0].textContent += data.direccion
    campos[1].textContent += data.telefono
    campos[2].textContent += data.email
  })


btnAgendarCita.addEventListener('click', (ev) => {
  ev.preventDefault()
  fetch('/estado_login/')
    .then(response => response.json())
    .then(data => {

      if (!data.estado) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: 'Necesita iniciar sesión para agendar una cita',
          showConfirmButton: true,
          theme: 'light',
          confirmButtonText: 'Iniciar Sesion'
        }).then((result) => {
          if (result.isConfirmed) {

            window.location.href = '/login_registro/'
          }

        })
      }
      else{
        window.location.href = '/agendar_cita/'
      }
    })

})


let HorarioAtencionPrincipal = document.querySelector('#horarioAtencionPrincipal')

let inicio = '_inicio'
let fin = '_fin'

const Dias = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
]

fetch('/obtener_horario/')
  .then(response => response.json())
  .then(data => {
    let inicioString
    let finString
    for (let dia of Dias) {
      let p = document.createElement('small')
      p.style.textTransform = 'capitalize'
      p.classList.add('texto-secundario')
      p.style.margin = '0px'

      inicioString = data[dia + inicio].slice(0, 5)
      finString = data[dia + fin].slice(0, 5)

      if (inicioString === finString){
        p.innerHTML = `${dia}:<strong data-dia= ${dia}> Cerrado </strong>`

      }else{
        p.innerHTML = `${dia}:<strong data-dia= ${dia}> ${inicioString} - ${finString} </strong>`

      }
      HorarioAtencionPrincipal.appendChild(p)
    }

  })