// Lógica Cerrar Sesión
const btnLogout = document.querySelector('#btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '../html/Login.html';
    });
}

const btnDashboard = document.querySelector('#dashboard');
btnDashboard.addEventListener('click', () => {
    window.location.href = '../html/Administrador.html';
    btnDashboard.classList.add('active');
    sessionStorage.setItem('seccionActiva', 'dashboard');
});