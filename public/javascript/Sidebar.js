// Resaltar menú seleccionado
function resaltarMenuActivo() {
    const currentPath = window.location.pathname;

    const menuLinks = document.querySelectorAll('.sidebar ul li a');

    menuLinks.forEach(link => {
        const li = link.parentElement;

        li.classList.remove('active');

        const linkHref = link.getAttribute('href');

        if (linkHref && currentPath.includes(linkHref.replace('..', ''))) {
            li.classList.add('active');
        }

        if (currentPath.includes('Administrador.html') && linkHref.includes('Administrador.html')) {
            li.classList.add('active');
        }

        if(currentPath.includes('AsignacionTurnos.html') && linkHref.includes('AsignacionTurnos.html')) {
            li.classList.add('active');
        }
    });
}

// Cerrar sesión
document.addEventListener('click', function (e) {
    const btnCerrarSesion = e.target.closest('#btn-logout');
    if (btnCerrarSesion) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = '../html/Login.html';
    }
});

const checkSidebarInterval = setInterval(() => {
    const sidebarExists = document.querySelector('.sidebar ul');
    if (sidebarExists) {
        resaltarMenuActivo();
        clearInterval(checkSidebarInterval); 
    }
}, 100); 

// Acción de abrir el perfil de usuario
document.addEventListener('DOMContentLoaded', () => {
    const btnPerfil = document.getElementById('btn-abrir-perfil');
    
    if (btnPerfil) {
        btnPerfil.addEventListener('click', () => {
            const eventoAbrir = new CustomEvent('togglePerfilUsuario');
            window.dispatchEvent(eventoAbrir);
        });
    }
});