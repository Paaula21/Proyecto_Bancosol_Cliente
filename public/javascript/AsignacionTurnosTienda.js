// ----- CONFIGURACIÓN INICIAL ----- //
const API_BASE = 'http://localhost:3000';

// Almacenes en memoria para filtrar en tiempo real sin saturar a peticiones al servidor
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
        tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold;">Error: No se recibió ninguna campaña (?id_campana=...) en la URL.</td></tr>';
        return;
    }

    const titulo = document.getElementById('titulo-campana-tiendas');
    if (titulo) titulo.textContent = `Tiendas de la Campaña: ${idCampanaActual}`;

    // --- ESCUCHADORES DE EVENTOS PARA LOS FILTROS ---
    const selectCadena = document.getElementById('filter-cadena');
    const inputIdTienda = document.getElementById('filter-id-tienda');

    if (selectCadena) selectCadena.addEventListener('change', aplicarFiltros);
    if (inputIdTienda) inputIdTienda.addEventListener('input', aplicarFiltros);

    // Cargar los datos iniciales de la API
    cargarTiendasDeCampana(idCampanaActual);
});

async function cargarTiendasDeCampana(idCampana) {
    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
    tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #2563eb;">Conectando con el servidor base...</td></tr>';

    try {
        // 1. Obtener relaciones campana_cadena
        const resCampanaCadena = await fetch(`${API_BASE}/campana_cadena?id_campana=${idCampana}`);
        const campanaCadenas = await resCampanaCadena.json();
        const idsCadenasDeCampana = campanaCadenas.map(cc => cc.id_cadena);

        if (idsCadenasDeCampana.length === 0) {
            tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; font-weight: bold; color: #d97706;">La campaña ${idCampana} no tiene ninguna cadena vinculada.</td></tr>`;
            return;
        }

        // 2. Obtener maestras de cadenas y establecimientos
        const resCadenas = await fetch(`${API_BASE}/cadena`);
        cadenasGlobal = await resCadenas.json();

        const resTiendas = await fetch(`${API_BASE}/establecimiento`);
        const todasLasTiendas = await resTiendas.json();

        // 3. Filtrar y guardar en memoria global las tiendas autorizadas
        tiendasDeEstaCampana = todasLasTiendas.filter(tienda =>
            idsCadenasDeCampana.includes(tienda.id_cadena)
        );

        // 4. Llenar dinámicamente el desplegable de Cadenas (solo con las que participan en esta campaña)
        poblarDesplegableCadenas(idsCadenasDeCampana);

        // 5. Renderizar las tiendas por primera vez
        renderizarTablaTiendas(tiendasDeEstaCampana);

    } catch (error) {
        console.error("Error al cargar datos:", error);
        tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold;">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

// Llenar el <select> con las cadenas asociadas
function poblarDesplegableCadenas(idsCadenasDeCampana) {
    const selectCadena = document.getElementById('filter-cadena');
    if (!selectCadena) return;

    // Limpiar opciones previas manteniendo la primera ("Todas")
    selectCadena.innerHTML = '<option value="">Todas las cadenas</option>';

    cadenasGlobal.forEach(cadena => {
        if (idsCadenasDeCampana.includes(cadena.id_cadena)) {
            const option = document.createElement('option');
            option.value = cadena.id_cadena;
            option.textContent = cadena.nombre_cadena;
            selectCadena.appendChild(option);
        }
    });
}

// Función encargada de aplicar de manera combinada ambos filtros
function aplicarFiltros() {
    const selectCadena = document.getElementById('filter-cadena');
    const inputIdTienda = document.getElementById('filter-id-tienda');

    const cadenaSeleccionada = selectCadena ? selectCadena.value : '';
    const idBuscado = inputIdTienda ? inputIdTienda.value.trim() : '';

    // Filtrado combinado sobre el array en memoria
    const tiendasFiltradas = tiendasDeEstaCampana.filter(tienda => {
        // Validación filtro de Cadena
        const cumpleCadena = cadenaSeleccionada === '' || tienda.id_cadena === cadenaSeleccionada;

        // Validación filtro de Escritura ID (coincidencia parcial)
        const cumpleId = idBuscado === '' || String(tienda.id_establecimiento).includes(idBuscado);

        return cumpleCadena && cumpleId;
    });

    renderizarTablaTiendas(tiendasFiltradas);
}

// Pintar filas en el HTML basado en un array recibido
function renderizarTablaTiendas(listaTiendas) {
    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
    if (!tbodyTiendas) return;

    tbodyTiendas.innerHTML = '';

    if (listaTiendas.length === 0) {
        tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No se encontraron tiendas con los filtros aplicados.</td></tr>';
        return;
    }

    listaTiendas.forEach(tienda => {
        const cadenaObj = cadenasGlobal.find(c => c.id_cadena === tienda.id_cadena);
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${tienda.nombre_resena || 'Sin nombre'}</strong></td>
            <td>${cadenaObj ? cadenaObj.nombre_cadena : tienda.id_cadena}</td>
            <td>${tienda.id_establecimiento}</td>
            <td><button class="btn btn--primary btn-seleccionar-tienda" data-id="${tienda.id_establecimiento}" onclick="abrirTurnosTienda(${tienda.id_establecimiento}, '${tienda.nombre_resena}', '${idCampanaActual}')">Asignar turnos</button></td>
        `;
        tbodyTiendas.appendChild(tr);
    });
}

// Función del botón Asignar Turnos
window.abrirTurnosTienda = function(idTienda, nombreTienda, idCampana) {
    console.log(`Abriendo asignación para Tienda: ${idTienda}, Campaña: ${idCampana}`);
    // Descomenta y ajusta si quieres redirigir a tu siguiente pantalla:
    // window.location.href = `AsignarTurnos.html?id_campana=${encodeURIComponent(idCampana)}&id_tienda=${encodeURIComponent(idTienda)}`;
};