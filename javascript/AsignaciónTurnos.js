// ----- INITIAL CONFIGURATION ----- //
const API_BASE = 'http://localhost:3000';
const VISIBLE_ROWS = 6;

let volunteersData = [];
let selectedVolunteerId = null;


// ----- MAIN EVENT ----- //
document.addEventListener("DOMContentLoaded", () => {

    loadVolunteers();

    // Botón filtros
    document.getElementById('btn-filter')
        .addEventListener('click', applyFilters);

    // Botón editar
    document.getElementById('btn-editar-voluntario')
        .addEventListener('click', (e) => {

            e.stopPropagation();

            const vol = volunteersData.find(
                v => v.id_voluntario === selectedVolunteerId
            );

            if (vol) {

                sessionStorage.setItem(
                    'voluntario_editar',
                    JSON.stringify(vol)
                );

                window.location.href = 'NuevoVoluntario.html';
            }
        });

    // Botón eliminar
    document.getElementById('btn-eliminar-voluntario')
        .addEventListener('click', (e) => {

            e.stopPropagation();

            if (selectedVolunteerId) {

                document.getElementById('overlay-eliminar')
                    .classList.add('active');

                document.getElementById('popup-eliminar')
                    .classList.add('active');
            }
        });

    // Cancelar eliminar
    document.getElementById('btn-cancelar-eliminar')
        .addEventListener('click', (e) => {

            e.preventDefault();

            hideDeletePopup();
        });

    // Confirmar eliminar
    document.getElementById('btn-confirmar-eliminar')
        .addEventListener('click', async (e) => {

            e.preventDefault();

            await deleteVolunteer(e.target);
        });
});


// ----- UTILITIES -----

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

        wrapper.classList.toggle(
            'scrollable',
            list.length > VISIBLE_ROWS
        );
    }
}


function setTableState(state, message = '') {

    const tbody = document.getElementById('tabla-voluntarios');

    const counter = document.getElementById('contador-voluntarios');

    if (!tbody || !counter) return;

    if (state === 'loading') {

        tbody.innerHTML =
            `<tr>
<td colspan="4" style="text-align:center;padding:20px;">
    Cargando voluntarios...
</td>
</tr>`;

        counter.textContent = 'Cargando...';
    }

    else if (state === 'error') {

        tbody.innerHTML =
            `<tr>
<td colspan="4" style="text-align:center;padding:20px;color:#dc2626;">
    ${message}
</td>
</tr>`;

        counter.textContent = 'Error de conexión';
    }
}


// ----- FETCH AND PROCESS DATA -----

async function loadVolunteers() {

    setTableState('loading');

    try {

        const voluntarios =
            await fetchJson(`${API_BASE}/voluntario`);

const personas =
    await fetchJson(`${API_BASE}/persona`);

volunteersData = voluntarios.map(vol => {

    const per = personas.find(
        p => p.id_persona === vol.id_persona
    );

    return {

        id_voluntario: vol.id_voluntario,

        nombre: per
            ? (per.nombre_completo || "Sin nombre")
            : "Persona no encontrada",

        email: per
            ? (per.email || "No disponible")
            : "No disponible",

        telefono: per
            ? (per.telefono || "No disponible")
            : "No disponible"
    };
});

displayVolunt(volunteersData);

updateCounter(volunteersData.length);

} catch (error) {

    console.error('Error al cargar datos:', error);

    setTableState(
        'error',
        `Error al conectar con la base de datos. 
            Asegúrate de que json-server esté corriendo en ${API_BASE}`
    );
}
}


// ----- FILTER LOGIC -----

function applyFilters() {

    const filters = {

        nombre:
            document.getElementById('filter-name')
                .value
                .toLowerCase()
                .trim(),

        email:
            document.getElementById('filter-email')
                .value
                .toLowerCase()
                .trim(),

        telefono:
            document.getElementById('filter-phone')
                .value
                .trim()
    };

    const filtered = volunteersData.filter(vol => {

        if (
            filters.nombre &&
            !vol.nombre.toLowerCase().includes(filters.nombre)
        ) {
            return false;
        }

        if (
            filters.email &&
            !vol.email.toLowerCase().includes(filters.email)
        ) {
            return false;
        }

        if (
            filters.telefono &&
            !vol.telefono.includes(filters.telefono)
        ) {
            return false;
        }

        return true;
    });

    displayVolunt(filtered);

    updateCounter(filtered.length);
}


// ----- TABLE RENDERING -----

