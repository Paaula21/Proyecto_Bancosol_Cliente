// ----- CONFIGURACIÓN INICIAL -----
const API_ENDPOINT = 'http://localhost:3000';

// Variable global donde guardamos todas las campañas cargadas.
// La declaramos fuera de las funciones para que todas puedan acceder a ella
let todasLasCampanas = [];
let campanaSeleccionadaId = null;

// ----- EVENTO PRINCIPAL -----
// Esperamos a que el DOM esté cargado antes de hacer nada
document.addEventListener('DOMContentLoaded', async function () {

    // Escuchar eventos del popup
    document.addEventListener('click', async function (e) {
        if (e.target && e.target.id === 'btn-cancel-delete') {
            e.preventDefault();
            document.querySelector('#overlay-delete').classList.remove('active');
            document.querySelector('#popup-delete').classList.remove('active');
        }

        if (e.target && e.target.id === 'btn-delete-campaign') {
            e.preventDefault();
            if (!campanaSeleccionadaId) {
                alert("Error: No se ha seleccionado ninguna campaña.");
                return;
            }
            document.querySelector('#overlay-delete').classList.add('active');
            document.querySelector('#popup-delete').classList.add('active');
        }

        if (e.target && e.target.id === 'btn-confirm-delete') {
            e.preventDefault();

            if (!campanaSeleccionadaId) {
                alert("Error: No se ha seleccionado ninguna campaña.");
                return;
            }

            const btnConfirmar = e.target;
            const textoOriginal = btnConfirmar.textContent;

            try {
                btnConfirmar.textContent = "Eliminando...";
                btnConfirmar.disabled = true;

                // Buscamos la campaña para obtener su id interno
                let response = await fetch(`${API_ENDPOINT}/campana?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`);
                let busqueda = await response.json();

                if (busqueda.length === 0) {
                    alert('No se encontró la campaña a borrar.');
                    return;
                }

                let idInterno = busqueda[0].id;

                // Borramos la campaña usando su id interno
                let deleteResponse = await fetch(`${API_ENDPOINT}/campana/${idInterno}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!deleteResponse.ok) {
                    throw new Error(`Error en el servidor: ${deleteResponse.status}`);
                }

                // Borramos también las relaciones en campana_cadena
                let relResponse = await fetch(`${API_ENDPOINT}/campana_cadena?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`);
                let relacionesActuales = await relResponse.json();

                for (let relacion of relacionesActuales) {
                    await fetch(`${API_ENDPOINT}/campana_cadena/${relacion.id}`, {
                        method: 'DELETE'
                    });
                }

                document.querySelector('#overlay-delete').classList.remove('active');
                document.querySelector('#popup-delete').classList.remove('active');

                campanaSeleccionadaId = null;

                // Ocultar detalles panel al borrar
                document.querySelector('#campaign-data').style.display = 'none';
                document.querySelector('#empty-state-campaign').style.display = 'block';
                mostrarAccionesCampana(null);

                await cargarCampanas();

                alert("Campaña eliminada con éxito");

            } catch (error) {
                console.error("Error al intentar eliminar la campaña:", error);
                alert("No se pudo eliminar la campaña. Inténtalo de nuevo.");
            } finally {
                btnConfirmar.textContent = textoOriginal;
                btnConfirmar.disabled = false;
            }
        }
    });

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
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function (e) {
            // Ignoramos clics en enlaces o botones dentro de la fila (como Añadir voluntario)
            if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button') {
                return;
            }
            
            // Quitar clase selected de todas las filas
            let todasFilas = tbody.querySelectorAll('tr');
            todasFilas.forEach(f => f.classList.remove('selected'));
            tr.classList.add('selected');
            
            mostrarDetalleCampana(campana);
        });

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
        // Dentro del bucle o función donde generas las filas de las campañas:
        let td5 = document.createElement('td');
        let btnAñadirTurnos = document.createElement('button');
        btnAñadirTurnos.className = 'btn-edit';
        btnAñadirTurnos.textContent = 'Añadir turnos';

        btnAñadirTurnos.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Redirige a la página de tiendas pasando el ID de la campaña por URL
            window.location.href = `/html/AsignaciónTurnosTienda.html?id_campana=${encodeURIComponent(campana.id_campana)}`;
        });

        td5.appendChild(btnAñadirTurnos);
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

// =============================================================
// PANEL DE DETALLES
// =============================================================

function mostrarAccionesCampana(modo) {
    const accionesDetalle = document.querySelector('#detail-actions-campaign');
    const accionesEdicion = document.querySelector('#edit-actions-campaign');

    if (accionesDetalle) accionesDetalle.style.display = modo === 'detalle' ? 'flex' : 'none';
    if (accionesEdicion) accionesEdicion.style.display = modo === 'edicion' ? 'flex' : 'none';
}

async function mostrarDetalleCampana(campana) {
    campanaSeleccionadaId = campana.id_campana;

    document.querySelector('#empty-state-campaign').style.display = 'none';
    const formEditar = document.querySelector('#edit-campaign-container');
    if (formEditar) formEditar.style.display = 'none';
    document.querySelector('#campaign-data').style.display = 'block';
    mostrarAccionesCampana('detalle');

    document.querySelector('#campaign-name').textContent = campana.nombre_campana || 'Sin nombre';
    document.querySelector('#campaign-code').textContent = `ID: ${campana.id_campana}`;
    document.querySelector('#campaign-start').textContent = formatearFecha(campana.fecha_inicio);
    document.querySelector('#campaign-end').textContent = formatearFecha(campana.fecha_fin);
    
    let estadoClase = campana.estado ? campana.estado.toLowerCase().replace(' ', '-') : 'planificada';
    let estadoSpan = document.querySelector('#campaign-status');
    estadoSpan.className = 'estado-badge estado-' + estadoClase;
    estadoSpan.textContent = campana.estado || 'Planificada';

    // Cargar cadenas participantes
    try {
        let [cadenasDb, relaciones] = await Promise.all([
            fetch(`${API_ENDPOINT}/cadena`).then(r => r.json()),
            fetch(`${API_ENDPOINT}/campana_cadena?id_campana=${encodeURIComponent(campana.id_campana)}`).then(r => r.json())
        ]);

        let ulCadenas = document.querySelector('#campaign-chains');
        ulCadenas.innerHTML = '';
        
        if (relaciones.length === 0) {
            let li = document.createElement('li');
            li.textContent = "No hay cadenas participantes";
            ulCadenas.appendChild(li);
        } else {
            relaciones.forEach(rel => {
                let cadenaDb = cadenasDb.find(c => c.id_cadena === rel.id_cadena);
                let li = document.createElement('li');
                li.textContent = cadenaDb ? cadenaDb.nombre_cadena : rel.id_cadena;
                ulCadenas.appendChild(li);
            });
        }
    } catch (e) {
        console.error("Error cargando cadenas participantes", e);
    }
}

window.abrirHistorial = function() {
    window.parent.location.href = `/historial`;
};