// ----- CONFIGURACIÓN INICIAL -----
const API_ENDPOINT = 'http://localhost:3000';

// Variable global donde guardamos todas las campañas cargadas.
// La declaramos fuera de las funciones para que todas puedan acceder a ella
let todasLasCampanas = [];

// ----- EVENTO PRINCIPAL -----
// Esperamos a que el DOM esté cargado antes de hacer nada
document.addEventListener('DOMContentLoaded', async function () {

    // Cargamos las campañas del servidor al arrancar la página
    await cargarCampanas();

    // Escuchamos el botón de filtrar: cuando se pulse, volvemos a renderizar
    // la tabla aplicando los filtros actuales
    document.querySelector('#btn-filter').addEventListener('click', function () {
        renderizarTabla();
    });

    // También filtramos si el usuario pulsa Enter en el buscador de texto
    document.querySelector('#filter-search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            renderizarTabla();
        }
    });
});

// ----- CARGA DE CAMPAÑAS DESDE EL SERVIDOR -----
// Hace la petición fetch al endpoint /campana y almacena el resultado
// en la variable global. Si falla, muestra un mensaje de error en la tabla
async function cargarCampanas() {
    try {
        let response = await fetch(`${API_ENDPOINT}/campana`);

        // Si el servidor responde con un error HTTP, lanzamos una excepción
        if (!response.ok) {
            throw new Error('Error de conexión con el servidor');
        }

        // Guardamos los datos en la variable global y renderizamos la tabla
        todasLasCampanas = await response.json();
        renderizarTabla();

    } catch (error) {
        console.error('Error al cargar las campañas:', error);
        mostrarErrorEnTabla('Error al cargar las campañas. Compruebe si json-server está en ejecución.');
    }
}

// ----- RENDERIZADO DE LA TABLA -----
// Lee los filtros actuales, filtra las campañas y reconstruye las filas.
// Se llama al cargar la página y cada vez que el usuario cambia los filtros
function renderizarTabla() {
    let tbody = document.querySelector('#table-campanas');

    // Leemos los valores de los controles de filtrado
    let estadoFiltro = document.querySelector('#filter-state').value.toLowerCase();
    let buscarFiltro = document.querySelector('#filter-search').value.toLowerCase().trim();

    // Vaciamos la tabla antes de volver a insertarlas
    // (usamos removeChild en lugar de innerHTML = '' como recomienda el tema de DOM)
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    // ----- FILTRADO -----
    // Aplicamos los dos filtros: por estado y por texto de búsqueda
    let campanasFiltradas = todasLasCampanas.filter(function (campana) {

        // El filtro de estado 'todos' desactiva ese filtro
        let cumpleEstado = estadoFiltro === 'todos' ||
            (campana.estado && campana.estado.toLowerCase() === estadoFiltro);

        // El filtro de texto busca en el nombre y en el id de la campaña
        let cumpleBusqueda = !buscarFiltro ||
            (campana.nombre_campana && campana.nombre_campana.toLowerCase().includes(buscarFiltro)) ||
            (campana.id_campana && campana.id_campana.toLowerCase().includes(buscarFiltro));

        return cumpleEstado && cumpleBusqueda;
    });

    // Actualizamos el contador de resultados
    document.querySelector('#total-campanas').textContent =
        campanasFiltradas.length + ' campañas encontradas';

    // Si no hay resultados tras filtrar, mostramos un mensaje
    if (campanasFiltradas.length === 0) {
        mostrarMensajeVacioEnTabla('No se encontraron campañas con los filtros actuales.');
        return;
    }

    // ----- RENDERIZADO DE FILAS -----
    // Construimos cada fila con createElement/appendChild
    // para manipular el DOM de forma explícita (tema 4)
    campanasFiltradas.forEach(function (campana) {
        let tr = document.createElement('tr');

        // Clase CSS del badge de estado: convertimos a minúsculas y reemplazamos espacios
        let estadoClase = campana.estado
            ? campana.estado.toLowerCase().replace(' ', '-')
            : 'planificada';

        // --- Columna 1: Nombre e ID ---
        let td1 = document.createElement('td');

        let strong = document.createElement('strong');
        strong.textContent = campana.nombre_campana || 'Sin nombre';

        // Salto de línea entre el nombre y el ID
        let br = document.createElement('br');

        let small = document.createElement('small');
        small.textContent = campana.id_campana || 'N/A';

        td1.appendChild(strong);
        td1.appendChild(br);
        td1.appendChild(small);
        tr.appendChild(td1);

        // --- Columna 2: Fecha de inicio ---
        let td2 = document.createElement('td');
        td2.textContent = formatearFecha(campana.fecha_inicio);
        tr.appendChild(td2);

        // --- Columna 3: Fecha de fin ---
        let td3 = document.createElement('td');
        td3.textContent = formatearFecha(campana.fecha_fin);
        tr.appendChild(td3);

        // --- Columna 4: Estado (con badge de color) ---
        let td4 = document.createElement('td');

        let spanEstado = document.createElement('span');
        spanEstado.className = 'estado-badge estado-' + estadoClase;
        spanEstado.textContent = campana.estado || 'Planificada';

        td4.appendChild(spanEstado);
        tr.appendChild(td4);

        // --- Columna 5: Acciones ---
        let td5 = document.createElement('td');

        // Enlace para editar la campaña: pasamos el ID por la URL
        let enlaceEditar = document.createElement('a');
        enlaceEditar.href = 'EditarCampana.html?id_campana=' + encodeURIComponent(campana.id_campana);
        enlaceEditar.className = 'btn-edit';
        enlaceEditar.textContent = 'Editar';

        // Enlace para añadir voluntarios a la campaña
        let enlaceVoluntarios = document.createElement('a');
        enlaceVoluntarios.href = 'RegistroVoluntarios.html';
        enlaceVoluntarios.className = 'btn-edit';
        enlaceVoluntarios.textContent = 'Añadir voluntario';

        td5.appendChild(enlaceEditar);
        td5.appendChild(document.createTextNode(' '));   // Separador entre botones
        td5.appendChild(enlaceVoluntarios);
        tr.appendChild(td5);

        tbody.appendChild(tr);
    });
}

// ----- HELPERS DE MENSAJES EN LA TABLA -----

// Muestra una fila de error en la tabla
function mostrarErrorEnTabla(mensaje) {
    let tbody = document.querySelector('#table-campanas');
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'mensaje-error';
    td.textContent = mensaje;
    tr.appendChild(td);
    tbody.appendChild(tr);

    document.querySelector('#total-campanas').textContent = 'Error de conexión';
}

// Muestra una fila de "sin resultados" en la tabla
function mostrarMensajeVacioEnTabla(mensaje) {
    let tbody = document.querySelector('#table-campanas');

    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'mensaje-vacio';
    td.textContent = mensaje;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

// =============================================================
// UTILIDADES
// =============================================================

// Convierte una fecha "YYYY-MM-DD" o ISO a formato "dd/mm/yyyy"
function formatearFecha(fechaString) {
    if (!fechaString) return '-';
    try {
        let fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return fechaString;

        let dia = fecha.getDate().toString().padStart(2, '0');
        let mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        let anio = fecha.getFullYear();

        return dia + '/' + mes + '/' + anio;
    } catch (e) {
        return fechaString;
    }
}