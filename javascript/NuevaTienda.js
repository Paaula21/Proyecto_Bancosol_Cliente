const API_BASE = 'http://localhost:3000';

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSelects();

    const editData = sessionStorage.getItem('establecimiento_editar');
    if (editData) {
        const est = JSON.parse(editData);
        document.querySelector('h1').textContent = 'Editar Establecimiento';
        document.querySelector('h3.ficha-titulo-principal').textContent = 'Modificar Ficha';
        fillForm(est);
    }

    document.getElementById('form-new-store').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveStore();
    });

    document.getElementById('btn-accept-success').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('establecimiento_editar');
        window.location.href = 'InformacionTienda.html';
    });

    document.getElementById('btn-accept-error').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('error-overlay').classList.remove('active');
        document.getElementById('error-popup').classList.remove('active');
    });
});

async function loadSelects() {
    const [chains, codigosPostales, users, campaigns] = await Promise.all([
        fetchJson(`${API_BASE}/cadena`),
        fetchJson(`${API_BASE}/codigo_postal`),
        fetchJson(`${API_BASE}/usuario`),
        fetchJson(`${API_BASE}/campana`)
    ]);

    const selectCadena = document.getElementById('new-chain');
    chains.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_cadena;
        opt.textContent = c.nombre_cadena;
        selectCadena.appendChild(opt);
    });

    const selectCp = document.getElementById('new-zip');
    codigosPostales.forEach(cp => {
        const opt = document.createElement('option');
        opt.value = cp.id_cp;
        opt.textContent = cp.codigo;
        selectCp.appendChild(opt);
    });

    const selectCoord = document.getElementById('new-coordinator');
    users.filter(u => u.id_rol === 2).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.textContent = capitalize(u.usuario);
        selectCoord.appendChild(opt);
    });

    const selectCamp = document.getElementById('new-campaigns');
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        selectCamp.appendChild(opt);
    });
}

function fillForm(est) {
    document.getElementById('new-name').value = est.nombre_resena || '';
    document.getElementById('new-chain').value = est.id_cadena || '';
    document.getElementById('new-street-type').value = est.obj_direccion?.tipo_via || '';
    document.getElementById('new-street').value = est.obj_direccion?.nombre_via || '';
    document.getElementById('new-number').value = est.obj_direccion?.numero || '';
    document.getElementById('new-zip').value = est.obj_cp?.id_cp || '';
    document.getElementById('new-checkouts').value = est.lineales || '';
    document.getElementById('new-coordinator').value = est.id_coordinador || '';

    if (est.campanasIds) {
        const select = document.getElementById('new-campaigns');
        Array.from(select.options).forEach(opt => {
            opt.selected = est.campanasIds.includes(opt.value);
        });
    }
}

async function saveStore() {
    try {
        const nombre = document.getElementById('new-name').value.trim();
        const idCadena = document.getElementById('new-chain').value;
        const tipoVia = document.getElementById('new-street-type').value;
        const nombreVia = document.getElementById('new-street').value.trim();
        const numero = document.getElementById('new-number').value.trim();
        const idCp = document.getElementById('new-zip').value;
        const lineales = parseInt(document.getElementById('new-checkouts').value) || 0;
        const idCoordinador = document.getElementById('new-coordinator').value;
        const campanasSeleccionadas = Array.from(
            document.getElementById('new-campaigns').selectedOptions
        ).map(o => o.value);

        const editData = sessionStorage.getItem('establecimiento_editar');

        if (editData) {
            const estOriginal = JSON.parse(editData);

            if (estOriginal.obj_direccion) {
                await fetch(`${API_BASE}/direccion/${estOriginal.obj_direccion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...estOriginal.obj_direccion,
                        tipo_via: tipoVia,
                        nombre_via: nombreVia,
                        numero: numero || null,
                        id_cp: idCp
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

            const asignaciones = await fetchJson(`${API_BASE}/asignacion_coordinador`);
            const asignExistente = asignaciones.find(a => a.id_tienda === estOriginal.id_establecimiento);
            if (asignExistente) {
                await fetch(`${API_BASE}/asignacion_coordinador/${asignExistente.id}`, { method: 'DELETE' });
            }
            if (idCoordinador) {
                await fetch(`${API_BASE}/asignacion_coordinador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Math.random().toString(36).substring(2, 11),
                        id_tienda: estOriginal.id_establecimiento,
                        id_usuario_coordinador: parseInt(idCoordinador),
                        id_campana: campanasSeleccionadas[0] || null
                    })
                });
            }

        } else {
            const todasDirecciones = await fetchJson(`${API_BASE}/direccion`);
            const maxIdDir = todasDirecciones.reduce((max, d) => Math.max(max, d.id_direccion || 0), 0);
            const nuevaDir = {
                id: Math.random().toString(36).substring(2, 11),
                id_direccion: maxIdDir + 1,
                tipo_via: tipoVia,
                nombre_via: nombreVia,
                numero: numero || null,
                id_cp: idCp
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
            const resEst = await fetch(`${API_BASE}/establecimiento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoEst)
            });
            const estCreado = await resEst.json();

            if (idCoordinador || campanasSeleccionadas.length > 0) {
                const campanasACrear = campanasSeleccionadas.length > 0 ? campanasSeleccionadas : [null];
                for (const idCampana of campanasACrear) {
                    await fetch(`${API_BASE}/asignacion_coordinador`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: Math.random().toString(36).substring(2, 11),
                            id_tienda: estCreado.id_establecimiento,
                            id_usuario_coordinador: idCoordinador ? parseInt(idCoordinador) : null,
                            id_campana: idCampana
                        })
                    });
                }
            }
        }

        document.getElementById('save-overlay').classList.add('active');
        document.getElementById('save-popup').classList.add('active');

    } catch (error) {
        console.error('Error al guardar el establecimiento:', error);
        document.getElementById('error-popup-text').textContent =
            'No se pudo guardar el establecimiento. Revisa la consola y que json-server esté corriendo.';
        document.getElementById('error-overlay').classList.add('active');
        document.getElementById('error-popup').classList.add('active');
    }
}
