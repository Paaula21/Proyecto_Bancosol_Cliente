// Función para resaltar el menú activo
function resaltarMenuActivo() {
    // 1. Obtener la ruta actual (ej: /html/Campana.html)
    const currentPath = window.location.pathname;

    // 2. Seleccionar todos los enlaces del sidebar
    const menuLinks = document.querySelectorAll('.sidebar ul li a');

    menuLinks.forEach(link => {
        const li = link.parentElement;

        // Quitamos la clase active de todos por si acaso
        li.classList.remove('active');

        // 3. Comparar el href del enlace con la ruta actual
        // Usamos .includes() porque los href pueden tener rutas relativas como "../html/..."
        const linkHref = link.getAttribute('href');

        if (linkHref && currentPath.includes(linkHref.replace('..', ''))) {
            li.classList.add('active');
        }

        // Caso especial para el Dashboard (si la ruta es la raíz o Administrador)
        if (currentPath.includes('Administrador.html') && linkHref.includes('Administrador.html')) {
            li.classList.add('active');
        }

        // Caso especial para los voluntarios
        if(currentPath.includes('AsignacionTurnos.html') && linkHref.includes('AsignacionTurnos.html')) {
            li.classList.add('active');
        }
    });
}

// Lógica de cierre de sesión que ya tenías
document.addEventListener('click', function (e) {
    const btnCerrarSesion = e.target.closest('#btn-logout');
    if (btnCerrarSesion) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = '../html/Login.html';
    }
});

/**
 * IMPORTANTE: Como usas IncludeHTML.js, el sidebar no existe al cargar la página.
 * Debemos esperar a que el componente se cargue. 
 * Si tu IncludeHTML.js lanza un evento personalizado, úsalo. 
 * Si no, usaremos un intervalo pequeño para detectar cuando el sidebar aparezca.
 */
const checkSidebarInterval = setInterval(() => {
    const sidebarExists = document.querySelector('.sidebar ul');
    if (sidebarExists) {
        resaltarMenuActivo();
        clearInterval(checkSidebarInterval); // Detenemos la búsqueda una vez encontrado
    }
}, 100); // Revisa cada 100ms