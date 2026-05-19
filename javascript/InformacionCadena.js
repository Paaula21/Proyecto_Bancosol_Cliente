const API_BASE = 'http://localhost:3000';
const VISIBLE_ROWS = 4;

let chainsData = [];
let selectedChainId = null;
let campaignsData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadChains();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);
    document.getElementById('btn-add-cadena').addEventListener('click', () => showForm(null));
    document.getElementById('btn-editar-cadena').addEventListener('click', (e) => {
        e.stopPropagation();
        const cad = chainsData.find(c => c.id_cadena === selectedChainId);
        if (cad) showForm(cad);
    });
    document.getElementById('btn-eliminar-cadena').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedChainId) {
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
        await deleteChain(e.target);
    });
    document.getElementById('btn-cancelar-formulario').addEventListener('click', hideForm);
    document.getElementById('form-cadena').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCadena();
    });
});

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
}

function updateScrollable(list) {
    const wrapper = document.querySelector('.table-wrapper');
    wrapper.classList.toggle('scrollable', list.length > VISIBLE_ROWS);
}

function clearSelection() {
    document.querySelectorAll('#tabla-cadenas tr').forEach(r => r.classList.remove('selected'));
}

function participatesInCampaign(cad, campanaCadena, idCampana) {
    return campanaCadena.some(cc => cc.id_cadena === cad.id_cadena && cc.id_campana === idCampana);
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
    const filterSelect = document.getElementById('filter-campana');
    while (filterSelect.options.length > 1) filterSelect.remove(1);
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        filterSelect.appendChild(opt);
    });
    const formSelect = document.getElementById('form-campanas');
    formSelect.innerHTML = '';
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        formSelect.appendChild(opt);
    });
}

function getColspan() {
    return 2 + campaignsData.length;
}

function renderTableHeader() {
    const theadTr = document.querySelector('#tabla-cadenas').closest('table').querySelector('thead tr');
    theadTr.innerHTML = `
        <th>Nombre</th>
        <th>Nº Establecimientos</th>
        ${campaignsData.map(c => `<th>${c.nombre_campana || c.id_campana}</th>`).join('')}
    `;
}

