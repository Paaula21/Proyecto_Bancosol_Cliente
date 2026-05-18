// ----- CONFIGURACIÓN INICIAL -----
// Dirección base del servidor json-server
const API_ENDPOINT = 'http://localhost:3000';

// ----- EVENTO PRINCIPAL -----
// Esperamos a que el DOM esté cargado antes de hacer nada,
// para asegurarnos de que todos los elementos HTML ya existen
document.addEventListener('DOMContentLoaded', function () {
        cargarDashboard();
});

// ----- CARGA GENERAL DEL DASHBOARD -----
// Función principal que coordina todas las peticiones y renders.
// Usamos async/await porque necesitamos esperar las respuestas del servidor
// antes de poder mostrar los datos (JavaScript asíncrono, tema 5)
async function cargarDashboard() {
        try {
                // Lanzamos todas las peticiones en paralelo con Promise.all
                // para que no se esperen unas a otras y la página cargue más rápido
                const resultados = await Promise.all([
                        fetchDatos('campana'),
                        fetchDatos('establecimiento'),
                        fetchDatos('colaborador'),
                        fetchDatos('usuario?id_rol=2'),      // id_rol 2 = coordinador
                        fetchDatos('zona_geografica'),
                        fetchDatos('division_territorial'),
                        fetchDatos('codigo_postal'),
                        fetchDatos('direccion'),
                        fetchDatos('notificacion'),
                        fetchDatos('persona')
                ]);

                // Desestructuramos el array de resultados en variables con nombre
                let campanas = resultados[0];
                let establecimientos = resultados[1];
                let colaboradores = resultados[2];
                let coordinadores = resultados[3];
                let zonas = resultados[4];
                let divisiones = resultados[5];
                let codigosPostales = resultados[6];
                let direcciones = resultados[7];
                let notificaciones = resultados[8];
                let personas = resultados[9];

                // Llamamos a cada función de renderizado con los datos que necesita
                mostrarResumen(campanas, establecimientos, colaboradores, coordinadores, zonas);
                mostrarProximasCampanas(campanas);
                mostrarCoberturaPorZona(establecimientos, direcciones, codigosPostales, divisiones, zonas);
                mostrarActividadReciente(notificaciones, personas);

        } catch (error) {
                // Si cualquiera de las peticiones falla, lo mostramos en consola
                console.error('Error al cargar el dashboard:', error);
        }
}

// ----- FUNCIÓN GENÉRICA DE FETCH -----
// Reutilizamos esta función en todas las peticiones para no repetir código.
// Lanza un error si la respuesta del servidor no es correcta (status no 2xx)
async function fetchDatos(recurso) {
        let response = await fetch(`${API_ENDPOINT}/${recurso}`);
        if (!response.ok) {
                throw new Error(`Error al obtener "${recurso}": ${response.status}`);
        }
        return response.json();
}

// =============================================================
// SECCIÓN 1: TARJETAS DE RESUMEN
// =============================================================
// Rellena los 4 contadores de la parte superior del dashboard
// con datos reales calculados a partir de las colecciones recibidas
function mostrarResumen(campanas, establecimientos, colaboradores, coordinadores, zonas) {

        // Filtramos las campañas que están activas o planificadas
        let campanasActivas = campanas.filter(function (c) {
                return c.estado === 'Planificada' || c.estado === 'Activa';
        });

        // Construimos el subtítulo con los nombres de las campañas activas
        // Quitamos el año para que quepa mejor en la tarjeta
        let nombresCampanas = campanasActivas.map(function (c) {
                return c.nombre_campana.replace(' 2025', '');
        }).join(', ');

        // Escribimos los valores en los elementos del DOM usando textContent
        document.querySelector('#stat-campaigns-value').textContent = campanasActivas.length;
        document.querySelector('#stat-campaigns-subtitle').textContent = nombresCampanas || 'Sin campañas activas';

        document.querySelector('#stat-stores-value').textContent = establecimientos.length;
        document.querySelector('#stat-stores-subtitle').textContent = 'En ' + zonas.length + ' zonas geográficas';

        document.querySelector('#stat-collaborators-value').textContent = colaboradores.length;
        document.querySelector('#stat-collaborators-subtitle').textContent = 'Entidades y organizaciones';

        document.querySelector('#stat-coordinators-value').textContent = coordinadores.length;
        document.querySelector('#stat-coordinators-subtitle').textContent = 'Activos en campaña';
}

// =============================================================
// SECCIÓN 2: PRÓXIMAS CAMPAÑAS
// =============================================================
// Renderiza la lista de campañas que no están completadas,
// ordenadas por fecha de inicio (la más próxima primero)
function mostrarProximasCampanas(campanas) {
        let contenedor = document.querySelector('#campaign-container');

        // Vaciamos el contenedor antes de insertar el nuevo contenido
        while (contenedor.firstChild) {
                contenedor.removeChild(contenedor.firstChild);
        }

        // Filtramos y ordenamos las campañas
        let proximas = campanas.filter(function (c) {
                return c.estado !== 'Completada';
        }).sort(function (a, b) {
                return new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
        });

        // Si no hay campañas próximas, mostramos un mensaje informativo
        if (proximas.length === 0) {
                let parrafo = document.createElement('p');
                parrafo.style.color = '#6b7280';
                parrafo.style.fontSize = '0.875rem';
                parrafo.textContent = 'No hay campañas próximas.';
                contenedor.appendChild(parrafo);
                return;
        }

        // Construimos un elemento de tarjeta por cada campaña próxima
        proximas.forEach(function (campana) {
                let fechaInicio = formatearFecha(campana.fecha_inicio);
                let fechaFin = formatearFecha(campana.fecha_fin);

                // Creamos la estructura de la tarjeta manipulando el DOM
                let item = document.createElement('div');
                item.className = 'campaign-item';

                let infoDiv = document.createElement('div');
                infoDiv.className = 'campaign-info';

                let titulo = document.createElement('h4');
                titulo.textContent = campana.nombre_campana;

                let fechas = document.createElement('span');
                fechas.textContent = fechaInicio + ' - ' + fechaFin;

                infoDiv.appendChild(titulo);
                infoDiv.appendChild(fechas);

                let statsDiv = document.createElement('div');
                statsDiv.className = 'campaign-stats';

                let statEstado = document.createElement('div');
                statEstado.className = 'stat';

                let estadoStrong = document.createElement('strong');
                estadoStrong.textContent = campana.estado;

                statEstado.appendChild(estadoStrong);
                statsDiv.appendChild(statEstado);

                item.appendChild(infoDiv);
                item.appendChild(statsDiv);
                contenedor.appendChild(item);
        });
}

