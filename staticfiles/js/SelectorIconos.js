export default class SelectorIconos {
  static iconCache = null

  constructor({ input, trigger, container, search, jsonPath }) {
    this.input = document.querySelector(input)
    this.trigger = document.querySelector(trigger)
    this.container = document.querySelector(container)
    this.search = document.querySelector(search)
    this.jsonPath = jsonPath

    this.iconos = []
    this.init()
  }

  async init() {
    await this.cargarIconos()
    this.agregarEventos()
  }

  async cargarIconos() {
    if (!SelectorIconos.iconCache) {
      const respuesta = await fetch(this.jsonPath)
      SelectorIconos.iconCache = await respuesta.json() 
    }

    
    const data = SelectorIconos.iconCache
    const fragment = document.createDocumentFragment()
    Object.entries(data).forEach(([nombre, datos]) => {
      const i = document.createElement("i")
      i.classList.add(`fa-${datos.styles[0]}`, `fa-${nombre}`)
      i.style.margin = "10px"
      i.dataset.icono = nombre
      i.classList.add('texto-principal')
      fragment.appendChild(i)
    })
    
    this.container.appendChild(fragment)
    this.iconos = this.container.querySelectorAll("i")
  }

  agregarEventos() {
    this.trigger.addEventListener("click", () => {
      this.container.hidden = !this.container.hidden
    })

    this.container.addEventListener("click", (ev) => {
      if (ev.target.tagName === "I") {
        const claseIcono = ev.target.classList.value
        this.trigger.innerHTML = `<i class="${claseIcono} fs-1"></i>`
        this.input.value = claseIcono
        this.container.hidden = true
      }
    })

    this.search.addEventListener("input", () => {
      const texto = this.search.value.toLowerCase()

      this.iconos.forEach((icono) => {
        const visible = icono.dataset.icono.includes(texto)
        icono.style.display = visible ? "inline-block" : "none"
      })
    })
  }
}
