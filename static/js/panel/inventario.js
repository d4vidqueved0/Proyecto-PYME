let modalEdit = null;
let $selectAdd = null;
let $selectEdit = null;
let abortController = null;

export default {
    init: async () => {
        abortController = new AbortController();
        const signal = abortController.signal;

        const formInsumo = document.querySelector('#formInsumo');
        const formEditInsumo = document.querySelector('#formEditInsumo');
        const btnAgregar = document.querySelector('#btnAgregarInsumo');
        const btnEditar = document.querySelector('#btnEditInsumo');
        const tablaInsumos = document.querySelector('tbody');
        const paginacion = document.querySelector('#paginacion');
        const buscarInsumo = document.querySelector('#buscarServicio')

        const modalEl = document.querySelector('#modalEditInsumo');
        if (modalEl) {
            modalEdit = new bootstrap.Modal(modalEl);

            modalEl.addEventListener('hide.bs.modal', () => {
                if (document.activeElement) document.activeElement.blur();
            });
        }

    
        await cargarServiciosOptions(signal);
        inicializarSelect2();

        mostrarInsumos('/api/insumo/?page=', signal);

        if (btnAgregar) {
            btnAgregar.addEventListener('click', () => {
                validarYAgregarInsumo(formInsumo);
            });
        }

        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                guardarEdicionInsumo(formEditInsumo);
            });
        }
        if (buscarInsumo) {
            let tiempoEntreBusquedas = null
            buscarInsumo.addEventListener('input', (ev) => {
                clearTimeout(tiempoEntreBusquedas)
                tiempoEntreBusquedas = setTimeout(() => {
                    mostrarInsumos(`/api/insumo/?page=1&search=${ev.target.value}`, abortController.signal);
                }, 500)

            })

        }

        if (tablaInsumos) {
            tablaInsumos.addEventListener('click', (ev) => {
                if (ev.target.id.includes('btnEditar')) {
                    let idInsumo = ev.target.id.replace('btnEditar', '');
                    cargarDatosEdicion(idInsumo, formEditInsumo);
                }

                if (ev.target.id.includes('btnEliminar')) {
                    let idInsumo = ev.target.id.replace('btnEliminar', '');
                    confirmarEliminacion(idInsumo, ev.target.closest('tr'));
                }
            });
        }
        if (paginacion) {
            paginacion.addEventListener('click', (ev) => {
                if (ev.target.tagName == 'BUTTON' && ev.target.classList.contains('btn')) {
                    let pagina = ev.target.textContent;
                    mostrarInsumos(`/api/insumo/?page=${pagina}&search=${buscarInsumo.value}`, signal);
                }
            });
        }
    },

    destroy: () => {
    

        if (abortController) abortController.abort();

        if (modalEdit) {
            modalEdit.hide();
            modalEdit = null;
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        if ($selectAdd) {
            $selectAdd.select2('destroy');
            $selectAdd = null;
        }
        if ($selectEdit) {
            $selectEdit.select2('destroy');
            $selectEdit = null;
        }
        $('.select2-container').remove();
    }
};


async function cargarServiciosOptions(signal) {
    try {
        const response = await fetch('/obtener_servicios/', { signal });
        const data = await response.json();

        const selectAdd = document.querySelector('#id_servicios');
        const selectEdit = document.querySelector('#id_servicios_edit');

        [selectAdd, selectEdit].forEach(select => {
            if (select) {
                select.innerHTML = '';
                data.forEach(servicio => {
                    let option = document.createElement('option');
                    option.value = servicio.id;
                    option.textContent = servicio.nombre;
                    select.appendChild(option);
                });
            }
        });

    } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
    }
}

function inicializarSelect2() {
    $selectAdd = $('#id_servicios').select2();

    $selectEdit = $('#id_servicios_edit').select2({
        width: '100%',
        dropdownParent: $('#modalEditInsumo') 
    });
}


