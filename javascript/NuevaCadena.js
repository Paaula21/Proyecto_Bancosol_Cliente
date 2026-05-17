// ----- CONFIGURACIÓN INICIAL -----
const API_BASE = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    const datos = sessionStorage.getItem('cadena_editar');
    if (!datos) return;

    const cad = JSON.parse(datos);

    document.getElementById('form-title').textContent = 'Editar Cadena';
    document.getElementById('form-subtitle').textContent = 'Modifica los datos de la cadena';
    document.getElementById('chain-name').value = cad.nombre_cadena || '';

    sessionStorage.removeItem('cadena_editar');
});
