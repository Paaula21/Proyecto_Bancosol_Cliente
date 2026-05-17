// ----- CONFIGURACIÓN INICIAL -----
const API_ENDPOINT = 'http://localhost:3000';

// Leemos el ID de campaña de la URL al arrancar.
// Ejemplo de URL: EditarCampana.html?id_campana=GR2025
let parametrosURL = new URLSearchParams(window.location.search);
let idCampana = parametrosURL.get('id_campana');

// Snapshot de los datos originales cargados desde la API.
// Se usa para revertir los cambios al pulsar "Descartar".
let datosOriginales = null;

// ----- EVENTO PRINCIPAL -----
document.addEventListener('DOMContentLoaded', async function () {

        if (!idCampana) {
                console.log("URL completa:", window.location.href);
                console.log("Search parameters:", window.location.search);
                alert(`No se ha proporcionado un ID de campaña en la URL.\nURL actual: ${window.location.href}`);
                return;
        }

        // Cargamos en paralelo los datos de la campaña, todas las cadenas
        // disponibles y las cadenas que ya participan en esta campaña.
        // Así solo hacemos una espera en lugar de tres seguidas
        try {
                let resultados = await Promise.all([
                        fetchDatos('campana?id_campana=' + encodeURIComponent(idCampana)),
                        fetchDatos('cadena'),
                        fetchDatos('campana_cadena?id_campana=' + encodeURIComponent(idCampana))
                ]);

                let datosCampana = resultados[0];   // Array con la campaña (1 elemento)
                let todasLasCadenas = resultados[1];   // Array con todas las cadenas de la db
                let cadenasEnCampana = resultados[2];   // Array con las relaciones campana_cadena

                // Rellenamos el formulario con los datos de la campaña
                rellenarFormulario(datosCampana);

                // Generamos los checkboxes con todas las cadenas y marcamos las participantes
                generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana);

                // Guardamos un snapshot de los valores originales para poder
                // revertirlos si el usuario pulsa "Descartar"
                if (datosCampana.length > 0) {
                        let campana = datosCampana[0];
                        datosOriginales = {
                                nombre: campana.nombre_campana || '',
                                fechaInicio: campana.fecha_inicio || '',
                                fechaFin: campana.fecha_fin || '',
                                estado: campana.estado || '',
                                cadenas: new Set(cadenasEnCampana.map(function (rel) { return rel.id_cadena; }))
                        };
                }

        } catch (error) {
                console.error('Error al cargar los datos:', error);
                alert('No se pudieron cargar los datos de la campaña.');
        }

        // El submit del formulario abre el popup de confirmación
        // en lugar de guardar directamente
        document.querySelector('#form-edit').addEventListener('submit', function (e) {
                e.preventDefault();
                document.getElementById('overlay-confirmar').classList.add('active');
                document.getElementById('popup-confirmar').classList.add('active');
        });

        // ----- BOTÓN DESCARTAR -----
        // Revierte todos los campos del formulario y los checkboxes
        // a los valores que se cargaron originalmente desde la API.
        document.getElementById('btn-descartar').addEventListener('click', function () {
                if (!datosOriginales) return;   // Todavía no se cargaron los datos

                // Restauramos los campos de texto y el select
                document.querySelector('#name-campanya').value = datosOriginales.nombre;
                document.querySelector('#initial-date').value = datosOriginales.fechaInicio;
                document.querySelector('#final-date').value = datosOriginales.fechaFin;
                document.querySelector('#status').value = datosOriginales.estado;

                // Restauramos el estado de cada checkbox de cadena
                document.querySelectorAll('#checkbox-list input[type="checkbox"]').forEach(function (cb) {
                        cb.checked = datosOriginales.cadenas.has(cb.value);
                });
        });

        // ----- LÓGICA POPUP CONFIRMACIÓN DE EDICIÓN -----
        document.addEventListener('click', async function (e) {

                // Cancelar: cierra el popup sin hacer nada
                if (e.target && e.target.id === 'btn-cancelar-edicion') {
                        e.preventDefault();
                        document.getElementById('overlay-confirmar').classList.remove('active');
                        document.getElementById('popup-confirmar').classList.remove('active');
                }

                // Confirmar: cierra el popup y guarda los cambios
                if (e.target && e.target.id === 'btn-confirmar-edicion') {
                        e.preventDefault();

                        const btnConfirmar = e.target;
                        const textoOriginal = btnConfirmar.textContent;

                        try {
                                btnConfirmar.textContent = 'Guardando...';
                                btnConfirmar.disabled = true;

                                document.getElementById('overlay-confirmar').classList.remove('active');
                                document.getElementById('popup-confirmar').classList.remove('active');

                                await guardarCampana();

                        } finally {
                                btnConfirmar.textContent = textoOriginal;
                                btnConfirmar.disabled = false;
                        }
                }
        });
});

// ----- FUNCIÓN GENÉRICA DE FETCH -----
// Reutilizamos esta función para no repetir la lógica de comprobación
// de errores en cada petición (peticiones de red, tema 6)
async function fetchDatos(recurso) {
        let response = await fetch(`${API_ENDPOINT}/${recurso}`);
        if (!response.ok) {
                throw new Error('Error al obtener "' + recurso + '": ' + response.status);
        }
        return response.json();
}

