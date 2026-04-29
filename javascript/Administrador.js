// ----- CONFIGURACIÓN INICIAL -----
// dirección del servidor
const API_ENDPOINT = 'http://localhost:3002/dashboard';

// Cargamos el contenido del dashboard al cargar la página
document.addEventListener("DOMContentLoaded", () => {
        cargarDashboard();
}); 

// Petición a la db
async function cargarDashboard() {
        try {
                const response = await fetch(API_ENDPOINT);
                if (!response.ok) {
                        throw new Error('Error al cargar el dashboard');
                }
                // Procesar los datos del dashboard
                const data = await response.json();

                mostrarDashboard(data);
                proximasCampanas(data)
        } catch (error) {
                console.error('Error al cargar el dashboard:', error);
        }
}