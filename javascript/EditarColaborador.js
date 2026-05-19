const HEADERS_JSON_EDICION = { 'Content-Type': 'application/json' };

// Se obtiene el valor del id
function getValEditar(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.error(`ERROR: No se encontro el elemento con ID: ${id}`);
        return "";
    }
    return el.value.trim();
}

// Se limpian los valores asignados cuando no hay ninguno guardado
function limpiarValor(valor) {
    if (!valor) return '';
    const valLimpio = valor.toString().trim();
    const valComparacion = valLimpio
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const invalidos = ['---', 'sin asignar', 'no disponible', 'sin localidad', 'direccion no disponible'];

    if (invalidos.includes(valComparacion)) return '';
    return valLimpio;
}

function setPopupActivoEdicion(overlayId, popupId, activo) {
    document.getElementById(overlayId)?.classList.toggle('active', activo);
    document.getElementById(popupId)?.classList.toggle('active', activo);
}

async function fetchJsonEdicion(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Error ${response.status} en ${url}`);
    }

    const texto = await response.text();
    return texto ? JSON.parse(texto) : null;
}

function crearRecursoEdicion(recurso, objeto) {
    return fetchJsonEdicion(`${API_BASE}/${recurso}`, {
        method: 'POST',
        headers: HEADERS_JSON_EDICION,
        body: JSON.stringify(objeto)
    });
}

function actualizarRecursoEdicion(recurso, id, objeto) {
    return fetchJsonEdicion(`${API_BASE}/${recurso}/${id}`, {
        method: 'PUT',
        headers: HEADERS_JSON_EDICION,
        body: JSON.stringify(objeto)
    });
}

function borrarRecursoEdicion(recurso, id) {
    return fetchJsonEdicion(`${API_BASE}/${recurso}/${id}`, { method: 'DELETE' });
}

function generarIdEdicion() {
    return Math.random().toString(36).substring(2, 12);
}

function maxNumeroEdicion(lista, campo) {
    return Math.max(0, ...lista.map(item => Number(item?.[campo]) || 0));
}

// Normalizar los textos
function normalizarTextoEdicion(valor) {
    return (valor ?? '').toString().trim();
}

function normalizarTextoComparacionEdicion(valor) {
    return normalizarTextoEdicion(valor)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function normalizarCodigoPostalEdicion(valor) {
    return normalizarTextoEdicion(valor);
}
// Se realiza la comprobación para que si se borra, no salga vacío y salga Sin asignar
function hayDatosContactoEdicion(nombre, email, telefono) {
    return Boolean(nombre || email || telefono);
}

async function cargarCatalogosColaboradorEdicion() {
    const [cps, divisiones, personas, direcciones, colaboradores] = await Promise.all([
        fetchJsonEdicion(`${API_BASE}/codigo_postal`),
        fetchJsonEdicion(`${API_BASE}/division_territorial`),
        fetchJsonEdicion(`${API_BASE}/persona`),
        fetchJsonEdicion(`${API_BASE}/direccion`),
        fetchJsonEdicion(`${API_BASE}/colaborador`)
    ]);

    return { cps, divisiones, personas, direcciones, colaboradores };
}

async function obtenerOCrearDivisionTerritorialEdicion(divisiones, localidadTxt, zonaId) {
    const localidad = normalizarTextoEdicion(localidadTxt);
    const zonaNumerica = Number(zonaId);

    if (!localidad) {
        throw new Error("La localidad es obligatoria.");
    }

    if (!zonaNumerica) {
        throw new Error("La zona geografica es obligatoria.");
    }

    let divObj = divisiones.find(d =>
        normalizarTextoComparacionEdicion(d.nombre_division) === normalizarTextoComparacionEdicion(localidad) &&
        Number(d.id_zona) === zonaNumerica
    );

    if (divObj) {
        return divObj;
    }

    const nuevaDivision = {
        id: generarIdEdicion(),
        id_division: maxNumeroEdicion(divisiones, 'id_division') + 1,
        nombre_division: localidad,
        id_zona: zonaNumerica,
        tipo: true
    };

    divObj = await crearRecursoEdicion('division_territorial', nuevaDivision);
    divisiones.push(divObj);
    return divObj;
}

async function obtenerOCrearCodigoPostalEdicion(cps, divisiones, cpTxt, localidadTxt, zonaId) {
    const cpNormalizado = normalizarCodigoPostalEdicion(cpTxt);

    if (!/^\d{5}$/.test(cpNormalizado)) {
        throw new Error("El codigo postal debe tener 5 digitos.");
    }

    let cpObj = cps.find(c => normalizarCodigoPostalEdicion(c.codigo) === cpNormalizado);
    if (cpObj) {
        return cpObj;
    }

    const divObj = await obtenerOCrearDivisionTerritorialEdicion(divisiones, localidadTxt, zonaId);
    const nuevoCp = {
        id: generarIdEdicion(),
        id_cp: maxNumeroEdicion(cps, 'id_cp') + 1,
        codigo: cpNormalizado,
        id_division: divObj.id_division
    };

    cpObj = await crearRecursoEdicion('codigo_postal', nuevoCp);
    cps.push(cpObj);
    return cpObj;
}

function extraerCodigoPostal(textoLocalidad) {
    const match = String(textoLocalidad || '').match(/\((\d{5})\)/);
    return match ? match[1] : '';
}

function separarDireccionFicha(textoDireccion) {
    const direccion = limpiarValor(textoDireccion);
    if (!direccion) {
        return { tipo_via: '', nombre_via: '', numero: '' };
    }

    const partes = direccion.split(',');
    const primeraParte = partes[0].trim();
    const numero = partes.slice(1).join(',').trim();
    const matchTipoVia = primeraParte.match(/^(Calle|Avenida|Plaza)\s+(.+)$/i);

    return {
        tipo_via: matchTipoVia ? matchTipoVia[1] : '',
        nombre_via: matchTipoVia ? matchTipoVia[2] : primeraParte,
        numero
    };
}

async function cargarZonasEdicion(idZonaSeleccionada) {
    try {
        const res = await fetch(`${API_BASE}/zona_geografica`);
        if (!res.ok) throw new Error(`Error ${res.status} cargando zonas`);

        const zonas = await res.json();
        const select = document.getElementById('edit-zona');
        if (!select) return;

        select.innerHTML = '<option value="" disabled>Seleccione zona...</option>';
        zonas.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id_zona;
            opt.textContent = z.nombre_zona;
            if (z.id_zona == idZonaSeleccionada) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Error cargando zonas en edicion", e);
    }
}

document.addEventListener('click', async function(e) {
    const filaTabla = e.target.closest('#tabla-colaboradores tr');
    if (filaTabla) {
        const formEditar = document.getElementById('formulario-editar-colaborador');
        if (formEditar) formEditar.style.display = 'none';
    }
    // Botón de editar en la ficha
    const btnEditar = e.target.closest('#btn-editar-colaborador');
    if (btnEditar) {
        e.preventDefault();

        if (!colaboradorSeleccionadoId) {
            const fichaCodigoTxt = document.getElementById('ficha-codigo')?.textContent || '';
            if (fichaCodigoTxt && fichaCodigoTxt !== '---') {
                colaboradorSeleccionadoId = fichaCodigoTxt.replace('Código: ', '').replace('CÃ³digo: ', '').trim();
            }
        }

        if (!colaboradorSeleccionadoId) {
            alert("Error: No se ha podido identificar el colaborador seleccionado.");
            return;
        }

        const colab = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId);
        if (colab) await cargarZonasEdicion(colab.id_zona);

        const nombreFicha = document.getElementById('ficha-nombre')?.textContent || '';
        const personaFicha = document.getElementById('ficha-contacto-nombre')?.textContent || '';
        const emailFicha = document.getElementById('ficha-contacto-email')?.textContent || '';
        const telFicha = document.getElementById('ficha-contacto-tel')?.textContent || '';
        const direccionFicha = document.getElementById('ficha-direccion')?.textContent || '';
        const localidadFicha = document.getElementById('ficha-localidad')?.textContent || '';
        const direccionFallback = separarDireccionFicha(direccionFicha);

        document.getElementById('edit-nombre').value = limpiarValor(colab?.nombre_colaborador || nombreFicha);
        document.getElementById('edit-contacto-nombre').value = limpiarValor(colab?.contacto_principal || personaFicha);
        document.getElementById('edit-contacto-email').value = limpiarValor(colab?.contacto_correo || emailFicha);
        document.getElementById('edit-contacto-tel').value = limpiarValor(colab?.contacto_telefono || telFicha);
        document.getElementById('edit-tipo-via').value = limpiarValor(colab?.obj_direccion?.tipo_via || direccionFallback.tipo_via);
        document.getElementById('edit-direccion-via').value = limpiarValor(colab?.obj_direccion?.nombre_via || direccionFallback.nombre_via);
        document.getElementById('edit-direccion-num').value = limpiarValor(colab?.obj_direccion?.numero || direccionFallback.numero);
        document.getElementById('edit-cp').value = limpiarValor(colab?.obj_cp?.codigo || extraerCodigoPostal(localidadFicha));
        document.getElementById('edit-localidad').value = limpiarValor(colab?.localidad || localidadFicha.split('(')[0]);
        document.getElementById('edit-observaciones').value = limpiarValor(colab?.observaciones || '');

        document.getElementById('datos-colaborador').style.display = 'none';
        document.getElementById('formulario-anadir-colaborador')?.style.setProperty('display', 'none');
        document.getElementById('formulario-editar-colaborador').style.display = 'block';
    }
    // Botón cancelar en el formulario lateral
    const btnCancelar = e.target.closest('#btn-cancelar-edicion');
    if (btnCancelar) {
        e.preventDefault();
        document.getElementById('formulario-editar-colaborador').style.display = 'none';
        document.getElementById('datos-colaborador').style.display = 'block';
    }

    if (e.target && e.target.id === 'btn-aceptar-edicion') {
        e.preventDefault();

        const btnAceptar = e.target;
        const textoOriginalAceptar = btnAceptar.textContent;

        try {
            btnAceptar.textContent = "Guardando...";
            btnAceptar.disabled = true;
            await guardarEdicionColaborador();

            setPopupActivoEdicion('overlay-exito', 'popup-exito', false);
            await cargarDatosColaboradores();

            const colabActualizado = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId);
            document.getElementById('formulario-editar-colaborador').style.display = 'none';

            if (colabActualizado) {
                document.getElementById('datos-colaborador').style.display = 'block';
                mostrarDetalle(colabActualizado);
            } else {
                document.getElementById('datos-colaborador').style.display = 'none';
                document.getElementById('estado-vacio')?.style.setProperty('display', 'block');
            }
        } catch (error) {
            console.error("Error al intentar editar el colaborador:", error);
            setPopupActivoEdicion('overlay-exito', 'popup-exito', false);
            const textoError = document.getElementById('texto-error-popup');
            if (textoError) textoError.textContent = error.message || "No se pudieron guardar los cambios.";
            setPopupActivoEdicion('overlay-error', 'popup-error', true);
        } finally {
            btnAceptar.textContent = textoOriginalAceptar;
            btnAceptar.disabled = false;
        }
    }

    if (e.target && e.target.id === 'btn-aceptar-error') {
        e.preventDefault();
        setPopupActivoEdicion('overlay-error', 'popup-error', false);
    }
});
// Botón de guardar
document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'form-edicion-colaborador') {
        e.preventDefault();
        setPopupActivoEdicion('overlay-exito', 'popup-exito', true);
    }
});
// Se guarda los datos editados del colaborador
async function guardarEdicionColaborador() {
    const colabOriginal = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId);

    if (!colabOriginal?.id) {
        throw new Error("No se ha encontrado el ID interno del colaborador.");
    }

    const catalogos = await cargarCatalogosColaboradorEdicion();
    const zonaId = Number(getValEditar('edit-zona'));
    const cpObj = await obtenerOCrearCodigoPostalEdicion(
        catalogos.cps,
        catalogos.divisiones,
        getValEditar('edit-cp'),
        getValEditar('edit-localidad'),
        zonaId
    );

    const direccionId = await guardarDireccionColaborador(catalogos, colabOriginal, cpObj);
    await guardarContactoColaborador(catalogos, colabOriginal);

    const datosColaborador = {
        id: colabOriginal.id,
        id_colaborador: colabOriginal.id_colaborador,
        nombre_colaborador: getValEditar('edit-nombre'),
        observaciones: getValEditar('edit-observaciones') || null,
        id_direccion: direccionId
    };

    await actualizarRecursoEdicion('colaborador', colabOriginal.id, datosColaborador);
}

async function guardarDireccionColaborador(catalogos, colabOriginal, cpObj) {
    let direccionObj = catalogos.direcciones.find(d => d.id_direccion === colabOriginal.id_direccion);
    let idDireccion = colabOriginal.id_direccion;

    if (!direccionObj) {
        idDireccion = maxNumeroEdicion(catalogos.direcciones, 'id_direccion') + 1;
        direccionObj = {
            id: generarIdEdicion(),
            id_direccion: idDireccion
        };
    }

    const direccionActualizada = {
        id: direccionObj.id,
        id_direccion: idDireccion,
        tipo_via: getValEditar('edit-tipo-via') || null,
        nombre_via: getValEditar('edit-direccion-via'),
        numero: getValEditar('edit-direccion-num') || "s/n",
        id_cp: cpObj.id_cp
    };

    if (catalogos.direcciones.some(d => d.id === direccionObj.id)) {
        await actualizarRecursoEdicion('direccion', direccionObj.id, direccionActualizada);
    } else {
        await crearRecursoEdicion('direccion', direccionActualizada);
    }

    return idDireccion;
}
// Se guarda el contacto si se ha añadido o modificado
// Si se borra, se elimina de la base de datos
async function guardarContactoColaborador(catalogos, colabOriginal) {
    const nombreContacto = getValEditar('edit-contacto-nombre');
    const emailContacto = getValEditar('edit-contacto-email');
    const telContacto = getValEditar('edit-contacto-tel');
    const hayContacto = hayDatosContactoEdicion(nombreContacto, emailContacto, telContacto);

    const rels = await fetchJsonEdicion(`${API_BASE}/contacto_colaborador?id_colaborador=${colabOriginal.id_colaborador}`);
    const relacionPrincipal = rels.find(r => r.es_principal === true || r.es_principal === "true");

    if (relacionPrincipal && !hayContacto) {
        const personasEncontradas = await fetchJsonEdicion(`${API_BASE}/persona?id_persona=${relacionPrincipal.id_contacto}`);
        await borrarRecursoEdicion('contacto_colaborador', relacionPrincipal.id);
        if (personasEncontradas.length > 0) {
            await borrarRecursoEdicion('persona', personasEncontradas[0].id);
        }
        return;
    }

    if (!hayContacto) {
        return;
    }

    if (relacionPrincipal) {
        const personasEncontradas = await fetchJsonEdicion(`${API_BASE}/persona?id_persona=${relacionPrincipal.id_contacto}`);
        if (personasEncontradas.length > 0) {
            const personaObj = personasEncontradas[0];
            const personaActualizada = {
                id: personaObj.id,
                id_persona: personaObj.id_persona,
                nombre_completo: nombreContacto,
                telefono: telContacto || null,
                email: emailContacto || null,
                observacion: personaObj.observacion !== undefined ? personaObj.observacion : null
            };

            await actualizarRecursoEdicion('persona', personaObj.id, personaActualizada);
            return;
        }

        const nuevaPersona = crearPersonaContacto(catalogos, nombreContacto, emailContacto, telContacto);
        await crearRecursoEdicion('persona', nuevaPersona);
        await actualizarRecursoEdicion('contacto_colaborador', relacionPrincipal.id, {
            ...relacionPrincipal,
            id_contacto: nuevaPersona.id_persona,
            es_principal: true
        });
        return;
    }

    const nuevaPersona = crearPersonaContacto(catalogos, nombreContacto, emailContacto, telContacto);
    await crearRecursoEdicion('persona', nuevaPersona);
    await crearRecursoEdicion('contacto_colaborador', {
        id: generarIdEdicion(),
        id_colaborador: colabOriginal.id_colaborador,
        id_contacto: nuevaPersona.id_persona,
        es_principal: true
    });
}

function crearPersonaContacto(catalogos, nombreContacto, emailContacto, telContacto) {
    const idPersona = maxNumeroEdicion(catalogos.personas, 'id_persona') + 1;
    const nuevaPersona = {
        id: generarIdEdicion(),
        id_persona: idPersona,
        nombre_completo: nombreContacto,
        telefono: telContacto || null,
        email: emailContacto || null,
        observacion: null
    };

    catalogos.personas.push(nuevaPersona);
    return nuevaPersona;
}