// =============================================================
// SECCIÓN 3: COBERTURA POR ZONA
// =============================================================
// Calcula cuántas tiendas hay en cada zona geográfica recorriendo
// la cadena: establecimiento → dirección → código_postal → división → zona
// y renderiza las barras de progreso animadas
function mostrarCoberturaPorZona(establecimientos, direcciones, codigosPostales, divisiones, zonas) {

        // Paso 1: Construimos un mapa de id_division → id_zona
        let divisionAZona = {};
        divisiones.forEach(function (d) {
                divisionAZona[d.id_division] = d.id_zona;
        });

        // Paso 2: Construimos un mapa de id_cp → id_zona (usando el mapa anterior)
        let cpAZona = {};
        codigosPostales.forEach(function (cp) {
                cpAZona[cp.id_cp] = divisionAZona[cp.id_division];
        });

        // Paso 3: Construimos un mapa de id_direccion → id_zona
        let direccionAZona = {};
        direcciones.forEach(function (d) {
                direccionAZona[d.id_direccion] = cpAZona[d.id_cp];
        });

        // Paso 4: Contamos cuántas tiendas pertenecen a cada zona
        let conteo = {};
        establecimientos.forEach(function (e) {
                let idZona = direccionAZona[e.id_direccion];
                if (idZona) {
                        conteo[idZona] = (conteo[idZona] || 0) + 1;
                }
        });

        // Paso 5: Añadimos el conteo a cada zona y filtramos las que tienen tiendas
        let zonasOrdenadas = zonas.map(function (z) {
                return {
                        id_zona: z.id_zona,
                        nombre_zona: z.nombre_zona,
                        tiendas: conteo[z.id_zona] || 0
                };
        }).filter(function (z) {
                return z.tiendas > 0;
        }).sort(function (a, b) {
                // Ordenamos de mayor a menor número de tiendas
                return b.tiendas - a.tiendas;
        });

        // El valor máximo sirve para calcular el porcentaje de cada barra
        let maxTiendas = zonasOrdenadas[0] ? zonasOrdenadas[0].tiendas : 1;

        // Vaciamos el contenedor antes de renderizar
        let contenedor = document.querySelector('#shops-list');
        while (contenedor.firstChild) {
                contenedor.removeChild(contenedor.firstChild);
        }

        // Creamos un elemento de barra por cada zona
        zonasOrdenadas.forEach(function (zona, indice) {
                let porcentaje = Math.round((zona.tiendas / maxTiendas) * 100);

                // Estructura del item de zona
                let item = document.createElement('div');
                item.className = 'shops-item';

                let etiquetas = document.createElement('div');
                etiquetas.className = 'shop-labels';

                let nombreSpan = document.createElement('span');
                nombreSpan.textContent = zona.nombre_zona;

                let tiendasSpan = document.createElement('span');
                tiendasSpan.textContent = zona.tiendas + ' tiendas';

                etiquetas.appendChild(nombreSpan);
                etiquetas.appendChild(tiendasSpan);

                let barraContenedor = document.createElement('div');
                barraContenedor.className = 'progress-bar-container';

                let barra = document.createElement('div');
                barra.className = 'progress-bar';
                barra.style.width = '0%';   // Empieza en 0 para poder animar

                barraContenedor.appendChild(barra);
                item.appendChild(etiquetas);
                item.appendChild(barraContenedor);
                contenedor.appendChild(item);

                // Animamos la barra usando setTimeout con un retardo escalonado
                // (JavaScript asíncrono, tema 5: temporizadores con setTimeout)
                // Cada barra entra 80ms después de la anterior para un efecto en cascada
                setTimeout(function () {
                        barra.style.width = porcentaje + '%';
                }, 100 + indice * 80);
        });
}

// =============================================================
// UTILIDADES
// =============================================================

// Convierte una fecha en formato ISO (YYYY-MM-DD) a un formato
// legible en español: "22 Nov 2025"
function formatearFecha(fechaISO) {
        if (!fechaISO) return '';
        let partes = fechaISO.split('-');
        let año = partes[0];
        let mes = partes[1];
        let dia = partes[2];
        let meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return dia + ' ' + meses[parseInt(mes) - 1] + ' ' + año;
}

// Convierte una fecha y hora ISO a formato "dd/mm/yyyy hh:mm"
function formatearFechaHora(fechaISO) {
        if (!fechaISO) return '';
        let d = new Date(fechaISO);
        return d.toLocaleDateString('es-ES') + ' ' +
                d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}