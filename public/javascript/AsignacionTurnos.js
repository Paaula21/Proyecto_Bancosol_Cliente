const API_BASE = 'http://localhost:3000';
const VISIBLE_ROWS = 6;

async function fetchDatos(recurso) {
    let response = await fetch(`${API_BASE}/${recurso}`);
    if (!response.ok) {
        throw new Error('Error al obtener "' + recurso + '": ' + response.status);
    }
    return response.json();
}

let parametrosURL = new URLSearchParams(window.location.search);
let idVoluntario = parametrosURL.get('id_voluntario');

// Inicializamos array vacío y loadVolunteers() se encarga de llenarlo
let volunteersData = [];
let selectedVolunteerId = null;

document.addEventListener("DOMContentLoaded", () => {

    loadVolunteers();

    // Botón filtros
    const btnFilter = document.getElementById('btn-filter');
    if (btnFilter) {
        btnFilter.addEventListener('click', applyFilters);
    }

    // Botón editar
    const btnEditarGlobal = document.getElementById('btn-editar-voluntario');
    if (btnEditarGlobal) {
        btnEditarGlobal.addEventListener('click', (e) => {
            e.stopPropagation();
            const vol = volunteersData.find(
                v => String(v.id_voluntario) === String(selectedVolunteerId)
            );
            if (vol) {
                // Guarda los datos en sessionStorage
                sessionStorage.setItem('voluntario_editar', JSON.stringify(vol));

                // Redirige a EditarVoluntario.html pasando el ID por la URL
                window.location.href = 'EditarVoluntario.html?id_voluntario=' + encodeURIComponent(vol.id_voluntario);
            } else {
                alert("Por favor, selecciona un voluntario de la lista primero.");
            }
        });
    }

    // Botón eliminar
    const btnEliminarGlobal = document.getElementById('btn-eliminar-voluntario');
    if (btnEliminarGlobal) {
        btnEliminarGlobal.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedVolunteerId) {
                const overlay = document.getElementById('overlay-eliminar');
                const popup = document.getElementById('popup-eliminar');
                if (overlay) overlay.classList.add('active');
                if (popup) popup.classList.add('active');
            } else {
                alert("Por favor, selecciona un voluntario de la lista primero.");
            }
        });
    }

    // Cancelar eliminar
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', (e) => {
            e.preventDefault();
            hideDeletePopup();
        });
    }

    // Confirmar eliminar
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async (e) => {
            e.preventDefault();
            await deleteVolunteer(e.target);
        });
    }
});


async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Error ${res.status} en ${url}`);
    }
    return res.json();
}

function clearSelection() {
    document.querySelectorAll('#tabla-voluntarios tr')
        .forEach(r => r.classList.remove('selected'));
}

function updateScrollable(list) {
    const wrapper = document.querySelector('.table-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('scrollable', list.length > VISIBLE_ROWS);
    }
}

function setTableState(state, message = '') {
    const tbody = document.getElementById('tabla-voluntarios');
    const counter = document.getElementById('contador-voluntarios');

    if (!tbody || !counter) return;

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;">Cargando voluntarios...</td></tr>`;
        counter.textContent = 'Cargando...';
    }
    else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#dc2626;">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

