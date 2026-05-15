// ----- CONFIGURACIÓN INICIAL -----
const API_ENDPOINT = 'http://localhost:3000';

// Cargamos el contenido del dashboard al cargar la página
document.addEventListener('DOMContentLoaded', () => {
        cargarDashboard();
});

// ----- PETICIONES A LA DB -----
async function cargarDashboard() {
        try {
                // Hacemos todas las peticiones en paralelo para que cargue más rápido
                const [campanas, establecimientos, colaboradores, coordinadores, zonas, divisiones, codigos_postales, direcciones, notificaciones, personas] = await Promise.all([
                        fetchDatos('campana'),
                        fetchDatos('establecimiento'),
                        fetchDatos('colaborador'),
                        fetchDatos('usuario?id_rol=2'),   // rol 2 = coordinador
                        fetchDatos('zona_geografica'),
                        fetchDatos('division_territorial'),
                        fetchDatos('codigo_postal'),
                        fetchDatos('direccion'),
                        fetchDatos('notificacion'),
                        fetchDatos('persona')
                ]);

                mostrarResumen(campanas, establecimientos, colaboradores, coordinadores, zonas);
                mostrarProximasCampanas(campanas);
                mostrarCoberturaPorZona(establecimientos, direcciones, codigos_postales, divisiones, zonas);
                mostrarActividadReciente(notificaciones, personas);

        } catch (error) {
                console.error('Error al cargar el dashboard:', error);
        }
}

// Función genérica para fetch
async function fetchDatos(recurso) {
        const response = await fetch(`${API_ENDPOINT}/${recurso}`);
        if (!response.ok) throw new Error(`Error al obtener ${recurso}`);
        return response.json();
}

// ----- TARJETAS DE RESUMEN -----
function mostrarResumen(campanas, establecimientos, colaboradores, coordinadores, zonas) {
        const campanasActivas = campanas.filter(c => c.estado === 'Planificada' || c.estado === 'Activa');
        const nombresCampanas = campanasActivas.map(c => c.nombre_campana.replace(' 2025', '')).join(', ');

        document.querySelector('#stat-campaigns-value').textContent = campanasActivas.length;
        document.querySelector('#stat-campaigns-subtitle').textContent = nombresCampanas || 'Sin campañas activas';

        document.querySelector('#stat-stores-value').textContent = establecimientos.length;
        document.querySelector('#stat-stores-subtitle').textContent = `En ${zonas.length} zonas geográficas`;

        document.querySelector('#stat-collaborators-value').textContent = colaboradores.length;
        document.querySelector('#stat-collaborators-subtitle').textContent = 'Entidades y organizaciones';

        document.querySelector('#stat-coordinators-value').textContent = coordinadores.length;
        document.querySelector('#stat-coordinators-subtitle').textContent = 'Activos en campaña';
}

// ----- PRÓXIMAS CAMPAÑAS -----
function mostrarProximasCampanas(campanas) {
        const container = document.querySelector('#campaign-container');
        container.innerHTML = '';

        // Mostramos las que no están completadas, ordenadas por fecha
        const proximas = campanas
                .filter(c => c.estado !== 'Completada')
                .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

        if (proximas.length === 0) {
                container.innerHTML = '<p style="color:#6b7280; font-size:0.875rem;">No hay campañas próximas.</p>';
                return;
        }

        proximas.forEach(campana => {
                const fechaInicio = formatearFecha(campana.fecha_inicio);
                const fechaFin = formatearFecha(campana.fecha_fin);

                const item = document.createElement('div');
                item.classList.add('campaign-item');
                item.innerHTML = `
            <div class="campaign-info">
                <h4>${campana.nombre_campana}</h4>
                <span>${fechaInicio} - ${fechaFin}</span>
            </div>
            <div class="campaign-stats">
                <div class="stat">Estado <strong>${campana.estado}</strong> </div>
            </div>
        `;
                container.appendChild(item);
        });
}

// ----- COBERTURA POR ZONA -----
// Construimos la cadena: establecimiento -> direccion -> codigo_postal -> division_territorial -> zona_geografica
function mostrarCoberturaPorZona(establecimientos, direcciones, codigos_postales, divisiones, zonas) {
        // Mapa: id_direccion -> id_zona
        const cpAZona = {};
        const divAZona = {};
        divisiones.forEach(d => { divAZona[d.id_division] = d.id_zona; });
        codigos_postales.forEach(cp => { cpAZona[cp.id_cp] = divAZona[cp.id_division]; });

        const dirAZona = {};
        direcciones.forEach(d => { dirAZona[d.id_direccion] = cpAZona[d.id_cp]; });

        // Contar tiendas por zona
        const conteo = {};
        establecimientos.forEach(e => {
                const idZona = dirAZona[e.id_direccion];
                if (idZona) conteo[idZona] = (conteo[idZona] || 0) + 1;
        });

        // Ordenar de mayor a menor
        const zonaOrdenada = zonas
                .map(z => ({ ...z, tiendas: conteo[z.id_zona] || 0 }))
                .filter(z => z.tiendas > 0)
                .sort((a, b) => b.tiendas - a.tiendas);

        const maxTiendas = zonaOrdenada[0]?.tiendas || 1;
        const container = document.querySelector('#shops-list');
        container.innerHTML = '';

        zonaOrdenada.forEach((zona, index) => {
                const porcentaje = Math.round((zona.tiendas / maxTiendas) * 100);

                const item = document.createElement('div');
                item.classList.add('shops-item');
                item.innerHTML = `
            <div class="shop-labels">
                <span>${zona.nombre_zona}</span>
                <span>${zona.tiendas} tiendas</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%;" data-width="${porcentaje}%"></div>
            </div>
        `;
                container.appendChild(item);

                // Animamos la barra al cargar, igual que en el PDF
                // Usamos un pequeño delay escalonado por índice para que entren una a una
                setTimeout(() => {
                        item.querySelector('.progress-bar').style.width = porcentaje + '%';
                }, 100 + index * 80);
        });
}

// ----- ACTIVIDAD RECIENTE -----
// Usamos las notificaciones como actividad reciente
function mostrarActividadReciente(notificaciones, personas) {
        const tbody = document.querySelector('#activity-tbody');
        tbody.innerHTML = '';

        if (notificaciones.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6b7280;">Sin actividad reciente.</td></tr>';
                return;
        }

        // Mapa id_persona -> nombre
        const personaMap = {};
        personas.forEach(p => { personaMap[p.id_persona] = p.nombre_completo; });

        // Mostramos las últimas 8 notificaciones ordenadas por fecha
        const recientes = [...notificaciones]
                .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
                .slice(0, 8);

        recientes.forEach(notif => {
                const nombreDestino = personaMap[notif.id_persona_destino] || 'Sistema';
                const estado = notif.leida ? 'Leída' : 'Sin leer';
                const fecha = formatearFechaHora(notif.fecha_creacion);

                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${notif.id_tipo}</td>
            <td>${notif.titulo}</td>
            <td>${nombreDestino}</td>
            <td>${estado}</td>
        `;
                tbody.appendChild(tr);
        });
}

// ----- UTILIDADES -----
function formatearFecha(fechaISO) {
        if (!fechaISO) return '';
        const [año, mes, dia] = fechaISO.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${dia} ${meses[parseInt(mes) - 1]} ${año}`;
}

function formatearFechaHora(fechaISO) {
        if (!fechaISO) return '';
        const d = new Date(fechaISO);
        return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}