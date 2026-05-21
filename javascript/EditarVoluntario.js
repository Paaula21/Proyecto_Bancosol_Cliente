const API_BASE = 'http://localhost:3000';

let voluntarioActual = null;
let personaActual = null;

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idVoluntarioURL = urlParams.get('id_voluntario');

    if (!idVoluntarioURL) {
        alert("Error: No se ha especificado ningún voluntario para editar.");
        // CORRECCIÓN: Redirige a la página correcta (AsignaciónTurnos.html)
        window.location.href = 'AsignaciónTurnos.html';
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

        // 🛠️ CORRECCIÓN CRÍTICA: Convertimos ambos ID a String para que '1' sea igual a 1.
        voluntarioActual = voluntarios.find(v => String(v.id_voluntario) === String(idVol));

        if (!voluntarioActual) {
            alert("No se encontró el voluntario en la base de datos.");
            window.location.href = 'AsignaciónTurnos.html';
            return;
        }

        // CORRECCIÓN: También blindamos la comparación de la persona asociada por si acaso
        personaActual = personas.find(p => String(p.id_persona) === String(voluntarioActual.id_persona));

        // Rellenar inputs de texto habituales
        document.getElementById('nombre').value = personaActual ? personaActual.nombre_completo : '';
        document.getElementById('email').value = personaActual ? personaActual.email : '';
        document.getElementById('telefono').value = personaActual ? personaActual.telefono : '';

        // --- LÓGICA DE CHECKBOXES ---
        const turnosGuardados = voluntarioActual.preferencia_horario
            ? voluntarioActual.preferencia_horario.split(',').map(t => t.trim().toLowerCase())
            : [];

        const checkboxes = document.querySelectorAll('input[name="disponibilidad"]');

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

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
        popup.classList.add('active');
    });

    document.getElementById('btn-cancelar-edicion').addEventListener('click', () => {
        overlay.classList.remove('active');
        popup.classList.remove('active');
    });

    document.getElementById('btn-descartar').addEventListener('click', () => {
        // CORRECCIÓN: Redirección al listado correcto
        window.location.href = 'AsignaciónTurnos.html';
    });

    document.getElementById('btn-confirmar-edicion').addEventListener('click', async () => {
        await guardarCambiosVoluntario();
    });
}

async function guardarCambiosVoluntario() {
    if (!voluntarioActual || !personaActual) return;

    const nuevoNombre = document.getElementById('nombre').value;
    const nuevoEmail = document.getElementById('email').value;
    const nuevoTelefono = document.getElementById('telefono').value;

    const checkboxesActivos = document.querySelectorAll('input[name="disponibilidad"]:checked');
    const listaTurnos = Array.from(checkboxesActivos).map(cb => cb.value);
    const nuevaDisponibilidadString = listaTurnos.join(', ');

    try {
        // 1. Actualizar datos en /persona
        await fetch(`${API_BASE}/persona/${personaActual.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_completo: nuevoNombre,
                email: nuevoEmail,
                telefono: nuevoTelefono
            })
        });

        // 2. Actualizar disponibilidad en /voluntario
        await fetch(`${API_BASE}/voluntario/${voluntarioActual.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preferencia_horario: nuevaDisponibilidadString
            })
        });

        alert("Voluntario actualizado correctamente.");
        // CORRECCIÓN: Redirección final exitosa
        window.location.href = 'AsignaciónTurnos.html';

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar los cambios.");
    }
}