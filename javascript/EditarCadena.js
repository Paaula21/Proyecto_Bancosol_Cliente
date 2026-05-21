// ----- EVENT DELEGATION FOR EDIT/ADD FORM -----
document.addEventListener('click', async function(e) {
    if (e.target && e.target.id === 'btn-add') {
        showForm(null);
    }

    if (e.target && e.target.id === 'btn-edit') {
        e.stopPropagation();
        const cad = chainsData.find(c => c.id_cadena === selectedChainId);
        if (cad) showForm(cad);
    }

    if (e.target && e.target.id === 'btn-cancel-form') {
        hideForm();
    }

    if (e.target && e.target.id === 'btn-accept-success') {
        e.preventDefault();
        hideSuccessPopup();
    }
});

document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'chain-form') {
        e.preventDefault();
        await saveChain();
    }
});

// ----- FORM FUNCTIONS -----
function showForm(cad) {
    document.getElementById('empty-state-panel').style.display = 'none';
    document.getElementById('chain-data').style.display = 'none';
    document.getElementById('chain-form-panel').style.display = 'block';
    document.getElementById('detail-actions').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'flex';

    if (cad) {
        document.getElementById('form-title').textContent = 'Editar Cadena';
        document.getElementById('form-name').value = cad.nombre_cadena || '';

        if (cad.campanasIds) {
            const select = document.getElementById('form-campaigns');
            Array.from(select.options).forEach(opt => {
                opt.selected = cad.campanasIds.includes(opt.value);
            });
        }
    } else {
        document.getElementById('form-title').textContent = 'Nueva Cadena';
        document.getElementById('chain-form').reset();
        Array.from(document.getElementById('form-campaigns').options).forEach(o => o.selected = false);
    }

    selectedChainId = cad ? cad.id_cadena : 'new';
}

function hideForm() {
    document.getElementById('chain-form-panel').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'none';

    if (selectedChainId === 'new') {
        document.getElementById('empty-state-panel').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'none';
    } else if (selectedChainId) {
        document.getElementById('chain-data').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'flex';
        document.getElementById('btn-edit').disabled = false;
        document.getElementById('btn-delete').disabled = false;
    } else {
        document.getElementById('empty-state-panel').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'none';
    }
}

async function saveChain() {
    try {
        const nombre = document.getElementById('form-name').value.trim();
        const campanasSeleccionadas = Array.from(
            document.getElementById('form-campaigns').selectedOptions
        ).map(o => o.value);

        if (selectedChainId && selectedChainId !== 'new') {
            const cadOriginal = chainsData.find(c => c.id_cadena === selectedChainId);
            if (!cadOriginal) throw new Error('Cadena no encontrada');

            await fetch(`${API_BASE}/cadena/${cadOriginal.id}`, {
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

        selectedChainId = null;
        selectedChainInternalId = null;
        hideForm();
        document.getElementById('save-overlay').classList.add('active');
        document.getElementById('save-popup').classList.add('active');

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la cadena. Revisa la consola.');
    }
}

function hideSuccessPopup() {
    document.getElementById('save-overlay').classList.remove('active');
    document.getElementById('save-popup').classList.remove('active');
    selectedChainId = null;
    selectedChainInternalId = null;
    loadChains();
}
