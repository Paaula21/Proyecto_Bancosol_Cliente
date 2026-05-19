// ----- INITIAL CONFIGURATION -----
const API_BASE = 'http://localhost:3000';
const VISIBLE_ROWS = 6;

let establishmentsData = [];
let selectedEstablishmentId = null;
let campaignsData = [];
let chainsCatalog = [];

document.addEventListener("DOMContentLoaded", () => {
    loadEstablishments();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);

    document.getElementById('btn-add-establecimiento').addEventListener('click', () => {
        showForm(null);
    });

    document.getElementById('btn-editar-establecimiento').addEventListener('click', (e) => {
        e.stopPropagation();
        const est = establishmentsData.find(e => e.id_establecimiento === selectedEstablishmentId);
        if (est) showForm(est);
    });

    document.getElementById('btn-eliminar-establecimiento').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedEstablishmentId) {
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
        await deleteEstablishment(e.target);
    });

    document.getElementById('btn-cancelar-formulario').addEventListener('click', () => {
        hideForm();
    });

    document.getElementById('form-establecimiento').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarEstablecimiento();
    });
});

// ----- UTILITIES -----
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
    document.querySelectorAll('#tabla-establecimientos tr').forEach(r => r.classList.remove('selected'));
}

function updateScrollable(list) {
    const wrapper = document.querySelector('.table-wrapper');
    wrapper.classList.toggle('scrollable', list.length > VISIBLE_ROWS);
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
    const select = document.getElementById('filter-campanas');
    while (select.options.length > 1) select.remove(1);
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        select.appendChild(opt);
    });
}

function populateFormCampaignSelect(campaigns) {
    const select = document.getElementById('form-campanas');
    select.innerHTML = '';
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        select.appendChild(opt);
    });
}

function populateFormChainSelect(chains) {
    const select = document.getElementById('form-cadena');
    while (select.options.length > 1) select.remove(1);
    chains.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_cadena;
        opt.textContent = c.nombre_cadena;
        select.appendChild(opt);
    });
}

