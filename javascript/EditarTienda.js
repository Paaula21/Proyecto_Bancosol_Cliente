document.addEventListener('click', async function(e) {
    if (e.target && e.target.id === 'btn-add') {
        showForm(null);
    }

    if (e.target && e.target.id === 'btn-edit') {
        e.stopPropagation();
        const est = establishmentsData.find(e => e.id_establecimiento === selectedEstablishmentId);
        if (est) showForm(est);
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
    if (e.target && e.target.id === 'establishment-form') {
        e.preventDefault();
        await saveEstablishment();
    }
});

// ----- FORM FUNCTIONS -----
function showForm(est) {
    document.getElementById('empty-state-panel').style.display = 'none';
    document.getElementById('establishment-data').style.display = 'none';
    document.getElementById('establishment-form-panel').style.display = 'block';
    document.getElementById('detail-actions').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'flex';

    if (est) {
        document.getElementById('form-title').textContent = 'Editar Establecimiento';
        document.getElementById('form-name').value = est.nombre_resena || '';
        document.getElementById('form-chain').value = est.nombre_cadena || '';
        document.getElementById('form-street-type').value = est.obj_direccion?.tipo_via || '';
        document.getElementById('form-street').value = est.obj_direccion?.nombre_via || '';
        document.getElementById('form-number').value = est.obj_direccion?.numero || '';
        document.getElementById('form-zip').value = est.obj_cp?.codigo || '';
        document.getElementById('form-checkouts').value = est.lineales || '';
        document.getElementById('form-coordinator').value = est.id_coordinador || '';

        if (est.campanasIds) {
            const select = document.getElementById('form-campaigns');
            Array.from(select.options).forEach(opt => {
                opt.selected = est.campanasIds.includes(opt.value);
            });
        }
    } else {
        document.getElementById('form-title').textContent = 'Nuevo Establecimiento';
        document.getElementById('establishment-form').reset();
        Array.from(document.getElementById('form-campaigns').options).forEach(o => o.selected = false);
    }

    selectedEstablishmentId = est ? est.id_establecimiento : 'new';
}

function hideForm() {
    document.getElementById('establishment-form-panel').style.display = 'none';
    document.getElementById('form-actions-bar').style.display = 'none';

    if (selectedEstablishmentId === 'new') {
        document.getElementById('empty-state-panel').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'none';
    } else if (selectedEstablishmentId) {
        document.getElementById('establishment-data').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'flex';
        document.getElementById('btn-edit').disabled = false;
        document.getElementById('btn-delete').disabled = false;
    } else {
        document.getElementById('empty-state-panel').style.display = 'block';
        document.getElementById('detail-actions').style.display = 'none';
    }
}

async function saveEstablishment() {
    try {
        const nombre = document.getElementById('form-name').value.trim();
        const nombreCadena = document.getElementById('form-chain').value.trim().toUpperCase();
        let cadena = chainsCatalog.find(c => c.nombre_cadena.toUpperCase() === nombreCadena);
        if (!cadena) {
            const nuevoId = nombreCadena.replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            cadena = {
                id: Math.random().toString(36).substring(2, 11),
                id_cadena: nuevoId,
                nombre_cadena: document.getElementById('form-chain').value.trim()
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
        const tipoVia = document.getElementById('form-street-type').value;
        const nombreVia = document.getElementById('form-street').value.trim();
        const numero = document.getElementById('form-number').value.trim();
        const codigoCp = document.getElementById('form-zip').value.trim();
        const lineales = parseInt(document.getElementById('form-checkouts').value) || 0;
        const idCoordinador = document.getElementById('form-coordinator').value;
        const campanasSeleccionadas = Array.from(
            document.getElementById('form-campaigns').selectedOptions
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

        selectedEstablishmentId = null;
        hideForm();
        document.getElementById('save-overlay').classList.add('active');
        document.getElementById('save-popup').classList.add('active');

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar el establecimiento. Revisa la consola.');
    }
}

function hideSuccessPopup() {
    document.getElementById('save-overlay').classList.remove('active');
    document.getElementById('save-popup').classList.remove('active');
    selectedEstablishmentId = null;
    loadEstablishments();
}
