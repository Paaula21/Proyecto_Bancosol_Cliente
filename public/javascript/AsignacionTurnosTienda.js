const API_BASE = 'http://localhost:3000';
let tiendasDeEstaCampana = [];
let cadenasGlobal = [];
let idCampanaActual = '';

document.addEventListener("DOMContentLoaded", () => {
    const panelTiendas = document.getElementById('panel-tiendas');
    if (panelTiendas) panelTiendas.style.display = 'block';

    const urlParams = new URLSearchParams(window.location.search);
    idCampanaActual = urlParams.get('id_campana');

    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
    if (!tbodyTiendas) return;

    if (!idCampanaActual) {
        tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold;">Error: No se recibió ninguna campaña activa.</td></tr>';
        return;
    }

    const titulo = document.getElementById('titulo-campana-tiendas');
    if (titulo) titulo.textContent = `Tiendas de la Campaña: ${idCampanaActual}`;

    // Estricto: El filtrado NO es automático al escribir. Solo se ejecuta al hacer click en el botón morado.
    document.getElementById('btn-filter')?.addEventListener('click', aplicarFiltros);

    cargarTiendasDeCampana(idCampanaActual);
});

async function cargarTiendasDeCampana(idCampana) {
    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');

    try {
        const resCampanaCadena = await fetch(`${API_BASE}/campana_cadena?id_campana=${idCampana}`);
        const campanaCadenas = await resCampanaCadena.json();
        const idsCadenasDeCampana = campanaCadenas.map(cc => cc.id_cadena);

        if (idsCadenasDeCampana.length === 0) {
            tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #d97706; font-weight: bold;">Esta campaña no cuenta con cadenas vinculadas.</td></tr>`;
            return;
        }

        cadenasGlobal = await (await fetch(`${API_BASE}/cadena`)).json();
        const todasLasTiendas = await (await fetch(`${API_BASE}/establecimiento`)).json();

        // Guardamos la lista completa de tiendas para esta campaña
        tiendasDeEstaCampana = todasLasTiendas.filter(tienda => idsCadenasDeCampana.includes(tienda.id_cadena));

        poblarDesplegableCadenas(idsCadenasDeCampana);

        // PREDETERMINADO: Renderizamos todas las tiendas de inicio sin filtros
        renderizarTablaTiendas(tiendasDeEstaCampana);

    } catch (error) {
        console.error("Error cargando los datos iniciales:", error);
        tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error al conectar con la base de datos.</td></tr>`;
    }
}

function poblarDesplegableCadenas(idsCadenas) {
    const selectCadena = document.getElementById('filter-cadena');
    if (!selectCadena) return;
    selectCadena.innerHTML = '<option value="">Todas las cadenas</option>';

    cadenasGlobal.forEach(cadena => {
        if (idsCadenas.includes(cadena.id_cadena)) {
            const option = document.createElement('option');
            option.value = cadena.id_cadena;
            option.textContent = cadena.nombre_cadena;
            selectCadena.appendChild(option);
        }
    });
}

function aplicarFiltros() {
    const cadenaSeleccionada = document.getElementById('filter-cadena')?.value || '';
    const idBuscado = document.getElementById('filter-id-tienda')?.value.trim() || '';

    // Se calcula el filtro basándose en la selección actual al pulsar el botón
    const filtradas = tiendasDeEstaCampana.filter(tienda => {
        const cumpleCadena = cadenaSeleccionada === '' || tienda.id_cadena === cadenaSeleccionada;
        const cumpleId = idBuscado === '' || String(tienda.id_establecimiento).includes(idBuscado);
        return cumpleCadena && cumpleId;
    });

    renderizarTablaTiendas(filtradas);
}

function renderizarTablaTiendas(lista) {
    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
    if (!tbodyTiendas) return;
    tbodyTiendas.innerHTML = '';

    if (lista.length === 0) {
        tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">Ninguna tienda coincide con los criterios de búsqueda establecidos.</td></tr>';
        return;
    }

    lista.forEach(tienda => {
        const cadenaObj = cadenasGlobal.find(c => c.id_cadena === tienda.id_cadena);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${tienda.nombre_resena || 'Establecimiento'}</strong></td>
            <td>${cadenaObj ? cadenaObj.nombre_cadena : tienda.id_cadena}</td>
            <td>${tienda.id_establecimiento}</td>
            <td><button class="btn btn--primary" onclick="abrirTurnosTienda(${tienda.id_establecimiento}, '${idCampanaActual}')">Asignar turnos</button></td>
        `;
        tbodyTiendas.appendChild(tr);
    });
}

window.abrirTurnosTienda = function(idTienda, idCampana) {
    window.parent.location.href = `/gestion-final-turnos?id_campana=${encodeURIComponent(idCampana)}&id_tienda=${encodeURIComponent(idTienda)}`;
};