function populateFormCoordinatorSelect(users) {
    const select = document.getElementById('form-coordinador');
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
    const tbody = document.getElementById('tabla-establecimientos');
    const counter = document.getElementById('contador-establecimientos');

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;">Cargando...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#dc2626;">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

// ----- FETCH AND PROCESS DATA -----
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
                gran_recogida: asignaciones.some(a => a.id_tienda === est.id_establecimiento && a.id_campana === "GR2025"),
                primavera: asignaciones.some(a => a.id_tienda === est.id_establecimiento && a.id_campana === "PRIM2025"),
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

// ----- FILTER LOGIC -----
function applyFilters() {
    const filters = {
        cadena:    document.getElementById('filter-chain').value,
        nombre:    document.getElementById('filter-name').value.toLowerCase().trim(),
        tipoVia:   document.getElementById('filter-type').value,
        calle:     document.getElementById('filter-street').value.toLowerCase().trim(),
        codigo:    document.getElementById('filter-code').value.trim(),
        localidad: document.getElementById('filter-city').value.toLowerCase().trim(),
        zona:      document.getElementById('filter-zone').value,
        campana:   document.getElementById('filter-campanas').value,
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
    tr.style.cursor = 'pointer';

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
    const tbody = document.getElementById('tabla-establecimientos');
    tbody.innerHTML = '';
    list.forEach(est => tbody.appendChild(
        createEstablishmentRow(est, (e, tr) => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(e);
        })
    ));
    updateScrollable(list);
}

function updateCounter(total) {
    document.getElementById('contador-establecimientos').textContent =
        `${total} establecimiento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

// ----- DETAIL PANEL -----
function showDetail(est) {
    selectedEstablishmentId = est.id_establecimiento;

    document.getElementById('formulario-establecimiento').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'none';
    document.getElementById('acciones-detalle').style.display = 'flex';
    document.getElementById('estado-vacio-panel').style.display = 'none';
    document.getElementById('datos-establecimiento').style.display = 'block';

    document.getElementById('btn-editar-establecimiento').disabled = false;
    document.getElementById('btn-eliminar-establecimiento').disabled = false;

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

// ----- INLINE FORM -----
function showForm(est) {
    document.getElementById('estado-vacio-panel').style.display = 'none';
    document.getElementById('datos-establecimiento').style.display = 'none';
    document.getElementById('formulario-establecimiento').style.display = 'block';
    document.getElementById('acciones-detalle').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'flex';

    if (est) {
        document.getElementById('form-titulo').textContent = 'Editar Establecimiento';
        document.getElementById('form-nombre').value = est.nombre_resena || '';
        document.getElementById('form-cadena').value = est.nombre_cadena || '';
        document.getElementById('form-tipo-via').value = est.obj_direccion?.tipo_via || '';
        document.getElementById('form-via').value = est.obj_direccion?.nombre_via || '';
        document.getElementById('form-numero').value = est.obj_direccion?.numero || '';
        document.getElementById('form-cp').value = est.obj_cp?.codigo || '';
        document.getElementById('form-lineales').value = est.lineales || '';
        document.getElementById('form-coordinador').value = est.id_coordinador || '';

        if (est.campanasIds) {
            const select = document.getElementById('form-campanas');
            Array.from(select.options).forEach(opt => {
                opt.selected = est.campanasIds.includes(opt.value);
            });
        }
    } else {
        document.getElementById('form-titulo').textContent = 'Nuevo Establecimiento';
        document.getElementById('form-establecimiento').reset();
        Array.from(document.getElementById('form-campanas').options).forEach(o => o.selected = false);
    }

    selectedEstablishmentId = est ? est.id_establecimiento : 'new';
}

function hideForm() {
    document.getElementById('formulario-establecimiento').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'none';
    document.getElementById('acciones-detalle').style.display = 'flex';

    if (selectedEstablishmentId === 'new') {
        document.getElementById('estado-vacio-panel').style.display = 'block';
    } else if (selectedEstablishmentId) {
        document.getElementById('datos-establecimiento').style.display = 'block';
        document.getElementById('btn-editar-establecimiento').disabled = false;
        document.getElementById('btn-eliminar-establecimiento').disabled = false;
    } else {
        document.getElementById('estado-vacio-panel').style.display = 'block';
    }
}

async function guardarEstablecimiento() {
    const btn = document.getElementById('btn-guardar-establecimiento');
    const textoOriginal = btn.textContent;

    try {
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        const nombre = document.getElementById('form-nombre').value.trim();
        const nombreCadena = document.getElementById('form-cadena').value.trim().toUpperCase();
        let cadena = chainsCatalog.find(c => c.nombre_cadena.toUpperCase() === nombreCadena);
        if (!cadena) {
            const nuevoId = nombreCadena.replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            cadena = {
                id: Math.random().toString(36).substring(2, 11),
                id_cadena: nuevoId,
                nombre_cadena: document.getElementById('form-cadena').value.trim()
            };
            const res = await fetch(`${API_BASE}/cadena`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cadena)
            });
            if (!res.ok) throw new Error('Error al crear la cadena');
            chainsCatalog.push(cadena);
        }
        const idCadena = cadena.id_cadena;
        const tipoVia = document.getElementById('form-tipo-via').value;
        const nombreVia = document.getElementById('form-via').value.trim();
        const numero = document.getElementById('form-numero').value.trim();
        const codigoCp = document.getElementById('form-cp').value.trim();
        const lineales = parseInt(document.getElementById('form-lineales').value) || 0;
        const idCoordinador = document.getElementById('form-coordinador').value;
        const campanasSeleccionadas = Array.from(
            document.getElementById('form-campanas').selectedOptions
        ).map(o => o.value);

        if (selectedEstablishmentId && selectedEstablishmentId !== 'new') {
            const estOriginal = establishmentsData.find(e => e.id_establecimiento === selectedEstablishmentId);
            if (!estOriginal) throw new Error('Establecimiento no encontrado');

            if (estOriginal.obj_direccion) {
                await fetch(`${API_BASE}/direccion/${estOriginal.obj_direccion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...estOriginal.obj_direccion,
                        tipo_via: tipoVia,
                        nombre_via: nombreVia,
                        numero: numero || null
                    })
                });
            }

            await fetch(`${API_BASE}/establecimiento/${estOriginal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...estOriginal,
                    nombre_resena: nombre,
                    id_cadena: idCadena,
                    lineales: lineales
                })
            });

            if (codigoCp) {
                const cpExistente = await fetchJson(`${API_BASE}/codigo_postal`);
                let cpObj = cpExistente.find(c => c.codigo === codigoCp);
                if (!cpObj) {
                    const maxIdCp = cpExistente.reduce((max, c) => Math.max(max, c.id_cp || 0), 0);
                    cpObj = {
                        id: Math.random().toString(36).substring(2, 11),
                        id_cp: maxIdCp + 1,
                        codigo: codigoCp
                    };
                    await fetch(`${API_BASE}/codigo_postal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cpObj)
                    });
                }
                if (estOriginal.obj_direccion) {
                    await fetch(`${API_BASE}/direccion/${estOriginal.obj_direccion.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...estOriginal.obj_direccion,
                            id_cp: cpObj.id_cp
                        })
                    });
                }
            }

            const asignaciones = await fetchJson(`${API_BASE}/asignacion_coordinador`);
            const asignacionesEst = asignaciones.filter(a => a.id_tienda === selectedEstablishmentId);
            for (const a of asignacionesEst) {
                await fetch(`${API_BASE}/asignacion_coordinador/${a.id}`, { method: 'DELETE' });
            }

            for (const idCampana of campanasSeleccionadas) {
                await fetch(`${API_BASE}/asignacion_coordinador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_tienda: selectedEstablishmentId,
                        id_usuario_coordinador: idCoordinador ? parseInt(idCoordinador) : null,
                        id_campana: idCampana
                    })
                });
            }
            if (idCoordinador && campanasSeleccionadas.length === 0) {
                await fetch(`${API_BASE}/asignacion_coordinador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_tienda: selectedEstablishmentId,
                        id_usuario_coordinador: parseInt(idCoordinador),
                        id_campana: null
                    })
                });
            }
        } else {
            const todasDirecciones = await fetchJson(`${API_BASE}/direccion`);
            const maxIdDir = todasDirecciones.reduce((max, d) => Math.max(max, d.id_direccion || 0), 0);

            let cpObj = null;
            if (codigoCp) {
                const cpExistente = await fetchJson(`${API_BASE}/codigo_postal`);
                cpObj = cpExistente.find(c => c.codigo === codigoCp);
                if (!cpObj) {
                    const maxIdCp = cpExistente.reduce((max, c) => Math.max(max, c.id_cp || 0), 0);
                    cpObj = {
                        id: Math.random().toString(36).substring(2, 11),
                        id_cp: maxIdCp + 1,
                        codigo: codigoCp
                    };
                    await fetch(`${API_BASE}/codigo_postal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cpObj)
                    });
                }
            }

            const nuevaDir = {
                id: Math.random().toString(36).substring(2, 11),
                id_direccion: maxIdDir + 1,
                tipo_via: tipoVia,
                nombre_via: nombreVia,
                numero: numero || null,
                id_cp: cpObj ? cpObj.id_cp : null
            };
            const resDir = await fetch(`${API_BASE}/direccion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaDir)
            });
            const dirCreada = await resDir.json();

            const todosEst = await fetchJson(`${API_BASE}/establecimiento`);
            const maxIdEst = todosEst.reduce((max, e) => Math.max(max, e.id_establecimiento || 0), 0);
            const nuevoEst = {
                id: Math.random().toString(36).substring(2, 11),
                id_establecimiento: maxIdEst + 1,
                nombre_resena: nombre,
                id_cadena: idCadena,
                lineales: lineales,
                id_direccion: dirCreada.id_direccion
            };
            await fetch(`${API_BASE}/establecimiento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoEst)
            });

            const nuevoIdEst = nuevoEst.id_establecimiento;
            for (const idCampana of campanasSeleccionadas) {
                await fetch(`${API_BASE}/asignacion_coordinador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_tienda: nuevoIdEst,
                        id_usuario_coordinador: idCoordinador ? parseInt(idCoordinador) : null,
                        id_campana: idCampana
                    })
                });
            }
            if (idCoordinador && campanasSeleccionadas.length === 0) {
                await fetch(`${API_BASE}/asignacion_coordinador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_tienda: nuevoIdEst,
                        id_usuario_coordinador: parseInt(idCoordinador),
                        id_campana: null
                    })
                });
            }
        }

        hideForm();
        selectedEstablishmentId = null;
        await loadEstablishments();

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar el establecimiento. Revisa la consola.');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ----- DELETE POPUP -----
function hideDeletePopup() {
    document.getElementById('overlay-eliminar').classList.remove('active');
    document.getElementById('popup-eliminar').classList.remove('active');
}

async function deleteEstablishment(btn) {
    if (!selectedEstablishmentId) {
        alert("Error: No se ha seleccionado ningún establecimiento.");
        return;
    }

    const originalText = btn.textContent;

    try {
        btn.textContent = "Eliminando...";
        btn.disabled = true;

        const response = await fetch(`${API_BASE}/establecimiento/${selectedEstablishmentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        hideDeletePopup();
        selectedEstablishmentId = null;

        document.getElementById('btn-editar-establecimiento').disabled = true;
        document.getElementById('btn-eliminar-establecimiento').disabled = true;
        document.getElementById('datos-establecimiento').style.display = 'none';
        document.getElementById('formulario-establecimiento').style.display = 'none';
        document.getElementById('acciones-formulario').style.display = 'none';
        document.getElementById('acciones-detalle').style.display = 'flex';
        document.getElementById('estado-vacio-panel').style.display = 'block';

        await loadEstablishments();
        alert("Establecimiento eliminado con éxito");

    } catch (error) {
        console.error("Error al intentar eliminar el establecimiento:", error);
        alert("No se pudo eliminar el establecimiento. Asegúrate de que json-server esté corriendo.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