async function loadVolunteers() {
    setTableState('loading');

    try {
        const voluntarios = await fetchJson(`${API_BASE}/voluntario`);
        const personas = await fetchJson(`${API_BASE}/persona`);

        volunteersData = voluntarios.map(vol => {

            const per = personas.find(p => String(p.id_persona) === String(vol.id_persona));

            return {
                id_voluntario: vol.id_voluntario,
                vol_id_interno: vol.id,
                persona_id_interno: per ? per.id : null,

                nombre: per ? (per.nombre_completo || "Sin nombre") : "Persona no encontrada",
                email: per ? (per.email || "No disponible") : "No disponible",
                telefono: per ? (per.telefono || "No disponible") : "No disponible",

                disponibilidad: vol.preferencia_horario || ""
            };
        });

        displayVolunt(volunteersData);
        updateCounter(volunteersData.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        setTableState(
            'error',
            `Error al conectar con la base de datos. Asegúrate de que json-server esté corriendo en ${API_BASE}`
        );
    }
}

function applyFilters() {
    const inputTurnos = document.getElementById('filter-turnos');
    const selectedTurno = inputTurnos ? inputTurnos.value.trim().toLowerCase() : '';

    if (!selectedTurno) {
        displayVolunt(volunteersData);
        updateCounter(volunteersData.length);
        return;
    }

    const filtered = volunteersData.filter(vol => {
        if (!vol.disponibilidad) return false;

        const listaTurnos = vol.disponibilidad.split(',').map(turno => turno.trim().toLowerCase());
        return listaTurnos.includes(selectedTurno);
    });

    displayVolunt(filtered);
    updateCounter(filtered.length);
}

function displayVolunt(voluntarios) {
    const tbody = document.querySelector("#tabla-voluntarios");
    if (!tbody) return;

    tbody.innerHTML = "";

    voluntarios.forEach(vol => {
        let tr = document.createElement('tr');
        tr.style.cursor = 'pointer';

        tr.addEventListener('click', () => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(vol);
        });

        // ----- NOMBRE -----
        let tdNombre = document.createElement('td');
        tdNombre.innerHTML = `<strong>${vol.nombre}</strong>`;
        tr.appendChild(tdNombre);

        // ----- EMAIL -----
        let tdEmail = document.createElement('td');
        tdEmail.textContent = vol.email;
        tr.appendChild(tdEmail);

        // ----- TELEFONO -----
        let tdTelefono = document.createElement('td');
        tdTelefono.textContent = vol.telefono;
        tr.appendChild(tdTelefono);

        // ----- ACCIONES -----
        let tdAcciones = document.createElement('td');

        // EDITAR
        let enlaceEditar = document.createElement('a');
        enlaceEditar.href = 'EditarVoluntario.html?id_voluntario=' + encodeURIComponent(vol.id_voluntario);
        enlaceEditar.className = 'btn btn-edit';
        enlaceEditar.textContent = 'Editar';

        // ESTILOS EDITAR
        enlaceEditar.style.display = 'inline-block';
        enlaceEditar.style.padding = '8px 16px';
        enlaceEditar.style.border = '1px solid #d1d5db';
        enlaceEditar.style.borderRadius = '6px';
        enlaceEditar.style.backgroundColor = '#ffffff';
        enlaceEditar.style.color = '#374151';
        enlaceEditar.style.textDecoration = 'none';
        enlaceEditar.style.fontSize = '15px';
        enlaceEditar.style.fontWeight = '500';
        enlaceEditar.style.marginRight = '6px';
        enlaceEditar.style.cursor = 'pointer';

        enlaceEditar.addEventListener('mouseenter', () => { enlaceEditar.style.backgroundColor = '#f9fafb'; });
        enlaceEditar.addEventListener('mouseleave', () => { enlaceEditar.style.backgroundColor = '#ffffff'; });

        enlaceEditar.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = 'EditarVoluntario.html?id_voluntario=' + encodeURIComponent(vol.id_voluntario);
        });

        // ELIMINAR
        let btnBorrar = document.createElement('button');
        btnBorrar.type = 'button';
        btnBorrar.className = 'btn-eliminar-fila';
        btnBorrar.textContent = 'Eliminar';

        // ESTILOS BORRAR
        btnBorrar.style.padding = '8px 16px';
        btnBorrar.style.border = 'none';
        btnBorrar.style.borderRadius = '6px';
        btnBorrar.style.backgroundColor = '#ef4444';
        btnBorrar.style.color = 'white';
        btnBorrar.style.fontSize = '15px';
        btnBorrar.style.fontWeight = '600';
        btnBorrar.style.cursor = 'pointer';

        btnBorrar.addEventListener('mouseenter', () => { btnBorrar.style.backgroundColor = '#dc2626'; });
        btnBorrar.addEventListener('mouseleave', () => { btnBorrar.style.backgroundColor = '#ef4444'; });

        btnBorrar.addEventListener('click', function (e) {
            e.stopPropagation();
            selectedVolunteerId = vol.id_voluntario;

            const overlay = document.getElementById('overlay-eliminar');
            const popup = document.getElementById('popup-eliminar');
            if (overlay) overlay.classList.add('active');
            if (popup) popup.classList.add('active');
        });

        tdAcciones.appendChild(enlaceEditar);
        tdAcciones.appendChild(document.createTextNode(' '));
        tdAcciones.appendChild(btnBorrar);

        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });

    updateScrollable(voluntarios);
}


function updateCounter(total) {
    const counter = document.getElementById('contador-voluntarios');
    if (counter) {
        counter.textContent = `${total} voluntario${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
}


function showDetail(vol) {
    selectedVolunteerId = vol.id_voluntario;

    const emptyPanel = document.getElementById('estado-vacio-panel');
    const dataPanel = document.getElementById('datos-voluntario');

    if (emptyPanel) emptyPanel.style.display = 'none';
    if (dataPanel) dataPanel.style.display = 'block';

    const fNombre = document.getElementById('ficha-nombre');
    const fEmail = document.getElementById('ficha-email');
    const fTelefono = document.getElementById('ficha-telefono');

    if (fNombre) fNombre.textContent = vol.nombre;
    if (fEmail) fEmail.textContent = vol.email;
    if (fTelefono) fTelefono.textContent = vol.telefono;
}


// ----- DELETE POPUP -----

function hideDeletePopup() {
    const overlay = document.getElementById('overlay-eliminar');
    const popup = document.getElementById('popup-eliminar');
    if (overlay) overlay.classList.remove('active');
    if (popup) popup.classList.remove('active');
}


async function deleteVolunteer(btn) {
    if (!selectedVolunteerId) {
        alert("Error: No se ha seleccionado ningún voluntario.");
        return;
    }

    const volToDelete = volunteersData.find(v => String(v.id_voluntario) === String(selectedVolunteerId));
    if (!volToDelete) {
        alert("Voluntario no encontrado en memoria.");
        return;
    }

    const originalText = btn.textContent;

    try {
        btn.textContent = "Eliminando...";
        btn.disabled = true;

        // 1. ELIMINAR EL VOLUNTARIO
        const volId = volToDelete.vol_id_interno;
        const responseVoluntario = await fetch(`${API_BASE}/voluntario/${volId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!responseVoluntario.ok) {
            throw new Error(`Error al borrar voluntario: ${responseVoluntario.status}`);
        }

        // 2. ELIMINAR LA PERSONA RELACIONADA
        if (volToDelete.persona_id_interno) {
            const responsePersona = await fetch(`${API_BASE}/persona/${volToDelete.persona_id_interno}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!responsePersona.ok) {
                console.warn("La persona asociada no se pudo borrar o ya no existía.");
            }
        }

        hideDeletePopup();

        selectedVolunteerId = null;

        const emptyPanel = document.getElementById('estado-vacio-panel');
        const dataPanel = document.getElementById('datos-voluntario');
        if (emptyPanel) emptyPanel.style.display = 'block';
        if (dataPanel) dataPanel.style.display = 'none';

        // Recargar la tabla actualizándola
        await loadVolunteers();

    } catch (error) {
        console.error("Error al intentar eliminar:", error);
        alert("No se pudo eliminar el registro. Inténtalo de nuevo.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}