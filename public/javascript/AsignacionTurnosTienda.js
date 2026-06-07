const API_BASE = 'http://localhost:3000';
let parametrosURL = new URLSearchParams(window.location.search);
let idCampanaURL = parametrosURL.get('id_campana');

let volunteersData = [];
let idTiendaSeleccionada = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (idCampanaURL) {
        document.getElementById('panel-tiendas').style.display = 'block';
        document.getElementById('titulo-campana-tiendas').textContent = `Tiendas de la Campaña: ${idCampanaURL}`;
        await cargarTiendasCampana(idCampanaURL);
    } else {
        // Comportamiento normal si se entra desde el menú lateral
        document.getElementById('panel-voluntarios').style.display = 'block';
        document.getElementById('filtros-voluntarios').style.display = 'flex';
        loadVolunteers();
    }
});

async function cargarTiendasCampana(idCampana) {
    try {
        const [establecimientos, asignaciones, cadenas] = await Promise.all([
            fetch(`${API_BASE}/establecimiento`).then(r => r.json()),
            fetch(`${API_BASE}/asignacion_coordinador`).then(r => r.json()),
            fetch(`${API_BASE}/cadena`).then(r => r.json())
        ]);

        const tiendasIds = asignaciones
            .filter(a => a.id_campana === idCampana)
            .map(a => a.id_tienda);

        const tiendasFiltradas = establecimientos.filter(est => tiendasIds.includes(est.id_establecimiento));

        const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
        tbodyTiendas.innerHTML = '';

        if (tiendasFiltradas.length === 0) {
            tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay tiendas asignadas a esta campaña.</td></tr>';
            return;
        }

        tiendasFiltradas.forEach(tienda => {
            const cadenaObj = cadenas.find(c => c.id_cadena === tienda.id_cadena);
            const tr = document.createElement('tr');

            tr.innerHTML = `
        <td><strong>${tienda.nombre_resena}</strong></td>
        <td>${cadenaObj ? cadenaObj.nombre_cadena : tienda.id_cadena}</td>
        <td>${tienda.id_establecimiento}</td> <td><button class="btn btn--primary btn-seleccionar-tienda" data-id="${tienda.id_establecimiento}">Asignar turnos</button></td>
    `;
            tbodyTiendas.appendChild(tr);
        });

        document.querySelectorAll('.btn-seleccionar-tienda').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Quitar selección previa
                document.querySelectorAll('#tabla-tiendas-campana tr').forEach(r => r.classList.remove('selected'));
                e.target.closest('tr').classList.add('selected');

                idTiendaSeleccionada = e.target.getAttribute('data-id');
                document.getElementById('filtros-voluntarios').style.display = 'flex';
                document.getElementById('panel-voluntarios').style.display = 'block';
                loadVolunteers();
            });
        });

    } catch (error) {
        console.error("Error al cargar tiendas:", error);
    }
}

async function loadVolunteers() {
    const tbody = document.getElementById('tabla-voluntarios');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Cargando voluntarios...</td></tr>`;

    try {
        const [voluntarios, personas] = await Promise.all([
            fetch(`${API_BASE}/voluntario`).then(r => r.json()),
            fetch(`${API_BASE}/persona`).then(r => r.json())
        ]);

        volunteersData = voluntarios.map(vol => {
            const per = personas.find(p => String(p.id_persona) === String(vol.id_persona));
            return {
                id_voluntario: vol.id_voluntario,
                nombre: per ? per.nombre_completo : "Desconocido",
                contacto: per ? per.email : "Sin email",
                disponibilidad: vol.preferencia_horario || "No especificada"
            };
        });

        displayVolunt(volunteersData);
    } catch (error) {
        console.error('Error al cargar voluntarios:', error);
    }
}

function displayVolunt(voluntarios) {
    const tbody = document.getElementById('tabla-voluntarios');
    tbody.innerHTML = "";

    voluntarios.forEach(vol => {
        let tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${vol.nombre}</strong></td>
            <td>${vol.contacto}</td>
            <td>${vol.disponibilidad}</td>
            <td>
                <button class="btn btn--primary" onclick="asignarTurno(${vol.id_voluntario})">
                    Asignar aquí
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contador-voluntarios').textContent = `${voluntarios.length} voluntarios disponibles`;
}

async function asignarTurno(idVoluntario) {
    if (!idTiendaSeleccionada || !idCampanaURL) {
        alert("Asegúrate de haber seleccionado una campaña y una tienda.");
        return;
    }

    try {
        const idGenerado = Math.random().toString(36).substring(2, 11);
        await fetch(`${API_BASE}/asignacion_turno_colaborador`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: idGenerado,
                id_asignacion_turno: Date.now(),
                id_campana: idCampanaURL,
                id_tienda: parseInt(idTiendaSeleccionada),
                id_voluntario: idVoluntario,
                fecha: new Date().toISOString().split('T')[0] // Fecha por defecto
            })
        });

        alert("Voluntario asignado a la tienda correctamente.");
    } catch (error) {
        console.error("Error al asignar:", error);
    }
}