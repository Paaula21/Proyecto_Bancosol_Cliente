// Definimos la variable global para asegurarnos de que la conexión a la base de datos siempre funcione
const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', async function (e) {
        
        // --- 1. Botón Editar en Ficha ---
        if (e.target && e.target.id === 'btn-edit-campaign') {
            e.preventDefault();

            if (!campanaSeleccionadaId) {
                alert("Error: No se ha seleccionado ninguna campaña.");
                return;
            }

            // Buscar campaña en memoria
            let campana = todasLasCampanas.find(c => String(c.id_campana) === String(campanaSeleccionadaId));
            if (!campana) return;

            // Cargar datos en el formulario
            document.querySelector('#name-campanya').value = campana.nombre_campana || '';
            document.querySelector('#initial-date').value = campana.fecha_inicio || '';
            document.querySelector('#final-date').value = campana.fecha_fin || '';

            if (campana.estado) {
                let estadoSelect = document.querySelector('#status');
                let existeOpcion = Array.from(estadoSelect.options).some(opt => opt.value === campana.estado);
                if (existeOpcion) estadoSelect.value = campana.estado;
            }

            // Cargar checkboxes de cadenas (USANDO API_BASE)
            try {
                let [todasLasCadenas, cadenasEnCampana] = await Promise.all([
                    fetch(`${API_BASE}/cadena`).then(r => r.json()),
                    fetch(`${API_BASE}/campana_cadena?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`).then(r => r.json())
                ]);
                generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana);
            } catch (error) {
                console.error('Error cargando cadenas para edición:', error);
            }

            document.querySelector('#campaign-data').style.display = 'none';
            document.querySelector('#edit-campaign-container').style.display = 'block';
            mostrarAccionesCampana('edicion');
        }

        // --- 2. Botón Cancelar en el Formulario ---
        if (e.target && e.target.id === 'btn-cancel-edit-campaign') {
            e.preventDefault();
            document.querySelector('#edit-campaign-container').style.display = 'none';
            document.querySelector('#campaign-data').style.display = 'block';
            mostrarAccionesCampana('detalle');
        }

        // --- 3. Botón de guardar explícito ---
        if (e.target && e.target.id === 'btn-save-changes-campaign') {
            e.preventDefault();

            const form = document.querySelector('#form-edit-campaign');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const btnGuardar = e.target;
            btnGuardar.textContent = 'Guardando...';
            btnGuardar.disabled = true;

            try {
                await guardarEdicionCampana();

                // Recargar datos de la tabla
                await cargarCampanas();

                // Volver a mostrar el detalle actualizado
                let campanaActualizada = todasLasCampanas.find(c => String(c.id_campana) === String(campanaSeleccionadaId));
                document.querySelector('#edit-campaign-container').style.display = 'none';
                if (campanaActualizada) {
                    mostrarDetalleCampana(campanaActualizada);
                }

                // MOSTRAR POPUP
                const overlay = document.querySelector('#overlay-success-campaign');
                const popup = document.querySelector('#popup-success-campaign');

                if (overlay) {
                    overlay.style.visibility = 'visible';
                    overlay.classList.add('active');
                }
                if (popup) popup.classList.add('active');

            } catch (error) {
                console.error("Error capturado en guardar:", error);
                const overlayErr = document.querySelector('#overlay-error-campaign');
                const popupErr = document.querySelector('#popup-error-campaign');
                const textErr = document.querySelector('#error-text-popup-campaign');

                if (textErr) textErr.textContent = error.message;
                if (overlayErr) {
                    overlayErr.style.visibility = 'visible';
                    overlayErr.classList.add('active');
                }
                if (popupErr) popupErr.classList.add('active');
            } finally {
                btnGuardar.textContent = 'Guardar Cambios';
                btnGuardar.disabled = false;
            }
        }

        // --- 4. Aceptar en popup de éxito ---
        if (e.target && e.target.id === 'btn-accept-edit-campaign') {
            e.preventDefault();
            const overlay = document.querySelector('#overlay-success-campaign');
            const popup = document.querySelector('#popup-success-campaign');
            if(overlay) {
                overlay.classList.remove('active');
                overlay.style.visibility = '';
            }
            if(popup) popup.classList.remove('active');
        }

        // --- 5. Aceptar en popup de error ---
        if (e.target && e.target.id === 'btn-accept-error-campaign') {
            e.preventDefault();
            const overlay = document.querySelector('#overlay-error-campaign');
            const popup = document.querySelector('#popup-error-campaign');
            if(overlay) {
                overlay.classList.remove('active');
                overlay.style.visibility = '';
            }
            if(popup) popup.classList.remove('active');
        }
    });
});

