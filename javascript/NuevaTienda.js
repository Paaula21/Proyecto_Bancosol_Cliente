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
    await cargarSelects();

    const datoEdicion = sessionStorage.getItem('establecimiento_editar');
    if (datoEdicion) {
        const est = JSON.parse(datoEdicion);
        document.querySelector('h1').textContent = 'Editar Establecimiento';
        document.querySelector('h3.ficha-titulo-principal').textContent = 'Modificar Ficha';
        prellenarFormulario(est);
    }

    document.getElementById('form-nueva-tienda').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarTienda();
    });

    document.getElementById('btn-aceptar-exito').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('establecimiento_editar');
        window.location.href = 'InformacionTienda.html';
    });

    document.getElementById('btn-aceptar-error').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('overlay-error').classList.remove('active');
        document.getElementById('popup-error').classList.remove('active');
    });
});

async function cargarSelects() {
    const [chains, codigosPostales, users, campaigns] = await Promise.all([
        fetchJson(`${API_BASE}/cadena`),
        fetchJson(`${API_BASE}/codigo_postal`),
        fetchJson(`${API_BASE}/usuario`),
        fetchJson(`${API_BASE}/campana`)
    ]);

    const selectCadena = document.getElementById('nueva-cadena');
    chains.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_cadena;
        opt.textContent = c.nombre_cadena;
        selectCadena.appendChild(opt);
    });

    const selectCp = document.getElementById('nueva-cp');
    codigosPostales.forEach(cp => {
        const opt = document.createElement('option');
        opt.value = cp.id_cp;
        opt.textContent = cp.codigo;
        selectCp.appendChild(opt);
    });

    const selectCoord = document.getElementById('nueva-coordinador');
    users.filter(u => u.id_rol === 2).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.textContent = capitalize(u.usuario);
        selectCoord.appendChild(opt);
    });

    const selectCamp = document.getElementById('nueva-campanas');
    campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_campana;
        opt.textContent = c.nombre_campana || c.id_campana;
        selectCamp.appendChild(opt);
    });
}

function prellenarFormulario(est) {
    document.getElementById('nueva-nombre').value = est.nombre_resena || '';
    document.getElementById('nueva-cadena').value = est.id_cadena || '';
    document.getElementById('nueva-tipo-via').value = est.obj_direccion?.tipo_via || '';
    document.getElementById('nueva-via').value = est.obj_direccion?.nombre_via || '';
    document.getElementById('nueva-numero').value = est.obj_direccion?.numero || '';
    document.getElementById('nueva-cp').value = est.obj_cp?.id_cp || '';
    document.getElementById('nueva-lineales').value = est.lineales || '';
    document.getElementById('nueva-coordinador').value = est.id_coordinador || '';

    if (est.campanasIds) {
        const select = document.getElementById('nueva-campanas');
        Array.from(select.options).forEach(opt => {
            opt.selected = est.campanasIds.includes(opt.value);
        });
    }
}

async function guardarTienda() {
    const btn = document.getElementById('btn-guardar-tienda');
    const textoOriginal = btn.textContent;

    try {
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        const nombre = document.getElementById('nueva-nombre').value.trim();
        const idCadena = document.getElementById('nueva-cadena').value;
        const tipoVia = document.getElementById('nueva-tipo-via').value;
        const nombreVia = document.getElementById('nueva-via').value.trim();
        const numero = document.getElementById('nueva-numero').value.trim();
        const idCp = document.getElementById('nueva-cp').value;
        const lineales = parseInt(document.getElementById('nueva-lineales').value) || 0;
        const idCoordinador = document.getElementById('nueva-coordinador').value;
        const campanasSeleccionadas = Array.from(
            document.getElementById('nueva-campanas').selectedOptions
        ).map(o => o.value);

        const datoEdicion = sessionStorage.getItem('establecimiento_editar');

        if (datoEdicion) {
            const estOriginal = JSON.parse(datoEdicion);

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

        document.getElementById('overlay-exito').classList.add('active');
        document.getElementById('popup-exito').classList.add('active');

    } catch (error) {
        console.error('Error al guardar el establecimiento:', error);
        document.getElementById('texto-error-popup').textContent =
            'No se pudo guardar el establecimiento. Revisa la consola y que json-server esté corriendo.';
        document.getElementById('overlay-error').classList.add('active');
        document.getElementById('popup-error').classList.add('active');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}
