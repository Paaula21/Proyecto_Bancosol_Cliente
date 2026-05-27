const API_BASE = 'http://localhost:3000';

let chainsData = [];
let selectedChainId = null;
let selectedChainInternalId = null;
let campaignsData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadChains();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);
    document.getElementById('btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedChainId) {
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
        await deleteChain(e.target);
    });
});

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
}

function clearSelection() {
    document.querySelectorAll('#chains-table tr').forEach(r => r.classList.remove('selected'));
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
    const filterSelect = document.getElementById('filter-campaign');
    while (filterSelect.options.length > 1) filterSelect.remove(1);
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        filterSelect.appendChild(opt);
    });
    const formSelect = document.getElementById('form-campaigns');
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
    const theadTr = document.querySelector('#chains-table').closest('table').querySelector('thead tr');
    theadTr.innerHTML = `
        <th>Nombre</th>
        <th>Nº Establecimientos</th>
        ${campaignsData.map(c => `<th>${c.nombre_campana || c.id_campana}</th>`).join('')}
    `;
}

function setTableState(state, message = '') {
    const tbody = document.getElementById('chains-table');
    const counter = document.getElementById('chains-counter');
    const colspan = getColspan();

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="table-cell-loading">Cargando...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="table-cell-error">${message}</td></tr>`;
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
        campana: document.getElementById('filter-campaign').value
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
    tr.classList.add('row-selectable');

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
    const tbody = document.getElementById('chains-table');
    tbody.innerHTML = '';
    list.forEach(cad => tbody.appendChild(
        createChainRow(cad, (c, tr) => {
            clearSelection();
            tr.classList.add('selected');
            showDetail(c);
        })
    ));
}

function updateCounter(total) {
    const label = total === 1 ? 'cadena encontrada' : 'cadenas encontradas';
    document.getElementById('chains-counter').textContent = `${total} ${label}`;
}

function showDetail(cad) {
    selectedChainId = cad.id_cadena;
    selectedChainInternalId = cad.id;

    document.getElementById('chain-form-panel').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'none';
    document.getElementById('detail-actions').style.display = 'flex';
    document.getElementById('empty-state-panel').style.display = 'none';
    document.getElementById('chain-data').style.display = 'block';

    document.getElementById('btn-edit').disabled = false;
    document.getElementById('btn-delete').disabled = false;

    document.getElementById('record-name').textContent = cad.nombre_cadena;
    document.getElementById('record-establishments').textContent = cad.num_establecimientos;

    const campanasContainer = document.getElementById('record-campaigns-content');
    campanasContainer.innerHTML = '';
    campaignsData.forEach(c => {
        const participa = cad.campanasIds && cad.campanasIds.includes(c.id_campana);
        const p = document.createElement('p');
        p.innerHTML = `<strong>${c.nombre_campana || c.id_campana}:</strong> ${participa ? 'Sí' : 'No'}`;
        campanasContainer.appendChild(p);
    });
}

function hideDeletePopup() {
    document.getElementById('delete-overlay').classList.remove('active');
    document.getElementById('delete-popup').classList.remove('active');
}

async function deleteChain(btn) {
    if (!selectedChainInternalId || !selectedChainId) {
        alert("Error: No se ha seleccionado ninguna cadena.");
        return;
    }

    try {
        const campanaCadena = await fetchJson(`${API_BASE}/campana_cadena`);
        const relaciones = campanaCadena.filter(cc => cc.id_cadena === selectedChainId);
        for (const r of relaciones) {
            await fetch(`${API_BASE}/campana_cadena/${r.id}`, { method: 'DELETE' });
        }

        const response = await fetch(`${API_BASE}/cadena/${selectedChainInternalId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        hideDeletePopup();
        selectedChainId = null;
        selectedChainInternalId = null;

        document.getElementById('btn-edit').disabled = true;
        document.getElementById('btn-delete').disabled = true;
        document.getElementById('chain-data').style.display = 'none';
        document.getElementById('chain-form-panel').style.display = 'none';
        document.getElementById('form-actions-bar').style.display = 'none';
        document.getElementById('detail-actions').style.display = 'none';
        document.getElementById('empty-state-panel').style.display = 'block';

        await loadChains();

    } catch (error) {
        console.error("Error al intentar eliminar la cadena:", error);
        alert("No se pudo eliminar la cadena. Asegúrate de que json-server esté corriendo.");
    }
}