// Generador de checkboxes
function generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana) {
    let contenedor = document.querySelector('#checkbox-list');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    
    // Convertimos a String seguro para comparaciones
    let cadenasParticipantes = new Set(cadenasEnCampana.map(rel => String(rel.id_cadena)));

    todasLasCadenas.forEach(cadena => {
        let divItem = document.createElement('div');
        divItem.className = 'cadena-item';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'cadena-' + cadena.id_cadena;
        checkbox.value = cadena.id_cadena;
        checkbox.name = 'cadenas';
        checkbox.checked = cadenasParticipantes.has(String(cadena.id_cadena));

        let label = document.createElement('label');
        label.htmlFor = 'cadena-' + cadena.id_cadena;
        label.textContent = cadena.nombre_cadena;

        divItem.appendChild(checkbox);
        divItem.appendChild(label);
        contenedor.appendChild(divItem);
    });
}

// Guardado en Base de Datos
async function guardarEdicionCampana() {
    let nombre = document.querySelector('#name-campanya').value.trim();
    let fechaInicio = document.querySelector('#initial-date').value;
    let fechaFin = document.querySelector('#final-date').value;
    let estado = document.querySelector('#status').value;

    let checkboxesMarcados = document.querySelectorAll('#checkbox-list input[type="checkbox"]:checked');
    let cadenasSeleccionadas = Array.from(checkboxesMarcados).map(cb => cb.value);

    // 1. Buscamos el ID interno de la campaña en json-server
    let busqueda = await fetch(`${API_BASE}/campana?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`).then(r => r.json());
    if (busqueda.length === 0) throw new Error('Campaña no encontrada.');

    let idInterno = busqueda[0].id;

    // 2. Actualizar datos básicos
    let responsePatch = await fetch(`${API_BASE}/campana/${idInterno}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre_campana: nombre,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: estado
        })
    });

    if (!responsePatch.ok) throw new Error('Error al actualizar datos básicos de la campaña.');

    // 3. Gestionar Cadenas (Adaptado al estilo de tus compañeras)
    // Pedimos TODAS las relaciones y filtramos con JavaScript en lugar de en la URL
    let todasLasRelaciones = await fetch(`${API_BASE}/campana_cadena`).then(r => r.json());
    
    // Filtramos para quedarnos solo con las relaciones de ESTA campaña
    let relacionesActuales = todasLasRelaciones.filter(rel => String(rel.id_campana) === String(campanaSeleccionadaId));

    // Borramos relaciones previas usando try/catch para que no bloquee la ejecución si json-server falla
    for (const rel of relacionesActuales) {
        try {
            await fetch(`${API_BASE}/campana_cadena/${rel.id}`, { method: 'DELETE' });
        } catch (e) {
            console.warn(`Aviso silencioso: No se pudo borrar la relación ${rel.id}`, e);
        }
    }

    // Convertimos el id_campana a número si es necesario para mantener coherencia en DB
    let idCampanaFormateado = isNaN(campanaSeleccionadaId) ? campanaSeleccionadaId : Number(campanaSeleccionadaId);

    // Creamos las nuevas relaciones (sin bloquear si alguna falla)
    for (const idCadenaStr of cadenasSeleccionadas) {
        
        let idCadenaFormateado = isNaN(idCadenaStr) ? idCadenaStr : Number(idCadenaStr);

        try {
            await fetch(`${API_BASE}/campana_cadena`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: Math.random().toString(36).substring(2, 12),
                    id_campana: idCampanaFormateado,
                    id_cadena: idCadenaFormateado
                })
            });
        } catch (e) {
            console.warn(`Aviso silencioso: No se pudo enlazar la cadena ${idCadenaStr}`, e);
        }
    }
}