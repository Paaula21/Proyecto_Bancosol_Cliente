// Se cargan las zonas del select nada más seleccionar
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(cargarZonas, 0);
});

const HEADERS_JSON = { 'Content-Type': 'application/json' };

// Se obtiene el valor del id
function getValNuevo(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.error(`ERROR: No se encontro el elemento con ID: ${id}`);
        return "";
    }
    return el.value.trim();
}

// Se genera un ID aleatorio para asociarlo al nuevo colaborador
function generarId() {
    return Math.random().toString(36).substring(2, 12);
}

// Se normalizan los valores
function normalizarTexto(valor) {
    return (valor ?? '').toString().trim();
}

function normalizarTextoComparacion(valor) {
    return normalizarTexto(valor)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function normalizarCodigoPostal(valor) {
    return normalizarTexto(valor);
}

function maxNumero(lista, campo) {
    return Math.max(0, ...lista.map(item => Number(item?.[campo]) || 0));
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Error ${response.status} en ${url}`);
    }
    const texto = await response.text();
    return texto ? JSON.parse(texto) : null;
}

function crearRecurso(recurso, objeto) {
    return fetchJson(`${API_BASE}/${recurso}`, {
        method: 'POST',
        headers: HEADERS_JSON,
        body: JSON.stringify(objeto)
    });
}

function actualizarRecurso(recurso, id, objeto) {
    return fetchJson(`${API_BASE}/${recurso}/${id}`, {
        method: 'PUT',
        headers: HEADERS_JSON,
        body: JSON.stringify(objeto)
    });
}

function borrarRecurso(recurso, id) {
    return fetchJson(`${API_BASE}/${recurso}/${id}`, { method: 'DELETE' });
}

async function cargarCatalogosColaborador() {
    const [cps, divisiones, personas, direcciones, colaboradores] = await Promise.all([
        fetchJson(`${API_BASE}/codigo_postal`),
        fetchJson(`${API_BASE}/division_territorial`),
        fetchJson(`${API_BASE}/persona`),
        fetchJson(`${API_BASE}/direccion`),
        fetchJson(`${API_BASE}/colaborador`)
    ]);

    return { cps, divisiones, personas, direcciones, colaboradores };
}

// Se obtiene la división territorial si existe ya en la bd para no realizar duplicados
async function obtenerOCrearDivisionTerritorial(divisiones, localidadTxt, zonaId) {
    const localidad = normalizarTexto(localidadTxt);
    const zonaNumerica = Number(zonaId);

    if (!localidad) {
        throw new Error("La localidad es obligatoria.");
    }

    if (!zonaNumerica) {
        throw new Error("La zona geografica es obligatoria.");
    }

    let divObj = divisiones.find(d =>
        normalizarTextoComparacion(d.nombre_division) === normalizarTextoComparacion(localidad) &&
        Number(d.id_zona) === zonaNumerica
    );

    if (divObj) {
        return divObj;
    }

    const nuevaDivision = {
        id: generarId(),
        id_division: maxNumero(divisiones, 'id_division') + 1,
        nombre_division: localidad,
        id_zona: zonaNumerica,
        tipo: true
    };

    divObj = await crearRecurso('division_territorial', nuevaDivision);
    divisiones.push(divObj);
    return divObj;
}

// Se obtiene el CP si existe ya en la bd para no realizar duplicados
async function obtenerOCrearCodigoPostal(cps, divisiones, cpTxt, localidadTxt, zonaId) {
    const cpNormalizado = normalizarCodigoPostal(cpTxt);

    let cpObj = cps.find(c => normalizarCodigoPostal(c.codigo) === cpNormalizado);
    if (cpObj) {
        return cpObj;
    }

    const divObj = await obtenerOCrearDivisionTerritorial(divisiones, localidadTxt, zonaId);
    const nuevoCp = {
        id: generarId(),
        id_cp: maxNumero(cps, 'id_cp') + 1,
        codigo: cpNormalizado,
        id_division: divObj.id_division
    };

    cpObj = await crearRecurso('codigo_postal', nuevoCp);
    cps.push(cpObj);
    return cpObj;
}

function generarCodigoColaborador(colaboradores) {
    const maxCodigoA = colaboradores.reduce((maximo, colaborador) => {
        const match = String(colaborador.id_colaborador || '').match(/^A(\d+)$/i);
        return match ? Math.max(maximo, Number(match[1]) || 0) : maximo;
    }, 0);

    return `A${String(maxCodigoA + 1).padStart(4, '0')}`;
}

// Se realiza la comprobación para que si se borra, no salga vacío y salga Sin asignar
function hayDatosContacto(nombre, email, telefono) {
    return Boolean(nombre || email || telefono);
}

function setPopupActivo(overlayId, popupId, activo) {
    document.getElementById(overlayId)?.classList.toggle('active', activo);
    document.getElementById(popupId)?.classList.toggle('active', activo);
}

function resetFormularioNuevoColaborador() {
    const form = document.getElementById('form-nuevo-colaborador-lateral');
    if (form) form.reset();
}

// Se cargan las zonas del select
async function cargarZonas() {
    try {
        const select = document.getElementById('nuevo-zona');
        if (!select) return;

        const zonas = await fetchJson(`${API_BASE}/zona_geografica`);
        select.innerHTML = '<option value="" disabled selected>Seleccione zona...</option>';

        zonas.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id_zona;
            opt.textContent = z.nombre_zona;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Error cargando zonas", e);
    }
}

document.addEventListener('click', async function(e) {
    // Botón añadir colaborador
    const btnAbrirRegistro = e.target.closest('#btn-abrir-registro');
    if (btnAbrirRegistro) {
        await cargarZonas();
    }

    const filaTabla = e.target.closest('#tabla-colaboradores tr');
    if (filaTabla) {
        const formAnadir = document.getElementById('formulario-anadir-colaborador');
        if (formAnadir) formAnadir.style.display = 'none';
    }
    // Botón cancelar en el formulario lateral
    const btnCancelar = e.target.closest('#btn-cancelar-nuevo');
    if (btnCancelar) {
        e.preventDefault();
        document.getElementById('formulario-anadir-colaborador').style.display = 'none';
        document.getElementById('estado-vacio')?.style.setProperty('display', 'block');
        mostrarAccionesColaborador(null);
        resetFormularioNuevoColaborador();
    }

    // Botón de aceptar en el popup 
    // Se realiza aquí el proceso de guardado para que no se recarge antes del pop up
    if (e.target && e.target.id === 'btn-aceptar-exito-nuevo') {
        e.preventDefault();

        const btnConfirmar = e.target;
        const textoOriginal = btnConfirmar.textContent;

        btnConfirmar.textContent = "Guardando...";
        btnConfirmar.disabled = true;

        try {
            await guardarColaborador();

            setPopupActivo('overlay-exito-nuevo', 'popup-exito-nuevo', false);
            await cargarDatosColaboradores();

            document.getElementById('formulario-anadir-colaborador').style.display = 'none';
            document.getElementById('datos-colaborador')?.style.setProperty('display', 'none');
            document.getElementById('estado-vacio')?.style.setProperty('display', 'block');
            mostrarAccionesColaborador(null);
            resetFormularioNuevoColaborador();
        } catch (error) {
            console.error("Error en el proceso de guardado:", error);
            const textoError = document.getElementById('texto-error-popup-nuevo');
            if (textoError) textoError.textContent = error.message || "No se pudo crear el colaborador.";
            setPopupActivo('overlay-error-nuevo', 'popup-error-nuevo', true);
        } finally {
            btnConfirmar.textContent = textoOriginal;
            btnConfirmar.disabled = false;
        }
    }

    if (e.target && e.target.id === 'btn-aceptar-error-nuevo') {
        e.preventDefault();
        setPopupActivo('overlay-error-nuevo', 'popup-error-nuevo', false);
    }
});

// Botón de guardar
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'form-nuevo-colaborador-lateral') {
        e.preventDefault();
        setPopupActivo('overlay-exito-nuevo', 'popup-exito-nuevo', true);
    }
});

// Función para guardar el nuevo colaborador
async function guardarColaborador() {
    const catalogos = await cargarCatalogosColaborador();
    const zonaId = Number(getValNuevo('nuevo-zona'));
    const localidadTxt = getValNuevo('nuevo-localidad');
    const cpTxt = getValNuevo('nuevo-cp');
    const cpObj = await obtenerOCrearCodigoPostal(catalogos.cps, catalogos.divisiones, cpTxt, localidadTxt, zonaId);

    const idDireccion = maxNumero(catalogos.direcciones, 'id_direccion') + 1;
    const idPersona = maxNumero(catalogos.personas, 'id_persona') + 1;
    const idColaborador = generarCodigoColaborador(catalogos.colaboradores);

    const nombreContacto = getValNuevo('nuevo-contacto-nombre');
    const emailContacto = getValNuevo('nuevo-contacto-email');
    const telContacto = getValNuevo('nuevo-contacto-tel');

    const direccionObj = {
        id: generarId(),
        id_direccion: idDireccion,
        tipo_via: getValNuevo('nuevo-tipo-via') || null,
        nombre_via: getValNuevo('nuevo-direccion-via'),
        numero: getValNuevo('nuevo-direccion-num') || "s/n",
        id_cp: cpObj.id_cp
    };

    const colaboradorObj = {
        id: generarId(),
        id_colaborador: idColaborador,
        nombre_colaborador: getValNuevo('nuevo-nombre'),
        id_direccion: idDireccion,
        observaciones: getValNuevo('nuevo-observaciones') || null
    };

    await crearRecurso('direccion', direccionObj);
    await crearRecurso('colaborador', colaboradorObj);

    if (hayDatosContacto(nombreContacto, emailContacto, telContacto)) {
        const personaObj = {
            id: generarId(),
            id_persona: idPersona,
            nombre_completo: nombreContacto,
            email: emailContacto || null,
            telefono: telContacto || null,
            observacion: null
        };

        const relacionObj = {
            id: generarId(),
            id_colaborador: idColaborador,
            id_contacto: idPersona,
            es_principal: true
        };

        await crearRecurso('persona', personaObj);
        await crearRecurso('contacto_colaborador', relacionObj);
    }
}
