import Router from "../router.js"
import Dashboard from "./dashboard.js"
import GestionCitas from "./gestionCitas.js"
import Servicios from "./servicios.js"
import Personalizacion from "./personalizacion.js"
import Inventario from "./inventario.js"
import Notificaciones from "./notificaciones.js"

document.querySelector('header').hidden = true

const routes = [
    { path: "/panel/dashboard/", view: Dashboard, titulo: 'Dashboard'},
    { path: "/panel/citas/", view: GestionCitas, titulo: 'Gestión de citas'},
    { path: "/panel/servicios/", view: Servicios, titulo: 'Gestión de servicios'},
    { path: "/panel/personalizacion/", view:Personalizacion, titulo: 'Personalización'},
    { path: "/panel/inventario/", view: Inventario, titulo: 'Gestión de inventario'},
]

document.addEventListener("DOMContentLoaded", () => {
    
    const router = new Router(routes)
    let path = location.pathname
    if (path == '/panel/' || path == '/panel') {
        path = '/panel/dashboard/'
        history.replaceState(null, null, path)
    }
    router.loadRoute(path)
    const notiSystem = new Notificaciones() 
    notiSystem.init()                         
})