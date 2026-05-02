document.addEventListener('click', function(e) {
    // e.target.closest busca si hicimos clic directamente en el <li> o en algún hijo (como la etiqueta <a>)
    const btnCerrarSesion = e.target.closest('#btn-logout');

    if (btnCerrarSesion) {
        e.preventDefault();        
        sessionStorage.clear();
        window.location.href = '../html/Login.html'; 
    }
});