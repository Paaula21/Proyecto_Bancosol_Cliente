// ----- CONFIGURACIÓN INICIAL -----
// Dirección del servidor (json-server)
const API_ENDPOINT = 'http://localhost:3000';

// En la API tenemos 3 roles: ADMIN (1), COORDINADOR (2) y COLABORADOR (3)
const ROL_ID = {
        ADMIN: 1,
        COORDINADOR: 2,
        COLABORADOR: 3
};

// Diccionario para redirigir según id_rol
const DIRECCION_POR_ROL = {
        1: 'Administrador.html',
        2: 'Coordinador.html',
        3: 'Colaboradores.html'
};

// ----- RECUÉRDAME -----
// Si el usuario marcó "Recordarme" completamos los campos
document.addEventListener('DOMContentLoaded', () => {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        if (savedUsername && savedPassword) {
                document.querySelector('#username').value = savedUsername;
                document.querySelector('#password').value = savedPassword;
                document.querySelector('#remember').checked = true;
        }
});

// ----- EVENTOS DEL FORMULARIO -----
document.querySelector('#form-login').addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.querySelector('#username').value.trim();
        const password = document.querySelector('#password').value;
        const message = document.querySelector('#message');

        message.textContent = 'Iniciando sesión...';

        // ----- PETICIÓN AL SERVIDOR -----
        // Buscamos en la tabla "usuario" filtrando por nombre de usuario.
        // La contraseña la comprobamos en cliente (solo válido para desarrollo con json-server).
        // En la práctica, esto se haría con POST y el servidor devolvería un token real
        try {
                const response = await fetch(`${API_ENDPOINT}/usuario?usuario=${encodeURIComponent(username)}`);

                if (!response.ok) {
                        message.textContent = 'Error de conexión con el servidor.';
                        return;
                }

                const data = await response.json();

                // json-server devuelve array; comprobamos que haya resultado
                if (data.length === 0) {
                        message.textContent = 'Usuario o contraseña incorrectos.';
                        return;
                }

                const usuarioEncontrado = data[0];

                // Comprobamos la contraseña
                // Aquí funciona porque json-server no tiene lógica de autenticación real.
                if (usuarioEncontrado.contrasenia !== password) {
                        message.textContent = 'Usuario o contraseña incorrectos.';
                        return;
                }

                // ----- INICIO DE SESIÓN CORRECTO -----
                // Guardamos datos de sesión
                sessionStorage.setItem('id_rol', usuarioEncontrado.id_rol);
                sessionStorage.setItem('id_usuario', usuarioEncontrado.id_usuario);
                sessionStorage.setItem('username', username);

                // Redirigimos según rol
                const targetPage = DIRECCION_POR_ROL[usuarioEncontrado.id_rol];
                if (!targetPage) {
                        message.textContent = 'Rol desconocido: ' + usuarioEncontrado.id_rol;
                        return;
                }

                // Recordarme
                const remember = document.querySelector('#remember');
                if (remember.checked) {
                        localStorage.setItem('savedUsername', username);
                        localStorage.setItem('savedPassword', password);
                } else {
                        localStorage.removeItem('savedUsername');
                        localStorage.removeItem('savedPassword');
                }

                message.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                window.location.href = targetPage;

        } catch (error) {
                message.textContent = 'Error de conexión: ' + error.message;
        }
});

// ----- EVENTO DE OLVIDAR CONTRASEÑA -----
document.querySelector('#forgot-password').addEventListener('click', function (e) {
        e.preventDefault();
        const message = document.querySelector('#message');
        message.textContent = 'Falta implementar';
});