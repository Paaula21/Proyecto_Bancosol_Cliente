const API_BASE = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    const datos = sessionStorage.getItem('establecimiento_editar');
    if (datos) {
        const est = JSON.parse(datos);

        document.getElementById('form-title').textContent = 'Editar Tienda';
        document.getElementById('form-subtitle').textContent = 'Modifica los datos del establecimiento';

        document.getElementById('store-name').value = est.nombre_resena || '';
        document.getElementById('chain-select').value = est.id_cadena ? est.id_cadena.toLowerCase() : '';

        if (est.obj_direccion) {
            const tipoViaMap = { 'Calle': 'street', 'Avenida': 'avenue', 'Plaza': 'square' };
            document.getElementById('street-type').value = tipoViaMap[est.obj_direccion.tipo_via] || '';
            document.getElementById('street-address').value = est.obj_direccion.nombre_via || '';
            document.getElementById('building-number').value = est.obj_direccion.numero || '';
        }

        if (est.obj_cp) {
            document.getElementById('zip-code').value = est.obj_cp.codigo || '';
        }

        if (est.localidad) {
            document.getElementById('city-name').value = est.localidad;
        }

        if (est.nombre_zona && est.nombre_zona !== 'Sin zona') {
            document.getElementById('geo-zone').value = est.nombre_zona;
        }

        sessionStorage.removeItem('establecimiento_editar');
    }
});
