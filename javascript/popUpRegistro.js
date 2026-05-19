var btnAbrirPopup = document.getElementById('btn-abrir-popup'),
    overlay = document.getElementById('overlay'),
    popup = document.getElementById('popup'),
    btnCerrarPopup = document.getElementById('btn-cerrar-popup');
    overlay2 = document.getElementById('overlay2'),
    popup2 = document.getElementById('popup2'),

btnAbrirPopup.addEventListener('click', function (e) {

    e.preventDefault();

    const formulario = document.getElementById("form-voluntario");

    if (!formulario.checkValidity()) {
        return;
    }

    const asistencias = document.querySelectorAll('input[name="asistencia"]:checked');
    if (asistencias.length === 0) {
        alert("Debes seleccionar al menos una disponibilidad.");
        return;
    }

    overlay.classList.add('active');
    popup.classList.add('active');
});

btnCerrarPopup.addEventListener('click', function (e) {
    e.preventDefault();
    overlay.classList.remove('active');
    popup.classList.remove('active');
});


