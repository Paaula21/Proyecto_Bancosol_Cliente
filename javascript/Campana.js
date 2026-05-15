const API_ENDPOINT = 'http://localhost:3000';
let todasLasCampanas = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCampanas();
    
    // Configurar el botón de filtrado
    document.getElementById('btn-filter').addEventListener('click', renderizarTabla);
    
    // Permitir filtrar al presionar Enter en el buscador
    document.getElementById('filter-search').addEventListener('keypress', (e) => {
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
        document.getElementById('table-campanas').innerHTML = `
            <tr>
                <td colspan="5" class="mensaje-error">
                    Error al cargar las campañas. Compruebe si json-server está en ejecución.
                </td>
            </tr>
        `;
        document.getElementById('total-campanas').textContent = 'Error de conexión';
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('table-campanas');
    const estadoFiltro = document.getElementById('filter-state').value.toLowerCase();
    const buscarFiltro = document.getElementById('filter-search').value.toLowerCase().trim();
    
    tbody.innerHTML = '';
    
    // Filtrar los datos
    const campanasFiltradas = todasLasCampanas.filter(campana => {
        const estadoMatches = estadoFiltro === 'todos' || (campana.estado && campana.estado.toLowerCase() === estadoFiltro);
        
        const nombreMatches = !buscarFiltro || 
            (campana.nombre_campana && campana.nombre_campana.toLowerCase().includes(buscarFiltro)) ||
            (campana.id_campana && campana.id_campana.toLowerCase().includes(buscarFiltro));
            
        return estadoMatches && nombreMatches;
    });
    
    // Actualizar el contador
    document.getElementById('total-campanas').textContent = `${campanasFiltradas.length} campañas encontradas`;
    
    if (campanasFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="mensaje-vacio">No se encontraron campañas con los filtros actuales.</td>
            </tr>
        `;
        return;
    }
    
    // Renderizar filas
    campanasFiltradas.forEach(campana => {
        const tr = document.createElement('tr');
        
        // Formatear estado para la clase CSS
        const estadoClase = campana.estado ? campana.estado.toLowerCase().replace(' ', '-') : 'planificada';
        
        tr.innerHTML = `
            <td>
                <strong>${campana.nombre_campana || 'Sin nombre'}</strong>
                <small>${campana.id_campana || 'N/A'}</small>
            </td>
            <td>${formatearFecha(campana.fecha_inicio)}</td>
            <td>${formatearFecha(campana.fecha_fin)}</td>
            <td>
                <span class="estado-badge estado-${estadoClase}">
                    ${campana.estado || 'Planificada'}
                </span>
            </td>
            <td>
                <a href="EditarCampana.html?id_campana=${encodeURIComponent(campana.id_campana)}" class="btn-edit">Editar</a>
            </td>
        `;
        
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
