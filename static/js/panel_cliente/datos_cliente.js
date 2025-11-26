let abortController = null

export default {
    init: async () => {
        abortController = new AbortController()

        const form = document.getElementById('form-mis-datos')
        const btn = document.getElementById('btn-guardar-datos')

        if (btn && form) {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                guardarDatos(form, btn)
            })
        }
    },

    destroy: () => {
        if (abortController) abortController.abort()
    }
}

function guardarDatos(form, btn) {
    const formData = new FormData(form)
    const originalText = btn.innerHTML
    
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...'
    limpiarErrores()

    fetch('/panel/mi-cuenta/datos/', { 
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        signal: abortController?.signal
    })
    .then(async response => {
        const data = await response.json()
        if (!response.ok) return Promise.reject(data)
        return data
    })
    .then(data => {
        Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Tus datos se han guardado.',
            timer: 1500, showConfirmButton: false
        })
    })
    .catch(error => {
        console.error(error)
        if (error && typeof error === 'object') {
            mostrarErrores(error)
            Swal.fire({ icon: 'error', title: 'Error', text: 'Revisa los campos en rojo' })
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar' })
        }
    })
    .finally(() => {
        btn.disabled = false
        btn.innerHTML = originalText
    })
}

function limpiarErrores() {
    document.querySelectorAll('[id^="error_"]').forEach(el => el.textContent = '')
}

function mostrarErrores(errores) {
    // Recorre las llaves (first_name, email, etc)
    Object.keys(errores).forEach(key => {
        const el = document.getElementById(`error_${key}`)
        if (el) el.textContent = errores[key][0]
    })
}