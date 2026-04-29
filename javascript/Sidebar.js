const btnCerrarSesion = document.getElementById('btn-cierre-sesion');

if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', function (e) {
        e.preventDefault();
        
        // --- CHIVATOS ---
        console.log("¡Clic detectado!");
        console.log("Borrando sesión...");
        
        sessionStorage.clear();
        
        console.log("Redirigiendo...");
        // ----------------
        
        window.location.href = '../html/Login.html'; 
    });
} else {
    console.error("ALERTA: El JavaScript no encuentra el botón de cerrar sesión.");
}