// ----- RELLENO DEL FORMULARIO -----
// Recibe el array que devuelve json-server y asigna cada campo
// al input correspondiente del formulario
function rellenarFormulario(datosCampana) {

        if (datosCampana.length === 0) {
                alert('No se encontró la campaña con el ID: ' + idCampana);
                return;
        }

        let campana = datosCampana[0];

        document.querySelector('#name-campanya').value = campana.nombre_campana || '';
        document.querySelector('#initial-date').value = campana.fecha_inicio || '';
        document.querySelector('#final-date').value = campana.fecha_fin || '';

        // Para el select de estado convertimos el valor de la db al formato
        // que usan los <option> del HTML (minúsculas, sin espacios)
        if (campana.estado) {
                let estadoSelect = document.querySelector('#status');
                let estadoFormateado = campana.estado;

                // Comprobamos que la opción exista en el select antes de asignarla
                let existeOpcion = Array.from(estadoSelect.options).some(function (opt) {
                        return opt.value === estadoFormateado;
                });

                if (existeOpcion) {
                        estadoSelect.value = estadoFormateado;
                }
        }
}

// ----- GENERACIÓN DINÁMICA DE CHECKBOXES DE CADENAS -----
// Recibe todas las cadenas de la db y las que ya participan en la campaña.
// Crea un checkbox por cada cadena y marca las que ya están asignadas.
// Los checkboxes se insertan en el contenedor con id "cadenas-container"
function generarCheckboxesCadenas(todasLasCadenas, cadenasEnCampana) {
        let contenedor = document.querySelector('#checkbox-list');

        if (!contenedor) {
                console.log('No se encontró el elemento #checkbox-list en el HTML.');
                return;
        }

        // Vaciamos el contenedor por si tuviera algo previo
        while (contenedor.firstChild) {
                contenedor.removeChild(contenedor.firstChild);
        }

        // Construimos un Set con los id_cadena que ya participan en la campaña
        // para poder comprobar rápidamente si una cadena está incluida (O(1) vs O(n))
        let cadenasParticipantes = new Set(cadenasEnCampana.map(function (rel) {
                return rel.id_cadena;
        }));

        // Creamos un checkbox por cada cadena disponible en la db
        todasLasCadenas.forEach(function (cadena) {

                // Contenedor del checkbox + etiqueta (para poder aplicar estilos)
                let divItem = document.createElement('div');
                divItem.className = 'cadena-item';

                // El checkbox en sí
                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = 'cadena-' + cadena.id_cadena;   // ej: cadena-MERCADONA
                checkbox.value = cadena.id_cadena;
                checkbox.name = 'cadenas';

                // Lo marcamos si esta cadena ya participa en la campaña actual
                checkbox.checked = cadenasParticipantes.has(cadena.id_cadena);

                // Etiqueta asociada al checkbox (el for apunta al id del input)
                let label = document.createElement('label');
                label.htmlFor = 'cadena-' + cadena.id_cadena;
                label.textContent = cadena.nombre_cadena;

                divItem.appendChild(checkbox);
                divItem.appendChild(label);
                contenedor.appendChild(divItem);
        });
}

// ----- GUARDADO DE CAMBIOS -----
// Recoge los valores del formulario y actualiza la campaña en la db.
// También actualiza la tabla campana_cadena con las cadenas seleccionadas
async function guardarCampana() {

        // Leemos los campos del formulario
        let nombre = document.querySelector('#name-campanya').value.trim();
        let fechaInicio = document.querySelector('#initial-date').value;
        let fechaFin = document.querySelector('#final-date').value;
        let estado = document.querySelector('#status').value;

        // Recogemos qué checkboxes de cadenas están marcados
        let checkboxesMarcados = document.querySelectorAll('#checkbox-list input[type="checkbox"]:checked');
        let cadenasSeleccionadas = Array.from(checkboxesMarcados).map(function (cb) {
                return cb.value;   // El value de cada checkbox es el id_cadena
        });

        // Objeto con los datos actualizados de la campaña (PUT necesita el objeto completo)
        let datosCampana = {
                id_campana: idCampana,
                nombre_campana: nombre,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                estado: estado
        };

        try {
                // ----- PASO 1: Actualizamos los datos básicos de la campaña -----
                // Primero buscamos el id interno que usa json-server (distinto de id_campana)
                let busqueda = await fetchDatos('campana?id_campana=' + encodeURIComponent(idCampana));

                if (busqueda.length === 0) {
                        alert('No se encontró la campaña para guardar.');
                        return;
                }

                // json-server usa el campo "id" (numérico/autoincremental) para el PUT
                let idInterno = busqueda[0].id;

                let responsePut = await fetch(`${API_ENDPOINT}/campana/${idInterno}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosCampana)
                });

                if (!responsePut.ok) {
                        alert('Error al guardar la campaña.');
                        return;
                }

                // ----- PASO 2: Actualizamos las cadenas participantes -----
                // Borramos todas las relaciones actuales de esta campaña
                // y luego creamos las nuevas con las cadenas seleccionadas.
                // json-server no tiene DELETE masivo, así que borramos una a una
                let relacionesActuales = await fetchDatos(
                        'campana_cadena?id_campana=' + encodeURIComponent(idCampana)
                );

                // Borramos cada relación existente
                for (let relacion of relacionesActuales) {
                        await fetch(`${API_ENDPOINT}/campana_cadena/${relacion.id}`, {
                                method: 'DELETE'
                        });
                }

                // Creamos una relación nueva por cada cadena seleccionada
                for (let idCadena of cadenasSeleccionadas) {
                        await fetch(`${API_ENDPOINT}/campana_cadena`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_campana: idCampana, id_cadena: idCadena })
                        });
                }

                // Si todo fue bien, volvemos a la lista de campañas
                window.location.href = 'Campana.html';

        } catch (error) {
                console.error('Error al guardar los cambios:', error);
                alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
        }
}