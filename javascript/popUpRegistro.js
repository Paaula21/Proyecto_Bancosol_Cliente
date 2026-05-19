var btnAbrirPopup = document.getElementById('btn-abrir-popup'),
    overlay = document.getElementById('overlay'),
    popup = document.getElementById('popup'),
    btnCerrarPopup = document.getElementById('btn-cerrar-popup');
    overlay2 = document.getElementById('overlay2'),
    popup2 = document.getElementById('popup2'),

btnAbrirPopup.addEventListener('click', function (e) {

    e.preventDefault();

    //Checkea que no se abra el pop up sin que los datos estén incompletos
    const formulario = document.getElementById("form-voluntario");

    if(formulario.checkValidity()) {
        overlay.classList.add('active');
        popup.classList.add('active');
    } // else {
       // overlay2.classList.add('active');
       // popup2.classList.add('active');
    // }
});

btnCerrarPopup.addEventListener('click', function (e) {
    e.preventDefault();
    overlay.classList.remove('active');
    popup.classList.remove('active');
});


