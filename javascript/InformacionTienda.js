const API_BASE = 'http://localhost:3000';

let establishmentsData = [];
let selectedEstablishmentId = null;
let selectedEstablishmentInternalId = null;
let campaignsData = [];
let chainsCatalog = [];

document.addEventListener("DOMContentLoaded", () => {
    loadEstablishments();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);

    document.getElementById('btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedEstablishmentId) {
            document.getElementById('delete-overlay').classList.add('active');
            document.getElementById('delete-popup').classList.add('active');
        }
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', (e) => {
        e.preventDefault();
        hideDeletePopup();
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', async (e) => {
        e.preventDefault();
        await deleteEstablishment(e.target);
    });
});

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
}

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function clearSelection() {
    document.querySelectorAll('#establishments-table tr').forEach(r => r.classList.remove('selected'));
}

function buildAddress(dir) {
    if (!dir) return "No disponible";
    const via = dir.nombre_via || "";
    let numStr = "";
    if (dir.numero) {
        numStr = `, ${dir.numero}`;
    } else if (!via.toLowerCase().includes("s/n")) {
        numStr = ", s/n";
    }
    return `${dir.tipo_via || ''} ${via}${numStr}`;
}

function populateChainSelect(chains) {
    const select = document.getElementById('filter-chain');
    while (select.options.length > 1) select.remove(1);
    chains.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_cadena;
        opt.textContent = c.nombre_cadena;
        select.appendChild(opt);
    });
}

function populateCampaignSelect(campaigns) {
    const select = document.getElementById('filter-campaigns');
    while (select.options.length > 1) select.remove(1);
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        select.appendChild(opt);
    });
}

function populateFormCampaignSelect(campaigns) {
    const select = document.getElementById('form-campaigns');
    select.innerHTML = '';
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        select.appendChild(opt);
    });
}

function populateFormCoordinatorSelect(users) {
    const select = document.getElementById('form-coordinator');
    users.filter(u => u.id_rol === 2).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.textContent = capitalize(u.usuario);
        select.appendChild(opt);
    });
}

function populateCoordinatorSelect(users) {
    const select = document.getElementById('filter-coordinator');
    users.filter(u => u.id_rol === 2).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.textContent = capitalize(u.usuario);
        select.appendChild(opt);
    });
}

function populateZoneSelect(zones) {
    const select = document.getElementById('filter-zone');
    const zoneNames = [...new Set(zones.map(z => z.nombre_zona))].sort();
    zoneNames.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.textContent = z;
        select.appendChild(opt);
    });
}