function displayVolunt(voluntarios) {

    const tbody = document.querySelector("#tabla-voluntarios");

    if (!tbody) return;

    tbody.innerHTML = "";

    voluntarios.forEach(vol => {

        let tr = document.createElement('tr');

        tr.style.cursor = 'pointer';

        // ----- CLICK FILA -----
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
        enlaceEditar.href = 'EditarVoluntario.html?id_voluntario=' + encodeURIComponent(vol.id_voluntario);
        enlaceEditar.className = 'btn btn-edit';
        enlaceEditar.textContent = 'Editar';
        enlaceEditar.addEventListener('click', (e) => { e.stopPropagation();})

// ESTILOS
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

        enlaceEditar.addEventListener('mouseenter', () => {
            enlaceEditar.style.backgroundColor = '#f9fafb';
        });

        enlaceEditar.addEventListener('mouseleave', () => {
            enlaceEditar.style.backgroundColor = '#ffffff';
        });

// CLICK EDITAR
        enlaceEditar.addEventListener('click', (e) => {

            e.stopPropagation();

            window.location.href =
                'EditarVoluntario.html?id_voluntario=' +
                encodeURIComponent(vol.id_voluntario);
        });

// ELIMINAR
        let btnBorrar = document.createElement('button');

        btnBorrar.type = 'button';

        btnBorrar.textContent = 'Eliminar';

// ESTILOS
        btnBorrar.style.padding = '8px 16px';
        btnBorrar.style.border = 'none';
        btnBorrar.style.borderRadius = '6px';
        btnBorrar.style.backgroundColor = '#ef4444';
        btnBorrar.style.color = 'white';
        btnBorrar.style.fontSize = '15px';
        btnBorrar.style.fontWeight = '600';
        btnBorrar.style.cursor = 'pointer';

        btnBorrar.addEventListener('mouseenter', () => {
            btnBorrar.style.backgroundColor = '#dc2626';
        });

        btnBorrar.addEventListener('mouseleave', () => {
            btnBorrar.style.backgroundColor = '#ef4444';
        });

        btnBorrar.addEventListener('click', function (e) {

            e.stopPropagation();

            selectedVolunteerId = vol.id_voluntario;

            document.getElementById('overlay-eliminar')
                .classList.add('active');

            document.getElementById('popup-eliminar')
                .classList.add('active');
        });

        tdAcciones.appendChild(enlaceEditar);

        tdAcciones.appendChild(
            document.createTextNode(' ')
        );

        tdAcciones.appendChild(btnBorrar);

        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });

    updateScrollable(voluntarios);
}


function updateCounter(total) {

    const counter =
        document.getElementById('contador-voluntarios');

    if (counter) {

        counter.textContent =
            `${total} voluntario${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
}


// ----- DETAIL PANEL -----

function showDetail(vol) {

    selectedVolunteerId = vol.id_voluntario;

    document.getElementById('estado-vacio-panel')
        .style.display = 'none';

    document.getElementById('datos-voluntario')
        .style.display = 'block';

    document.getElementById('ficha-nombre')
        .textContent = vol.nombre;

    document.getElementById('ficha-email')
        .textContent = vol.email;

    document.getElementById('ficha-telefono')
        .textContent = vol.telefono;
}


// ----- DELETE POPUP -----

function hideDeletePopup() {

    document.getElementById('overlay-eliminar')
        .classList.remove('active');

    document.getElementById('popup-eliminar')
        .classList.remove('active');
}


async function deleteVolunteer(btn) {

    if (!selectedVolunteerId) {

        alert("Error: No se ha seleccionado ningún voluntario.");

        return;
    }

    const originalText = btn.textContent;

    try {

        btn.textContent = "Eliminando...";

        btn.disabled = true;

        const response = await fetch(
            `${API_BASE}/voluntario/${selectedVolunteerId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                `Error en el servidor: ${response.status}`
            );
        }

        hideDeletePopup();

        selectedVolunteerId = null;

        document.getElementById('estado-vacio-panel')
            .style.display = 'block';

        document.getElementById('datos-voluntario')
            .style.display = 'none';

        await loadVolunteers();

        alert("Voluntario eliminado con éxito");

    } catch (error) {

        console.error(
            "Error al intentar eliminar el voluntario:",
            error
        );

        alert(
            "No se pudo eliminar el voluntario. " +
            "Asegúrate de que json-server esté corriendo."
        );

    } finally {

        btn.textContent = originalText;

        btn.disabled = false;
    }
}