function mostrarInsumos(url, signal) {
    fetch(url, { signal })
        .then(response => {
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector('tbody');
            const paginacion = document.getElementById('paginacion');
            const resultados = document.getElementById('resultados');

            if (!tbody) return;

            tbody.innerHTML = '';
            paginacion.innerHTML = '';

            data.results.forEach(i => {
                const tr = document.createElement('tr');
                tr.id = `idFila${i.id}`;
                tr.dataset.insumo = i.nombre;
                tr.innerHTML = `
                    <td class='fw-bold'>${i.nombre}</td>
                    <td class='text-break'>${i.cantidad}</td>
                    <td class='text-break'>${i.unidad}</td>
                    <td>$${i.costo}</td>
                    <td>${i.servicios.length}</td>
                    <td class='botones' style='width:15%'>
                        <button id='btnEditar${i.id}' class="bi bi-pen btn" style='color:var(--color-boton-editar)'></button>
                        <button id='btnEliminar${i.id}' class="bi bi-trash btn" style='color:var(--color-boton-eliminar)'></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (resultados) {
                if (data.results.length) {
                    resultados.textContent = `Mostrando ${data.start_index}-${data.end_index} de ${data.count} resultados`;
                } else {
                    resultados.textContent = 'No se encontraron resultados';
                }
            }

            const totalPaginas = data.total_pages;
            const paginaActual = data.current_page;

            for (let i = 1; i <= totalPaginas; i++) {
                if (i < paginaActual - 2 && i !== 1) {
                    if (!paginacion.querySelector('.puntos')) crearBotonPuntos(paginacion, 'puntos');
                    continue;
                }
                if (i > paginaActual + 2 && i !== totalPaginas) {
                    if (!paginacion.querySelector('.puntosFinal')) crearBotonPuntos(paginacion, 'puntosFinal');
                    continue;
                }

                const button = document.createElement('button');
                button.classList.add('btn');
                button.textContent = i;
                if (i === paginaActual) button.classList.add('btn-principal');
                paginacion.appendChild(button);
            }
        })
        .catch(e => { if (e.name !== 'AbortError') console.error(e); });
}

function crearBotonPuntos(contenedor, clase) {
    let btn = document.createElement('button');
    btn.textContent = '...';
    btn.classList.add(clase);
    btn.style.border = 'none';
    btn.style.background = 'var(--color-fondo-principal)';
    contenedor.appendChild(btn);
}


function validarYAgregarInsumo(form) {
    let formData = new FormData(form);

    fetch('/api/insumo/', {
        method: 'POST',
        body: formData,
        headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
    })
        .then(response => {
            if (!response.ok) return response.json().then(err => Promise.reject(err));

            // Éxito
            Swal.fire({
                position: "center", icon: "success", title: "Se agregó correctamente",
                showConfirmButton: false, timer: 1500, theme: 'light'
            });

            limpiarErrores();
            form.reset();
            $('#id_servicios').val(null).trigger('change');

            mostrarInsumos('/api/insumo/?page=');
        })
        .catch(errores => mostrarErrores(errores));
}


function cargarDatosEdicion(id, formEdit) {
    formEdit.dataset.idInsumo = id;
    fetch(`/api/insumo/${id}`)
        .then(res => res.json())
        .then(data => {
            document.querySelector('#id_nombre_edit').value = data.nombre;
            document.querySelector('#id_cantidad_edit').value = data.cantidad;
            document.querySelector('#id_unidad_edit').value = data.unidad;
            document.querySelector('#id_costo_edit').value = data.costo;
            document.querySelector('#id_stock_minimo_edit').value = data.stock_minimo;

            $('#id_servicios_edit').val(data.servicios).trigger('change');
            if (modalEdit) modalEdit.show();
        });
}

function guardarEdicionInsumo(formEdit) {
    const idEditar = formEdit.dataset.idInsumo;
    const seleccionados = $('#id_servicios_edit').val() || [];

    const data = {
        nombre: formEdit.nombre.value,
        cantidad: formEdit.cantidad.value,
        unidad: formEdit.unidad.value,
        costo: formEdit.costo.value,
        stock_minimo: formEdit.stock_minimo.value,
        servicios: seleccionados,
    };

    fetch(`/api/insumo/${idEditar}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': formEdit.csrfmiddlewaretoken.value
        },
        body: JSON.stringify(data)
    })
        .then(async response => {
            if (!response.ok) {
                const errores = await response.json();
                throw errores;
            }
            return response.json();
        })
        .then(insumoEditado => {
            Swal.fire({
                position: "center", icon: "success", title: "Se editó correctamente",
                showConfirmButton: false, timer: 1500, theme: 'light'
            });

            if (modalEdit) modalEdit.hide();
            actualizarFila(insumoEditado);
        })
        .catch(err => console.error(err));
}

function actualizarFila(item) {
    const fila = document.querySelector(`#idFila${item.id}`);
    if (fila) {
        fila.innerHTML = `
            <td class='fw-bold'>${item.nombre}</td>
            <td class='text-break'>${item.cantidad}</td>
            <td class='text-break'>${item.unidad}</td>
            <td>$${item.costo}</td>
            <td>${item.servicios.length}</td>
            <td class='botones' style='width:15%'>
                <button id='btnEditar${item.id}' class="bi bi-pen btn" style='color:var(--color-boton-editar)'></button>
                <button id='btnEliminar${item.id}' class="bi bi-trash btn" style='color:var(--color-boton-eliminar)'></button>
            </td>
        `;
    }
}


function confirmarEliminacion(id, fila) {
    Swal.fire({
        title: "¿Estas seguro de eliminar este insumo?", icon: "warning", theme: 'light',
        showCancelButton: true, confirmButtonColor: "#3085d6", cancelButtonColor: "#d33",
        confirmButtonText: "Si"
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarInsumo(id, fila);
        }
    });
}

function eliminarInsumo(id, fila) {
    let token = document.querySelector('[name=csrfmiddlewaretoken]').value;
    fetch(`/api/insumo/${id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': token }
    })
        .then(response => {
            if (response.ok) {
                fila.remove();
                Swal.fire({
                    position: "center", icon: "success", title: "Eliminado correctamente",
                    showConfirmButton: false, timer: 1500, theme: 'light'
                });
            } else {
                Swal.fire({ icon: "error", title: "Error al eliminar", theme: 'light' });
            }
        });
}


function limpiarErrores() {
    const campos = ['nombre', 'cantidad', 'unidad', 'costo', 'stock_minimo'];
    campos.forEach(c => {
        const el = document.querySelector(`#error_${c}`);
        if (el) el.textContent = '';
    });
}

function mostrarErrores(errores) {
    if ('nombre' in errores) document.querySelector('#error_nombre').textContent = errores.nombre[0];
    if ('cantidad' in errores) document.querySelector('#error_cantidad').textContent = errores.cantidad[0];
    if ('unidad' in errores) document.querySelector('#error_unidad').textContent = 'Seleccione unidad';
    if ('costo' in errores) document.querySelector('#error_costo').textContent = errores.costo[0];
    if ('stock_minimo' in errores) document.querySelector('#error_stock_minimo').textContent = errores.stock_minimo[0];
} 