function setTableState(state, message = '') {
    const tbody = document.getElementById('establishments-table');
    const counter = document.getElementById('establishments-counter');

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="3" class="table-cell-loading">Cargando...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="3" class="table-cell-error">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

async function loadEstablishments() {
    setTableState('loading');
    try {
        const [establishments, chains, direcciones, codigosPostales, divisions, zones, asignaciones, users, campaigns] = await Promise.all([
            fetchJson(`${API_BASE}/establecimiento`),
            fetchJson(`${API_BASE}/cadena`),
            fetchJson(`${API_BASE}/direccion`),
            fetchJson(`${API_BASE}/codigo_postal`),
            fetchJson(`${API_BASE}/division_territorial`),
            fetchJson(`${API_BASE}/zona_geografica`),
            fetchJson(`${API_BASE}/asignacion_coordinador`),
            fetchJson(`${API_BASE}/usuario`),
            fetchJson(`${API_BASE}/campana`)
        ]);

        campaignsData = campaigns;
        chainsCatalog = chains;

        populateChainSelect(chains);
        populateCoordinatorSelect(users);
        populateZoneSelect(zones);
        populateCampaignSelect(campaigns);
        populateFormCoordinatorSelect(users);
        populateFormCampaignSelect(campaigns);

        establishmentsData = establishments.map(est => {
            const cadena = chains.find(c => c.id_cadena === est.id_cadena);
            const dir = direcciones.find(d => d.id_direccion === est.id_direccion);
            const cp = dir ? codigosPostales.find(c => c.id_cp === dir.id_cp) : null;
            const div = cp ? divisions.find(d => d.id_division === cp.id_division) : null;
            const zona = div ? zones.find(z => z.id_zona === div.id_zona) : null;

            const asignacion = asignaciones.find(a => a.id_tienda === est.id_establecimiento);
            const usuarioCoord = asignacion
                ? users.find(u => u.id_usuario === asignacion.id_usuario_coordinador)
                : null;

            return {
                ...est,
                nombre_cadena: cadena ? cadena.nombre_cadena : est.id_cadena,
                localidad: div ? div.nombre_division : "Desconocida",
                nombre_zona: zona ? zona.nombre_zona : "Sin zona",
                id_zona: zona ? zona.id_zona : null,
                nombre_coordinador: usuarioCoord ? capitalize(usuarioCoord.usuario) : "Sin asignar",
                id_coordinador: asignacion ? asignacion.id_usuario_coordinador : null,
                campanasIds: asignaciones
                    .filter(a => a.id_tienda === est.id_establecimiento)
                    .map(a => a.id_campana),
                obj_direccion: dir,
                obj_cp: cp
            };
        });

        displayEstablishments(establishmentsData);
        updateCounter(establishmentsData.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        setTableState('error', `Error al conectar con la base de datos. Asegúrate de que json-server esté corriendo en ${API_BASE}`);
    }
}

function applyFilters() {
    const filters = {
        cadena:    document.getElementById('filter-chain').value,
        nombre:    document.getElementById('filter-name').value.toLowerCase().trim(),
        tipoVia:   document.getElementById('filter-type').value,
        calle:     document.getElementById('filter-street').value.toLowerCase().trim(),
        codigo:    document.getElementById('filter-code').value.trim(),
        localidad: document.getElementById('filter-city').value.toLowerCase().trim(),
        zona:      document.getElementById('filter-zone').value,
        campana:   document.getElementById('filter-campaigns').value,
        coord:     document.getElementById('filter-coordinator').value
    };

    const filtered = establishmentsData.filter(est => {
        if (filters.cadena && est.id_cadena !== filters.cadena) return false;
        if (filters.nombre && !est.nombre_resena.toLowerCase().includes(filters.nombre)
                           && !est.nombre_cadena.toLowerCase().includes(filters.nombre)) return false;
        if (filters.tipoVia && est.obj_direccion?.tipo_via !== filters.tipoVia) return false;
        if (filters.calle && !est.obj_direccion?.nombre_via.toLowerCase().includes(filters.calle)) return false;
        if (filters.codigo && est.obj_cp?.codigo !== filters.codigo) return false;
        if (filters.localidad && !est.localidad.toLowerCase().includes(filters.localidad)) return false;
        if (filters.zona && est.nombre_zona !== filters.zona) return false;
        if (filters.campana && (!est.campanasIds || !est.campanasIds.includes(filters.campana))) return false;
        if (filters.coord && est.id_coordinador != filters.coord) return false;
        return true;
    });

    displayEstablishments(filtered);
    updateCounter(filtered.length);
}

// ----- TABLE RENDERING -----
function createEstablishmentRow(est, onSelect) {
    const tr = document.createElement('tr');
    tr.classList.add('row-selectable');

    tr.innerHTML = `
        <td>
            <strong>${est.nombre_resena}</strong>
            <br><small>${est.nombre_cadena}</small>
        </td>
        <td>${est.localidad}</td>
        <td>${est.nombre_coordinador}</td>
    `;

    tr.addEventListener('click', () => {
        onSelect(est, tr);
    });

    return tr;
}

function displayEstablishments(list) {
    const tbody = document.getElementById('establishments-table');
    tbody.innerHTML = '';
    list.forEach(est => tbody.appendChild(
        createEstablishmentRow(est, (e, tr) => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(e);
        })
    ));
}

function updateCounter(total) {
    document.getElementById('establishments-counter').textContent =
        `${total} establecimiento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

function showDetail(est) {
    selectedEstablishmentId = est.id_establecimiento;
    selectedEstablishmentInternalId = est.id;

    document.getElementById('establishment-form-panel').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'none';
    document.getElementById('detail-actions').style.display = 'flex';
    document.getElementById('empty-state-panel').style.display = 'none';
    document.getElementById('establishment-data').style.display = 'block';

    document.getElementById('btn-edit').disabled = false;
    document.getElementById('btn-delete').disabled = false;

    document.getElementById('ficha-nombre').textContent = est.nombre_resena;
    document.getElementById('ficha-cadena').textContent = est.nombre_cadena;
    document.getElementById('ficha-localidad').textContent = est.localidad;
    document.getElementById('ficha-zona').textContent = est.nombre_zona;
    document.getElementById('ficha-cp').textContent = est.obj_cp?.codigo ?? "No disponible";
    document.getElementById('ficha-direccion').textContent = buildAddress(est.obj_direccion);
    document.getElementById('ficha-lineales').textContent = est.lineales;
    document.getElementById('ficha-coordinador').textContent = est.nombre_coordinador;
    const campanasContainer = document.getElementById('ficha-campanas-contenido');
    campanasContainer.innerHTML = '';
    campaignsData.forEach(c => {
        const participa = est.campanasIds && est.campanasIds.includes(c.id_campana);
        const p = document.createElement('p');
        p.innerHTML = `<strong>${c.nombre_campana || c.id_campana}:</strong> ${participa ? 'Sí' : 'No'}`;
        campanasContainer.appendChild(p);
    });
}

// ----- DELETE POPUP -----
function hideDeletePopup() {
    document.getElementById('delete-overlay').classList.remove('active');
    document.getElementById('delete-popup').classList.remove('active');
}

async function deleteEstablishment(btn) {
    if (!selectedEstablishmentInternalId) {
        alert("Error: No se ha seleccionado ningún establecimiento.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/establecimiento/${selectedEstablishmentInternalId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        hideDeletePopup();
        selectedEstablishmentId = null;
        selectedEstablishmentInternalId = null;

        document.getElementById('establishment-data').style.display = 'none';
        document.getElementById('establishment-form-panel').style.display = 'none';
        document.getElementById('form-actions-bar').style.display = 'none';
        document.getElementById('detail-actions').style.display = 'none';
        document.getElementById('empty-state-panel').style.display = 'block';

        await loadEstablishments();

    } catch (error) {
        console.error("Error al intentar eliminar el establecimiento:", error);
        alert("No se pudo eliminar el establecimiento. Asegúrate de que json-server esté corriendo.");
    }
}
