// ----- CONFIGURACIÓN INICIAL -----

// Obtenemos el ID directamente de la URL
const parametrosURL = new URLSearchParams(window.location.search);
const idCampana = parametrosURL.get('id_campana'); // Esto buscará "?id=X" en tu URL

// Dirección del servidor (json-server)
const API_ENDPOINT = 'http://localhost:3000';

// Cargar datos de la campaña al iniciar
document.addEventListener('DOMContentLoaded', async () => {
        if (!idCampana) {
                alert('No se ha proporcionado un ID de campaña en la URL.');
                return;
        }

        try {
                const response = await fetch(`${API_ENDPOINT}/campana?id_campana=${encodeURIComponent(idCampana)}`);

                if (!response.ok) {
                        alert('Error al conectar con el servidor.');
                        return;
                }

                const data = await response.json();

                if (data.length === 0) {
                        alert('No se encontró la campaña con el ID especificado.');
                        return;
                }

                const campana = data[0];

                // Rellenar el formulario
                document.querySelector('#name-campanya').value = campana.nombre_campana || '';
                document.querySelector('#initial-date').value = campana.fecha_inicio || '';
                document.querySelector('#final-date').value = campana.fecha_fin || '';

                if (campana.estado) {
                        // El value en HTML para estado está en minúsculas y sin espacios, 
                        // adaptamos según los options (pendiente, en-curso, finalizada, cancelada)
                        // Aseguramos que coincide con una opción válida
                        document.querySelector('#status').value = campana.estado.toLowerCase().replace(' ', '-');
                }
        } catch (error) {
                console.error('Error al cargar la campaña:', error);
                alert('No se pudieron cargar los datos de la campaña.');
        }
});

document.querySelector('#form-edit').addEventListener('submit', async function (e) {
        e.preventDefault();

        // Verificamos si realmente hay un ID en la URL
        if (!idCampana) {
                alert('Error: No se encontró el ID de la campaña.');
                return;
        }

        const name = document.querySelector('#name-campanya').value.trim();
        const initialDate = document.querySelector('#initial-date').value;
        const finalDate = document.querySelector('#final-date').value;
        const status = document.querySelector('#status').value;

        // Tenemos que añadir el ID porque en el método PUT reescribimos la entrada
        // al completo
        const updatedData = {
                id_campana: idCampana,
                nombre_campana: name,
                fecha_inicio: initialDate,
                fecha_fin: finalDate,
                estado: status
        };

        // ----- PETICIÓN AL SERVIDOR -----
        try {
                // Usamos el método PUT para actualizar la campaña existente
                const response = await fetch(`${API_ENDPOINT}/campana?id_campana=${encodeURIComponent(idCampana)}`, {
                        method: "PUT",
                        headers: {
                                "Content-Type": "application/json"
                        },
                        body: JSON.stringify(updatedData)
                });

                if (!response.ok) {
                        alert('Error de conexión con el servidor.');
                        return;
                }

                const data = await response.json();

                // json-server devuelve array; comprobamos que haya resultado
                if (data.length === 0) {
                        alert('Campaña no encontrada.');
                        return;
                }

                window.location.href = 'Campana.html';

        } catch (error) {
                console.error('Error al actualizar la campaña:', error);
                alert('Error al actualizar la campaña. Por favor, inténtalo de nuevo.');
        }
});