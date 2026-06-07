// ----- CONFIGURACIÓN INICIAL ----- //
const API_BASE = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    console.log("¡[OK] El archivo AsignacionTurnosTienda.js se ha cargado e iniciado con éxito!");

    // 1. Forzamos a que el panel de las tiendas sea visible (tu HTML viene con display: none)
    const panelTiendas = document.getElementById('panel-tiendas');
    if (panelTiendas) {
        panelTiendas.style.display = 'block';
        console.log("¡[OK] Panel de tiendas hecho visible!");
    } else {
        console.error("[ERROR] No se encontró el contenedor '#panel-tiendas' en el HTML.");
    }

    // 2. Extraemos el ID de la campaña desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const idCampana = urlParams.get('id_campana');
    console.log("-> ID de campaña detectado en la URL:", idCampana);

    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');
    if (!tbodyTiendas) {
        console.error("[ERROR] No se encontró el 'id=tabla-tiendas-campana' en el HTML.");
        return;
    }

    // Si la URL no trae la campaña, lo reflejamos de inmediato en la tabla
    if (!idCampana) {
        tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold;">Error: No se recibió ninguna campaña (?id_campana=...) en la URL.</td></tr>';
        return;
    }

    // Actualizamos el título principal
    const titulo = document.getElementById('titulo-campana-tiendas');
    if (titulo) titulo.textContent = `Tiendas de la Campaña: ${idCampana}`;

    // Disparamos la carga de datos
    cargarTiendasDeCampana(idCampana);
});

async function cargarTiendasDeCampana(idCampana) {
    const tbodyTiendas = document.getElementById('tabla-tiendas-campana');

    // Cambiamos el texto original del HTML por uno nuevo para comprobar que el JS responde
    tbodyTiendas.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #2563eb;">Conectando con el servidor base...</td></tr>';

    try {
        console.log("1. Solicitando relaciones campana_cadena para:", idCampana);
        const resCampanaCadena = await fetch(`${API_BASE}/campana_cadena?id_campana=${idCampana}`);
        if (!resCampanaCadena.ok) throw new Error(`Fallo en campana_cadena (${resCampanaCadena.status})`);
        const campanaCadenas = await resCampanaCadena.json();
        console.log("   Datos recibidos de campana_cadena:", campanaCadenas);

        // Mapeamos los IDs de las cadenas autorizadas
        const idsCadenasDeCampana = campanaCadenas.map(cc => cc.id_cadena);
        console.log("   Cadenas autorizadas para esta campaña:", idsCadenasDeCampana);

        if (idsCadenasDeCampana.length === 0) {
            tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; font-weight: bold; color: #d97706;">La campaña ${idCampana} existe, pero no tiene ninguna cadena vinculada en la base de datos.</td></tr>`;
            return;
        }

        console.log("2. Solicitando nombres de las cadenas comerciales...");
        const resCadenas = await fetch(`${API_BASE}/cadena`);
        if (!resCadenas.ok) throw new Error("Fallo al obtener la lista global de cadenas");
        const cadenas = await resCadenas.json();

        console.log("3. Solicitando listado completo de establecimientos...");
        const resTiendas = await fetch(`${API_BASE}/establecimiento`);
        if (!resTiendas.ok) throw new Error("Fallo al obtener los establecimientos");
        const todasLasTiendas = await resTiendas.json();

        // 4. Aplicamos el filtro cruzado
        console.log("4. Filtrando tiendas...");
        const tiendasFiltradas = todasLasTiendas.filter(tienda =>
            idsCadenasDeCampana.includes(tienda.id_cadena)
        );
        console.log("   Tiendas que superaron el filtro:", tiendasFiltradas);

        // Limpiamos el texto de carga antes de renderizar
        tbodyTiendas.innerHTML = '';

        if (tiendasFiltradas.length === 0) {
            tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center;">No se encontraron tiendas físicas para las cadenas asignadas a la campaña ${idCampana}.</td></tr>`;
            return;
        }

        // 5. Inyectamos las filas filtradas
        tiendasFiltradas.forEach(tienda => {
            const cadenaObj = cadenas.find(c => c.id_cadena === tienda.id_cadena);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><strong>${tienda.nombre_resena || 'Sin nombre'}</strong></td>
                <td>${cadenaObj ? cadenaObj.nombre_cadena : tienda.id_cadena}</td>
                <td>${tienda.id_establecimiento}</td>
                <td><button class="btn btn--primary btn-seleccionar-tienda" data-id="${tienda.id_establecimiento}">Asignar turnos</button></td>
            `;
            tbodyTiendas.appendChild(tr);
        });

        console.log("¡[ÉXITO] Tabla de tiendas generada por completo!");

    } catch (error) {
        console.error("[ERROR CRÍTICO] Ocurrió un fallo durante la carga:", error);
        tbodyTiendas.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold;">Error al cargar datos: ${error.message}. Asegúrate de que json-server esté corriendo en el puerto 3000.</td></tr>`;
    }
}

async function loadVolunteers() {
    const tbody = document.getElementById('tabla-voluntarios');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Cargando voluntarios...</td></tr>`;

    try {
        const [voluntarios, personas] = await Promise.all([
            fetch(`${API_BASE}/voluntario`).then(r => r.json()),
            fetch(`${API_BASE}/persona`).then(r => r.json())
        ]);

        volunteersData = voluntarios.map(vol => {
            const per = personas.find(p => String(p.id_persona) === String(vol.id_persona));
            return {
                id_voluntario: vol.id_voluntario,
                nombre: per ? per.nombre_completo : "Desconocido",
                contacto: per ? per.email : "Sin email",
                disponibilidad: vol.preferencia_horario || "No especificada"
            };
        });

        displayVolunt(volunteersData);
    } catch (error) {
        console.error('Error al cargar voluntarios:', error);
    }
}

function displayVolunt(voluntarios) {
    const tbody = document.getElementById('tabla-voluntarios');
    tbody.innerHTML = "";

    voluntarios.forEach(vol => {
        let tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${vol.nombre}</strong></td>
            <td>${vol.contacto}</td>
            <td>${vol.disponibilidad}</td>
            <td>
                <button class="btn btn--primary" onclick="asignarTurno(${vol.id_voluntario})">
                    Asignar aquí
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contador-voluntarios').textContent = `${voluntarios.length} voluntarios disponibles`;
}

async function asignarTurno(idVoluntario) {
    if (!idTiendaSeleccionada || !idCampanaURL) {
        alert("Asegúrate de haber seleccionado una campaña y una tienda.");
        return;
    }

    try {
        const idGenerado = Math.random().toString(36).substring(2, 11);
        await fetch(`${API_BASE}/asignacion_turno_colaborador`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: idGenerado,
                id_asignacion_turno: Date.now(),
                id_campana: idCampanaURL,
                id_tienda: parseInt(idTiendaSeleccionada),
                id_voluntario: idVoluntario,
                fecha: new Date().toISOString().split('T')[0] // Fecha por defecto
            })
        });

        alert("Voluntario asignado a la tienda correctamente.");
    } catch (error) {
        console.error("Error al asignar:", error);
    }
}