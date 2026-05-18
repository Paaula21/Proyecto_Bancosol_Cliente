// ----- INITIAL CONFIGURATION -----
const API_BASE = 'http://localhost:3000';
const VISIBLE_ROWS = 6;

let volunteersData = [];
let selectedVolunteerId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadVolunteers();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);

    document.getElementById('btn-editar-voluntario').addEventListener('click', (e) => {
        e.stopPropagation();
        const vol = volunteersData.find(v => v.id_voluntario === selectedVolunteerId);
        if (vol) {
            sessionStorage.setItem('voluntario_editar', JSON.stringify(vol));
            window.location.href = 'NuevoVoluntario.html';
        }
    });

    document.getElementById('btn-eliminar-voluntario').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedVolunteerId) {
            document.getElementById('overlay-eliminar').classList.add('active');
            document.getElementById('popup-eliminar').classList.add('active');
        }
    });

    document.getElementById('btn-cancelar-eliminar').addEventListener('click', (e) => {
        e.preventDefault();
        hideDeletePopup();
    });

    document.getElementById('btn-confirmar-eliminar').addEventListener('click', async (e) => {
        e.preventDefault();
        await deleteVolunteer(e.target);
    });
});

// ----- UTILITIES -----
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
}

function clearSelection() {
    document.querySelectorAll('#tabla-voluntarios tr').forEach(r => r.classList.remove('selected'));
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
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;">Cargando voluntarios...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#dc2626;">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

// ----- FETCH AND PROCESS DATA -----
// ----- FETCH AND PROCESS DATA -----
async function loadVolunteers() {
    setTableState('loading');

    try {
        const voluntarios = await fetchJson(`${API_BASE}/voluntario`);
        const personas = await fetchJson(`${API_BASE}/persona`);

        console.log(personas);

        // Mapeamos los datos asegurando que existan los campos principales
        volunteersData = voluntarios.map(vol => {
            const per = personas.find(p => p.id_persona === vol.id_persona);

            return {
                // Guardamos el ID fundamental para los botones
                id_voluntario: vol.id_voluntario,
                nombre: per ? (per.nombre_completo || "Sin nombre") : "Persona no encontrada",
                email: per ? (per.email || "No disponible") : "No disponible",
                telefono: per ? (per.telefono || "No disponible") : "No disponible"
            };
        }); // Eliminamos el código muerto que estaba aquí dentro

        // Llamamos a la función encargada de pintar la tabla
        displayVolunt(volunteersData);
        updateCounter(volunteersData.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        setTableState('error', `Error al conectar con la base de datos. Asegúrate de que json-server esté corriendo en ${API_BASE}`);
    }
}

function displayVolunt(voluntarios) {
    const tbody = document.querySelector("#tabla-voluntarios");
    tbody.innerHTML = ""; // Limpiamos el texto de "Cargando..."

    voluntarios.forEach(vol => {
        let tr = document.createElement('tr');

        // 1. Celda Nombre
        let tdNombre = document.createElement('td');
        tdNombre.textContent = vol.nombre;
        tr.appendChild(tdNombre);

        // 2. Celda Email
        let tdEmail = document.createElement('td');
        tdEmail.textContent = vol.email;
        tr.appendChild(tdEmail);

        // 3. Celda Teléfono
        let tdTelefono = document.createElement('td');
        tdTelefono.textContent = vol.telefono;
        tr.appendChild(tdTelefono);

        // 4. Celda ACCIONES (Aquí creamos tus botones)
        let tdAcciones = document.createElement('td');

        // Enlace para editar el voluntario (Pasamos el ID por URL)
        let enlaceEditar = document.createElement('a');
        enlaceEditar.href = 'EditarVoluntario.html?id_voluntario=' + encodeURIComponent(vol.id_voluntario);
        enlaceEditar.className = 'btn btn-edit';
        enlaceEditar.textContent = 'Editar';

        // Botón para borrar el voluntario
        let btnBorrar = document.createElement('button');
        btnBorrar.type = 'button';
        btnBorrar.className = 'btn btn-delete';
        btnBorrar.textContent = 'Borrar';

        // Evento para abrir tu modal/popup de confirmación
        btnBorrar.addEventListener('click', function () {
            // Guardamos el ID global del voluntario seleccionado para usarlo al confirmar la eliminación
            voluntarioSeleccionadoId = vol.id_voluntario;

            document.getElementById('overlay-eliminar').classList.add('active');
            document.getElementById('popup-eliminar').classList.add('active');
        });

        // Agregamos los elementos a la celda de acciones
        tdAcciones.appendChild(enlaceEditar);
        tdAcciones.appendChild(document.createTextNode(' ')); // Pequeño espacio de separación
        tdAcciones.appendChild(btnBorrar);

        // Agregamos la celda de acciones a la fila
        tr.appendChild(tdAcciones);

        // Finalmente, inyectamos la fila completa al tbody
        tbody.appendChild(tr);
    });
}

// ----- FILTER LOGIC -----
function applyFilters() {
    // Filtros adaptados a las propiedades del voluntario
    const filters = {
        nombre:   document.getElementById('filter-name').value.toLowerCase().trim(),
        email:    document.getElementById('filter-email').value.toLowerCase().trim(),
        telefono: document.getElementById('filter-phone').value.trim()
    };

    const filtered = volunteersData.filter(vol => {
        if (filters.nombre && !vol.nombre.toLowerCase().includes(filters.nombre)) return false;
        if (filters.email && !vol.email.toLowerCase().includes(filters.email)) return false;
        if (filters.telefono && !vol.telefono.includes(filters.telefono)) return false;
        return true;
    });

    displayVolunt(filtered);
    updateCounter(filtered.length);
}

// ----- TABLE RENDERING -----
function createVoluntRow(vol, onSelect) {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';

    // Se renderizan las 3 columnas solicitadas: Nombre, Email y Teléfono
    tr.innerHTML = `
        <td><strong>${vol.nombre}</strong></td>
        <td>${vol.email}</td>
        <td>${vol.telefono}</td>
    `;

    tr.addEventListener('click', () => {
        onSelect(vol, tr);
    });

    return tr;
}

function displayVolunt(list) {
    const tbody = document.getElementById('tabla-voluntarios');
    if (!tbody) return;

    tbody.innerHTML = '';
    list.forEach(vol => tbody.appendChild(
        createVoluntRow(vol, (e, tr) => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(e);
        })
    ));
    updateScrollable(list);
}

function updateCounter(total) {
    const counter = document.getElementById('contador-voluntarios');
    if (counter) {
        counter.textContent =
            `${total} voluntario${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
}

// ----- DETAIL PANEL -----
function showDetail(vol) {
    selectedVolunteerId = vol.id_voluntario;

    document.getElementById('estado-vacio-panel').style.display = 'none';
    document.getElementById('datos-voluntario').style.display = 'block';

    // Vinculación de los datos del voluntario seleccionado en la ficha lateral
    document.getElementById('ficha-nombre').textContent = vol.nombre;
    document.getElementById('ficha-email').textContent = vol.email;
    document.getElementById('ficha-telefono').textContent = vol.telefono;
}

// ----- DELETE POPUP -----
function hideDeletePopup() {
    document.getElementById('overlay-eliminar').classList.remove('active');
    document.getElementById('popup-eliminar').classList.remove('active');
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

        const response = await fetch(`${API_BASE}/voluntario/${selectedVolunteerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        hideDeletePopup();
        selectedVolunteerId = null;

        // Forzamos el refresco visual del panel de detalles poniéndolo en estado vacío
        document.getElementById('estado-vacio-panel').style.display = 'block';
        document.getElementById('datos-voluntario').style.display = 'none';

        await loadVolunteers();
        alert("Voluntario eliminado con éxito");

    } catch (error) {
        console.error("Error al intentar eliminar el voluntario:", error);
        alert("No se pudo eliminar el voluntario. Asegúrate de que json-server esté corriendo.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}