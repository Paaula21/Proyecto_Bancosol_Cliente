document.addEventListener('DOMContentLoaded', () => {
    
    const rutaActual = window.location.pathname.split('/').pop() || "Administrador.html" || "AsignacionTurnos.html";
    
    // Obtener el header
    const buscadorHeader = setInterval(() => {
        const headerTitle = document.getElementById('dynamic-header-title');
        const headerSubtitle = document.getElementById('dynamic-header-subtitle');
        const enlacesMenu = document.querySelectorAll('.sidebar ul li a');

        if(rutaActual.includes("RegistroVoluntarios.html")) {
            headerTitle.textContent = "Registro de Voluntarios";
            headerSubtitle.textContent = "Complete los siguientes campos";
        };

        if(rutaActual.includes("EditarVoluntario.html")) {
            headerTitle.textContent = "Editar Voluntario";
            headerSubtitle.textContent = "Modifique los datos personales y la disponibilidad del voluntario";
        }

        if (headerTitle && headerSubtitle && enlacesMenu.length > 0) {
            clearInterval(buscadorHeader); // Apagamos el buscador

            // Obtenemos los valores del header
            enlacesMenu.forEach(enlace => {
                const href = enlace.getAttribute('href');
                if (href && href.includes(rutaActual)) {
                    const titulo = enlace.getAttribute('data-titulo');
                    const subtitulo = enlace.getAttribute('data-subtitulo');

                    if (titulo) headerTitle.textContent = titulo;
                    if (subtitulo) headerSubtitle.textContent = subtitulo;
                }
            });
        }
    }, 50);
});