document.addEventListener("DOMContentLoaded", () => {
    const data = sessionStorage.getItem('cadena_editar');
    if (!data) return;

    const cad = JSON.parse(data);

    document.getElementById('form-title').textContent = 'Editar Cadena';
    document.getElementById('form-subtitle').textContent = 'Modifica los datos de la cadena';
    document.getElementById('chain-name').value = cad.nombre_cadena || '';

    sessionStorage.removeItem('cadena_editar');
});
