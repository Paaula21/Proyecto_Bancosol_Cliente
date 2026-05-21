const API_BASE = 'http://localhost:3000';

let voluntarioActual = null;
let personaActual = null;

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idVoluntarioURL = urlParams.get('id_voluntario');

    if (!idVoluntarioURL) {
        alert("Error: No se ha especificado ningún voluntario para editar.");
        window.location.href = 'AsignacionTurnos.html';
        return;
    }

    await cargarDatosVoluntario(idVoluntarioURL);
    configurarEventosBotones();
});

async function cargarDatosVoluntario(idVol) {
    try {
        const resVoluntarios = await fetch(`${API_BASE}/voluntario`);
        const voluntarios = await resVoluntarios.json();

        const resPersonas = await fetch(`${API_BASE}/persona`);
        const personas = await resPersonas.json();

        // Conversión segura de identificadores a String
        voluntarioActual = voluntarios.find(v => String(v.id_voluntario) === String(idVol));

        if (!voluntarioActual) {
            alert("No se encontró el voluntario en la base de datos.");
            window.location.href = 'AsignacionTurnos.html';
            return;
        }

        personaActual = personas.find(p => String(p.id_persona) === String(voluntarioActual.id_persona));

        // Rellenar datos en los inputs del formulario
        document.getElementById('nombre').value = personaActual ? personaActual.nombre_completo : '';
        document.getElementById('email').value = personaActual ? personaActual.email : '';
        document.getElementById('telefono').value = personaActual ? personaActual.telefono : '';

        // --- CARGAR CHECKBOXES DE ASISTENCIA SEMANAL ---
        const turnosGuardados = voluntarioActual.preferencia_horario
            ? voluntarioActual.preferencia_horario.split(',').map(t => t.trim().toLowerCase())
            : [];

        // Buscamos los inputs con name="asistencia" como en el registro
        const checkboxes = document.querySelectorAll('input[name="asistencia"]');

        checkboxes.forEach(cb => {
            if (turnosGuardados.includes(cb.value.toLowerCase())) {
                cb.checked = true;
            }
        });

    } catch (error) {
        console.error("Error cargando los datos:", error);
        alert("Hubo un problema al conectar con la base de datos.");
    }
}

function configurarEventosBotones() {
    const form = document.getElementById('form-edit-voluntario');
    const overlay = document.getElementById('overlay-confirmar');
    const popup = document.getElementById('popup-confirmar');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (overlay && popup) {
                overlay.classList.add('active');
                popup.classList.add('active');
            } else {
                guardarCambiosVoluntario();
            }
        });
    }

    const btnCancelar = document.getElementById('btn-cancelar-edicion');
    if (btnCancelar && overlay && popup) {
        btnCancelar.addEventListener('click', () => {
            overlay.classList.remove('active');
            popup.classList.remove('active');
        });
    }

    const btnDescartar = document.getElementById('btn-descartar');
    if (btnDescartar) {
        btnDescartar.addEventListener('click', () => {
            window.location.href = 'AsignacionTurnos.html';
        });
    }

    const btnConfirmar = document.getElementById('btn-confirmar-edicion');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            await guardarCambiosVoluntario();
        });
    }
}

async function guardarCambiosVoluntario() {
    if (!voluntarioActual || !personaActual) return;

    const nuevoNombre = document.getElementById('nombre').value;
    const nuevoEmail = document.getElementById('email').value;
    const nuevoTelefono = document.getElementById('telefono').value;

    // --- RECOPILAR TURNOS SELECCIONADOS (name="asistencia") ---
    const checkboxesActivos = document.querySelectorAll('input[name="asistencia"]:checked');
    const listaTurnos = Array.from(checkboxesActivos).map(cb => cb.value);
    const nuevaDisponibilidadString = listaTurnos.join(', '); // Formato: "lunes-mañana, martes-tarde"

    // VALIDACIÓN: El voluntario debe tener al menos un turno marcado
    if (listaTurnos.length === 0) {
        alert("Debes seleccionar al menos una disponibilidad.");

        const overlay = document.getElementById('overlay-confirmar');
        const popup = document.getElementById('popup-confirmar');
        if (overlay && popup) {
            overlay.classList.remove('active');
            popup.classList.remove('active');
        }
        return;
    }

    try {
        // 1. Actualizar datos en la entidad /persona
        await fetch(`${API_BASE}/persona/${personaActual.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_completo: nuevoNombre,
                email: nuevoEmail,
                telefono: nuevoTelefono
            })
        });

        // 2. Actualizar datos de turnos en la entidad /voluntario
        await fetch(`${API_BASE}/voluntario/${voluntarioActual.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preferencia_horario: nuevaDisponibilidadString
            })
        });

        alert("Voluntario actualizado correctamente.");
        window.location.href = 'AsignacionTurnos.html';

    } catch (error) {
        console.error("Error al guardar en el servidor:", error);
        alert("Hubo un error al guardar los cambios.");
    }
}