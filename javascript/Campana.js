const API_ENDPOINT = 'http://localhost:3000';
let todasLasCampanas = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCampanas();

    // Configurar el botón de filtrado
    document.querySelector('#btn-filter').addEventListener('click', renderizarTabla);

    // Permitir filtrar al presionar Enter en el buscador
    document.querySelector('#filter-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            renderizarTabla();
        }
    });
});

async function cargarCampanas() {
    try {
        const response = await fetch(`${API_ENDPOINT}/campana`);
        if (!response.ok) {
            throw new Error('Error de conexión con el servidor');
        }

        todasLasCampanas = await response.json();
        renderizarTabla();

    } catch (error) {
        console.error('Error al cargar las campañas:', error);

        const tbody = document.querySelector('#table-campanas');

        // Limpiar la tabla sin usar innerHTML
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        // Crear fila de error
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5; // En JS la propiedad lleva la 'S' mayúscula
        td.className = 'mensaje-error';

        const textoError = document.createTextNode('Error al cargar las campañas. Compruebe si json-server está en ejecución.');
        td.appendChild(textoError);
        tr.appendChild(td);
        tbody.appendChild(tr);

        document.querySelector('#total-campanas').textContent = 'Error de conexión';
    }
}

function renderizarTabla() {
    const tbody = document.querySelector('#table-campanas');
    const estadoFiltro = document.querySelector('#filter-state').value.toLowerCase();
    const buscarFiltro = document.querySelector('#filter-search').value.toLowerCase().trim();

    // Limpiar la tabla sin usar innerHTML
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    // Filtrar los datos
    const campanasFiltradas = todasLasCampanas.filter(campana => {
        const estadoMatches = estadoFiltro === 'todos' || (campana.estado && campana.estado.toLowerCase() === estadoFiltro);

        const nombreMatches = !buscarFiltro ||
            (campana.nombre_campana && campana.nombre_campana.toLowerCase().includes(buscarFiltro)) ||
            (campana.id_campana && campana.id_campana.toLowerCase().includes(buscarFiltro));

        return estadoMatches && nombreMatches;
    });

    // Actualizar el contador
    document.querySelector('#total-campanas').textContent = `${campanasFiltradas.length} campañas encontradas`;

    if (campanasFiltradas.length === 0) {
        // Crear fila de mensaje vacío
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'mensaje-vacio';

        const textoVacio = document.createTextNode('No se encontraron campañas con los filtros actuales.');
        td.appendChild(textoVacio);
        tr.appendChild(td);
        tbody.appendChild(tr);

        return;
    }

    // Renderizar filas
    campanasFiltradas.forEach(campana => {
        const tr = document.createElement('tr');

        const estadoClase = campana.estado ? campana.estado.toLowerCase().replace(' ', '-') : 'Planificada';

        // --- COLUMNA 1: Nombre e ID ---
        const td1 = document.createElement('td');

        const strong = document.createElement('strong');
        strong.appendChild(document.createTextNode(campana.nombre_campana || 'Sin nombre'));

        const small = document.createElement('small');
        small.appendChild(document.createTextNode(campana.id_campana || 'N/A'));

        td1.appendChild(strong);
        td1.appendChild(document.createTextNode(' ')); // Espacio entre elementos
        td1.appendChild(small);
        tr.appendChild(td1);

        // --- COLUMNA 2: Fecha de Inicio ---
        const td2 = document.createElement('td');
        td2.appendChild(document.createTextNode(formatearFecha(campana.fecha_inicio)));
        tr.appendChild(td2);

        // --- COLUMNA 3: Fecha de Fin ---
        const td3 = document.createElement('td');
        td3.appendChild(document.createTextNode(formatearFecha(campana.fecha_fin)));
        tr.appendChild(td3);

        // --- COLUMNA 4: Estado ---
        const td4 = document.createElement('td');
        const spanEstado = document.createElement('span');
        spanEstado.className = `estado-badge estado-${estadoClase}`;
        spanEstado.appendChild(document.createTextNode(campana.estado || 'Planificada'));

        td4.appendChild(spanEstado);
        tr.appendChild(td4);

        // --- COLUMNA 5: Acción (Botón Editar) ---
        const td5 = document.createElement('td');
        const enlaceEditar = document.createElement('a');
        enlaceEditar.href = `EditarCampana.html?id_campana=${encodeURIComponent(campana.id_campana)}`;
        enlaceEditar.className = 'btn-edit';
        enlaceEditar.appendChild(document.createTextNode('Editar'));

        td5.appendChild(enlaceEditar);
        tr.appendChild(td5);

        // Finalmente, añadir toda la fila al cuerpo de la tabla
        tbody.appendChild(tr);
    });
}

function formatearFecha(fechaString) {
    if (!fechaString) return '-';
    // Asume formato YYYY-MM-DD o ISO
    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return fechaString;

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        return fechaString;
    }
}