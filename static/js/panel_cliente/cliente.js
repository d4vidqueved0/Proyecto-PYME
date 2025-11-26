import Router from "../router.js";
import MisCitasView from "./citas_cliente.js";
import MisDatosView from './datos_cliente.js'


const routes = [
    { 
        path: "/panel/mi-cuenta/citas/", 
        view: MisCitasView,
        titulo: "Mis Citas"
    },
    { 
        path: "/panel/mi-cuenta/datos/", 
        view: MisDatosView,
        titulo: "Mis Datos Personales"
    },
];

document.addEventListener("DOMContentLoaded", () => {
    const router = new Router(routes);
    let path = location.pathname;
    if (path === '/mi-cuenta/' || path === '/mi-cuenta') {
        path = '/mi-cuenta/citas/';
        history.replaceState(null, null, path);
    }
    router.loadRoute(path);
});