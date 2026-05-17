// ----- INITIAL CONFIGURATION -----
const API_BASE = 'http://localhost:3000';

let chainsData = [];
let selectedChainId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadChains();
    document.getElementById('btn-filter').addEventListener('click', applyFilters);
    document.getElementById('btn-cancelar-eliminar').addEventListener('click', (e) => {
        e.preventDefault();
        hideDeletePopup();
    });
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', async (e) => {
        e.preventDefault();
        await deleteChain(e.target);
    });
});

// ----- UTILITIES -----
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
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

function setTableState(state, message = '') {
    const tbody = document.getElementById('tabla-cadenas');
    const counter = document.getElementById('contador-cadenas');

    if (state === 'loading') {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">Cargando...</td></tr>`;
        counter.textContent = 'Cargando...';
    } else if (state === 'error') {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#dc2626;">${message}</td></tr>`;
        counter.textContent = 'Error de conexión';
    }
}

// ----- FETCH AND PROCESS DATA -----
async function loadChains() {
    setTableState('loading');
    try {
        const [chains, establishments, campanaCadena] = await Promise.all([
            fetchJson(`${API_BASE}/cadena`),
            fetchJson(`${API_BASE}/establecimiento`),
            fetchJson(`${API_BASE}/campana_cadena`)
        ]);

        populateChainSelect(chains);

        chainsData = chains.map(cad => ({
            ...cad,
            num_establecimientos: establishments.filter(e => e.id_cadena === cad.id_cadena).length,
            gran_recogida: participatesInCampaign(cad, campanaCadena, "GR2025"),
            primavera: participatesInCampaign(cad, campanaCadena, "PRIM2025")
        }));

        displayChains(chainsData);
        updateCounter(chainsData.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        setTableState('error', `Error al conectar con la base de datos. Asegúrate de que json-server esté corriendo en ${API_BASE}`);
    }
}

// ----- FILTER LOGIC -----
function applyFilters() {
    const filters = {
        cadena: document.getElementById('filter-chain').value,
        gr:     document.getElementById('filter-gr').value,
        prim:   document.getElementById('filter-primavera').value
    };

    const filtered = chainsData.filter(cad => {
        if (filters.cadena && cad.id_cadena !== filters.cadena) return false;
        if (filters.gr === 'yes' && !cad.gran_recogida) return false;
        if (filters.gr === 'no'  &&  cad.gran_recogida) return false;
        if (filters.prim === 'yes' && !cad.primavera) return false;
        if (filters.prim === 'no'  &&  cad.primavera) return false;
        return true;
    });

    displayChains(filtered);
    updateCounter(filtered.length);
}

// ----- TABLE RENDERING -----
function createChainRow(cad, onEdit, onDelete) {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';

    tr.innerHTML = `
        <td><strong>${cad.nombre_cadena}</strong></td>
        <td>${cad.num_establecimientos}</td>
        <td>${cad.gran_recogida ? 'Sí' : 'No'}</td>
        <td>${cad.primavera ? 'Sí' : 'No'}</td>
        <td class="col-actions">
            <button class="btn btn--secondary btn-editar">Editar</button>
            <button class="btn btn--danger btn-eliminar">Eliminar</button>
        </td>
    `;

    tr.querySelector('.btn-editar').addEventListener('click', (e) => {
        e.stopPropagation();
        onEdit(cad);
    });

    tr.querySelector('.btn-eliminar').addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(cad, tr);
    });

    tr.addEventListener('click', () => {
        clearSelection();
        tr.classList.add('selected');
    });

    return tr;
}

function displayChains(list) {
    const tbody = document.getElementById('tabla-cadenas');
    tbody.innerHTML = '';
    list.forEach(cad => tbody.appendChild(
        createChainRow(
            cad,
            (c) => {
                sessionStorage.setItem('cadena_editar', JSON.stringify(c));
                window.location.href = 'NuevaCadena.html';
            },
            (c, tr) => {
                clearSelection();
                tr.classList.add('selected');
                selectedChainId = c.id_cadena;
                document.getElementById('overlay-eliminar').classList.add('active');
                document.getElementById('popup-eliminar').classList.add('active');
            }
        )
    ));
}

function updateCounter(total) {
    const label = total === 1 ? 'cadena encontrada' : 'cadenas encontradas';
    document.getElementById('contador-cadenas').textContent = `${total} ${label}`;
}

// ----- DELETE POPUP -----
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
