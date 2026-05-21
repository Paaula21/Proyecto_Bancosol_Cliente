document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('click', async function (e) {
                // Botón Editar en Ficha
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

                        // Cargar checkboxes de cadenas
                        try {
                                let [todasLasCadenas, cadenasEnCampana] = await Promise.all([
                                        fetch(`${API_ENDPOINT}/cadena`).then(r => r.json()),
                                        fetch(`${API_ENDPOINT}/campana_cadena?id_campana=${encodeURIComponent(campana.id_campana)}`).then(r => r.json())
                                ]);
                                generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana);
                        } catch (error) {
                                console.error('Error cargando cadenas para edición:', error);
                        }

                        document.querySelector('#campaign-data').style.display = 'none';
                        document.querySelector('#edit-campaign-container').style.display = 'block';
                        mostrarAccionesCampana('edicion');
                }

                // Botón Cancelar en el Formulario
                if (e.target && e.target.id === 'btn-cancel-edit-campaign') {
                        e.preventDefault();
                        document.querySelector('#edit-campaign-container').style.display = 'none';
                        document.querySelector('#campaign-data').style.display = 'block';
                        mostrarAccionesCampana('detalle');
                }

                // Botón de guardar explícito
                if (e.target && e.target.id === 'btn-save-changes-campaign') {
                        e.preventDefault(); // Evitamos cualquier comportamiento extra

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

                                // MOSTRAR POPUP (Forzamos el estilo por si acaso el CSS falla)
                                const overlay = document.querySelector('#overlay-success-campaign');
                                const popup = document.querySelector('#popup-success-campaign');

                                if (overlay) {
                                        overlay.style.visibility = 'visible';
                                        overlay.classList.add('active');
                                }
                                if (popup) popup.classList.add('active');

                        } catch (error) {
                                console.error(error);
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

                // Aceptar en popup de éxito
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

                // Aceptar en popup de error
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

function generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana) {
        let contenedor = document.querySelector('#checkbox-list');
        if (!contenedor) return;

        contenedor.innerHTML = '';
        // Normalizamos los IDs a String para evitar conflictos de tipo de datos al comparar con el Set
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

async function guardarEdicionCampana() {
        let nombre = document.querySelector('#name-campanya').value.trim();
        let fechaInicio = document.querySelector('#initial-date').value;
        let fechaFin = document.querySelector('#final-date').value;
        let estado = document.querySelector('#status').value;

        let checkboxesMarcados = document.querySelectorAll('#checkbox-list input[type="checkbox"]:checked');
        let cadenasSeleccionadas = Array.from(checkboxesMarcados).map(cb => cb.value);

        // 1. Buscamos el ID interno de la campaña
        let busqueda = await fetch(`${API_ENDPOINT}/campana?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`).then(r => r.json());
        if (busqueda.length === 0) throw new Error('Campaña no encontrada.');

        let idInterno = busqueda[0].id;

        // 2. Actualizar datos básicos (Se recomienda PATCH para actualizar parcialmente de manera segura)
        let responsePatch = await fetch(`${API_ENDPOINT}/campana/${idInterno}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                        id_campana: campanaSeleccionadaId,
                        nombre_campana: nombre,
                        fecha_inicio: fechaInicio,
                        fecha_fin: fechaFin,
                        estado: estado
                })
        });

        if (!responsePatch.ok) throw new Error('Error al actualizar datos básicos de la campaña.');

        // 3. Gestionar Cadenas de forma SECUENCIAL para no saturar json-server
        // Obtenemos las relaciones actuales de esta campaña
        let relacionesActuales = await fetch(`${API_ENDPOINT}/campana_cadena?id_campana=${encodeURIComponent(campanaSeleccionadaId)}`).then(r => r.json());

        // Borramos las relaciones una por una usando un bucle for...of controlado
        for (const rel of relacionesActuales) {
                let responseDelete = await fetch(`${API_ENDPOINT}/campana_cadena/${rel.id}`, { method: 'DELETE' });
                if (!responseDelete.ok) {
                        throw new Error(`Error al remover la cadena previa con ID de relación: ${rel.id}`);
                }
        }

        // Creamos las nuevas relaciones una por una de manera limpia
        for (const idCadena of cadenasSeleccionadas) {
                let responsePost = await fetch(`${API_ENDPOINT}/campana_cadena`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                                id: Math.random().toString(36).substring(2, 12),
                                id_campana: campanaSeleccionadaId,
                                id_cadena: idCadena
                        })
                });
                if (!responsePost.ok) {
                        throw new Error(`Error al asociar la cadena con ID: ${idCadena}`);
                }
        }
}