function setTableState(state, message = '') {
    const tbody = document.getElementById('tabla-cadenas');
    const counter = document.getElementById('contador-cadenas');
    const colspan = getColspan();

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:20px;">Cargando...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:20px;color:#dc2626;">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

async function loadChains() {
    setTableState('loading');
    try {
        const [chains, establishments, campanaCadena, campaigns] = await Promise.all([
            fetchJson(`${API_BASE}/cadena`),
            fetchJson(`${API_BASE}/establecimiento`),
            fetchJson(`${API_BASE}/campana_cadena`),
            fetchJson(`${API_BASE}/campana`)
        ]);

        campaignsData = campaigns;
        renderTableHeader();

        populateChainSelect(chains);
        populateCampaignSelect(campaigns);

        chainsData = chains.map(cad => ({
            ...cad,
            num_establecimientos: establishments.filter(e => e.id_cadena === cad.id_cadena).length,
            campanasIds: campanaCadena
                .filter(cc => cc.id_cadena === cad.id_cadena)
                .map(cc => cc.id_campana)
        }));

        displayChains(chainsData);
        updateCounter(chainsData.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        setTableState('error', `Error al conectar con la base de datos. Asegúrate de que json-server esté corriendo en ${API_BASE}`);
    }
}

function applyFilters() {
    const filters = {
        cadena:  document.getElementById('filter-chain').value,
        campana: document.getElementById('filter-campana').value
    };

    const filtered = chainsData.filter(cad => {
        if (filters.cadena && cad.id_cadena !== filters.cadena) return false;
        if (filters.campana && (!cad.campanasIds || !cad.campanasIds.includes(filters.campana))) return false;
        return true;
    });

    displayChains(filtered);
    updateCounter(filtered.length);
}

function createChainRow(cad, onSelect) {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';

    let cells = `
        <td><strong>${cad.nombre_cadena}</strong></td>
        <td>${cad.num_establecimientos}</td>
    `;
    campaignsData.forEach(c => {
        const participa = cad.campanasIds && cad.campanasIds.includes(c.id_campana);
        cells += `<td>${participa ? 'Sí' : 'No'}</td>`;
    });

    tr.innerHTML = cells;

    tr.addEventListener('click', () => {
        onSelect(cad, tr);
    });

    return tr;
}

function displayChains(list) {
    const tbody = document.getElementById('tabla-cadenas');
    tbody.innerHTML = '';
    list.forEach(cad => tbody.appendChild(
        createChainRow(cad, (c, tr) => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(c);
        })
    ));
    updateScrollable(list);
}

function updateCounter(total) {
    const label = total === 1 ? 'cadena encontrada' : 'cadenas encontradas';
    document.getElementById('contador-cadenas').textContent = `${total} ${label}`;
}

function showDetail(cad) {
    selectedChainId = cad.id_cadena;

    document.getElementById('formulario-cadena').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'none';
    document.getElementById('acciones-detalle').style.display = 'flex';
    document.getElementById('estado-vacio-panel').style.display = 'none';
    document.getElementById('datos-cadena').style.display = 'block';

    document.getElementById('btn-editar-cadena').disabled = false;
    document.getElementById('btn-eliminar-cadena').disabled = false;

    document.getElementById('ficha-nombre').textContent = cad.nombre_cadena;
    document.getElementById('ficha-establecimientos').textContent = cad.num_establecimientos;

    const campanasContainer = document.getElementById('ficha-campanas-contenido');
    campanasContainer.innerHTML = '';
    campaignsData.forEach(c => {
        const participa = cad.campanasIds && cad.campanasIds.includes(c.id_campana);
        const p = document.createElement('p');
        p.innerHTML = `<strong>${c.nombre_campana || c.id_campana}:</strong> ${participa ? 'Sí' : 'No'}`;
        campanasContainer.appendChild(p);
    });
}

function showForm(cad) {
    document.getElementById('estado-vacio-panel').style.display = 'none';
    document.getElementById('datos-cadena').style.display = 'none';
    document.getElementById('formulario-cadena').style.display = 'block';
    document.getElementById('acciones-detalle').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'flex';

    if (cad) {
        document.getElementById('form-titulo').textContent = 'Editar Cadena';
        document.getElementById('form-nombre').value = cad.nombre_cadena || '';

        if (cad.campanasIds) {
            const select = document.getElementById('form-campanas');
            Array.from(select.options).forEach(opt => {
                opt.selected = cad.campanasIds.includes(opt.value);
            });
        }
    } else {
        document.getElementById('form-titulo').textContent = 'Nueva Cadena';
        document.getElementById('form-cadena').reset();
        Array.from(document.getElementById('form-campanas').options).forEach(o => o.selected = false);
    }

    selectedChainId = cad ? cad.id_cadena : 'new';
}

function hideForm() {
    document.getElementById('formulario-cadena').style.display = 'none';
    document.getElementById('acciones-formulario').style.display = 'none';
    document.getElementById('acciones-detalle').style.display = 'flex';

    if (selectedChainId === 'new') {
        document.getElementById('estado-vacio-panel').style.display = 'block';
    } else if (selectedChainId) {
        document.getElementById('datos-cadena').style.display = 'block';
        document.getElementById('btn-editar-cadena').disabled = false;
        document.getElementById('btn-eliminar-cadena').disabled = false;
    } else {
        document.getElementById('estado-vacio-panel').style.display = 'block';
    }
}

async function guardarCadena() {
    const btn = document.getElementById('btn-guardar-cadena');
    const textoOriginal = btn.textContent;

    try {
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        const nombre = document.getElementById('form-nombre').value.trim();
        const campanasSeleccionadas = Array.from(
            document.getElementById('form-campanas').selectedOptions
        ).map(o => o.value);

        if (selectedChainId && selectedChainId !== 'new') {
            const cadOriginal = chainsData.find(c => c.id_cadena === selectedChainId);
            if (!cadOriginal) throw new Error('Cadena no encontrada');

            await fetch(`${API_BASE}/cadena/${selectedChainId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...cadOriginal,
                    nombre_cadena: nombre
                })
            });

            const campanaCadena = await fetchJson(`${API_BASE}/campana_cadena`);
            const relacionesEst = campanaCadena.filter(cc => cc.id_cadena === selectedChainId);
            for (const r of relacionesEst) {
                await fetch(`${API_BASE}/campana_cadena/${r.id}`, { method: 'DELETE' });
            }

            for (const idCampana of campanasSeleccionadas) {
                await fetch(`${API_BASE}/campana_cadena`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_cadena: selectedChainId,
                        id_campana: idCampana
                    })
                });
            }
        } else {
            const nuevoId = nombre.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            const nuevaCadena = {
                id: Math.random().toString(36).substring(2, 11),
                id_cadena: nuevoId,
                nombre_cadena: nombre
            };
            await fetch(`${API_BASE}/cadena`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaCadena)
            });

            for (const idCampana of campanasSeleccionadas) {
                await fetch(`${API_BASE}/campana_cadena`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_cadena: nuevoId,
                        id_campana: idCampana
                    })
                });
            }
        }

        hideForm();
        selectedChainId = null;
        await loadChains();

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la cadena. Revisa la consola.');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

function hideDeletePopup() {
    document.getElementById('overlay-eliminar').classList.remove('active');
    document.getElementById('popup-eliminar').classList.remove('active');
}

async function deleteChain(btn) {
    if (!selectedChainId) {
        alert("Error: No se ha seleccionado ninguna cadena.");
        return;
    }

    const originalText = btn.textContent;

    try {
        btn.textContent = "Eliminando...";
        btn.disabled = true;

        const response = await fetch(`${API_BASE}/cadena/${selectedChainId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        hideDeletePopup();
        selectedChainId = null;

        document.getElementById('btn-editar-cadena').disabled = true;
        document.getElementById('btn-eliminar-cadena').disabled = true;
        document.getElementById('datos-cadena').style.display = 'none';
        document.getElementById('formulario-cadena').style.display = 'none';
        document.getElementById('acciones-formulario').style.display = 'none';
        document.getElementById('acciones-detalle').style.display = 'flex';
        document.getElementById('estado-vacio-panel').style.display = 'block';

        await loadChains();
        alert("Cadena eliminada con éxito");

    } catch (error) {
        console.error("Error al intentar eliminar la cadena:", error);
        alert("No se pudo eliminar la cadena. Asegúrate de que json-server esté corriendo.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
