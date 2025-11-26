export default class Router {
    constructor(routes) {
        this.routes = routes
        this.appContainer = document.getElementById("contenidoPanel")
        this.currentView = null
        this.loader = document.getElementById('modal-carga')

        window.addEventListener("popstate", () => {
            this.loadRoute(location.pathname)
        })

        document.body.addEventListener("click", (ev) => {
            const link = ev.target.closest("[data-link]")
            if (link) { 
                ev.preventDefault()
                this.navigateTo(link.href)
            }
        })
    }

    navigateTo(url) {
        history.pushState(null, null, url)
        this.loadRoute(url)
    }

    async loadRoute(url) {
        if (this.loader){ 
            this.loader.classList.remove('modal-carga-oculto')
            this.appContainer.classList.add('contenido-oculto')
        }
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy()
        }
        const path = new URL(url, location.origin).pathname
        
        let match = this.routes.find(r => r.path === path) || 
                    this.routes.find(r => r.path === path + '/') ||
                    this.routes.find(r => r.path === path.slice(0, -1))

        this.actualizarMenu(path)
        if (match && match.titulo){
            document.title = match.titulo
        }

        try {
            const response = await fetch(path, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' } 
            })
            
            if (!response.ok) throw new Error("Error cargando vista")

            const html = await response.text()
            this.appContainer.innerHTML = html

            if (match && match.view) {
                this.currentView = match.view
                if (this.currentView.init) await this.currentView.init()
            }

        } catch (error) {
            console.error(error)
        }finally{
            if (this.loader){
                 this.loader.classList.add('modal-carga-oculto')
                this.appContainer.classList.remove('contenido-oculto')
                }
        }
    }
    actualizarMenu(path) {
        document.querySelectorAll('[data-link]').forEach(btn => {
            btn.classList.remove('boton-seleccionado') 
            if (btn.getAttribute('href') === path) {
                btn.classList.add('boton-seleccionado')
            }
        })
    }
}