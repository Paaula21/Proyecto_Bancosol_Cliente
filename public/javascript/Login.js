// ----- CONFIGURACIÓN INICIAL -----
// Dirección base del servidor json-server
const API_ENDPOINT = 'http://localhost:3000';

// Diccionario que relaciona cada id_rol con su página de destino.
// Cuando añadamos nuevas páginas, solo hay que actualizar este objeto
const DIRECCION_POR_ROL = {
        1: '/dashboard-admin',       // Administrador
        2: '/dashboard-coordinador', // Coordinador
        3: '/dashboard-colaborador'  // Colaborador
};

// ----- EVENTO: RECORDARME -----
// Al cargar la página, si el usuario marcó "Recordarme" en la sesión anterior,
// rellenamos los campos con los valores guardados en localStorage.
// localStorage persiste entre sesiones (a diferencia de sessionStorage)
document.addEventListener('DOMContentLoaded', function () {
        let usuarioGuardado = localStorage.getItem('savedUsername');
        let contraseniaGuardada = localStorage.getItem('savedPassword');

        if (usuarioGuardado && contraseniaGuardada) {
                document.querySelector('#username').value = usuarioGuardado;
                document.querySelector('#password').value = contraseniaGuardada;
                document.querySelector('#remember').checked = true;
        }
});

// ----- EVENTO: ENVÍO DEL FORMULARIO -----
// Escuchamos el submit del formulario para interceptarlo antes de que recargue la página
document.querySelector('#form-login').addEventListener('submit', async function (e) {

        // Cancelamos el comportamiento por defecto (recarga de página)
        e.preventDefault();

        // Leemos los valores de los campos. Usamos trim() para eliminar
        // espacios en blanco al principio y al final del nombre de usuario
        let username = document.querySelector('#username').value.trim();
        let password = document.querySelector('#password').value;
        let mensaje = document.querySelector('#message');

        mensaje.textContent = 'Iniciando sesión...';

        // ----- PETICIÓN AL SERVIDOR -----
        // Buscamos en la tabla "usuario" filtrando por el campo usuario.
        // json-server permite filtrar con ?campo=valor directamente en la URL.
        // NOTA: En un sistema real, nunca se enviaría la contraseña en texto plano
        // ni se comprobaría en el cliente. Esto es válido solo para desarrollo con json-server.
        try {
                let response = await fetch(`${API_ENDPOINT}/usuario?usuario=${encodeURIComponent(username)}`);

                if (!response.ok) {
                        mensaje.textContent = 'Error de conexión con el servidor.';
                        return;
                }

                // json-server siempre devuelve un array al filtrar
                let datos = await response.json();

                // Si el array está vacío, no existe ningún usuario con ese nombre
                if (datos.length === 0) {
                        mensaje.textContent = 'Usuario o contraseña incorrectos.';
                        return;
                }

                let usuarioEncontrado = datos[0];

                // Comparamos la contraseña introducida con la almacenada en la DB.
                // Las contraseñas están en texto plano en la DB de pruebas
                if (usuarioEncontrado.contrasenia !== password) {
                        mensaje.textContent = 'Usuario o contraseña incorrectos.';
                        return;
                }

                // ----- INICIO DE SESIÓN CORRECTO -----
                // Guardamos los datos de sesión en sessionStorage.
                // sessionStorage se borra al cerrar la pestaña, lo que es más seguro
                // que localStorage para datos de sesión (tema 8: almacenamiento en el cliente)
                sessionStorage.setItem('id_rol', usuarioEncontrado.id_rol);
                sessionStorage.setItem('id_usuario', usuarioEncontrado.id_usuario);
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('id', usuarioEncontrado.id);

                // Buscamos la página de destino según el rol del usuario
                let paginaDestino = DIRECCION_POR_ROL[usuarioEncontrado.id_rol];

                // Si el rol no está contemplado en el diccionario, mostramos un error
                if (!paginaDestino) {
                        mensaje.textContent = 'Rol desconocido: ' + usuarioEncontrado.id_rol;
                        return;
                }

                // ----- RECORDARME -----
                // Si el checkbox está marcado, guardamos las credenciales en localStorage
                // para rellenarlas automáticamente en la próxima visita
                let recuerdame = document.querySelector('#remember');
                if (recuerdame.checked) {
                        localStorage.setItem('savedUsername', username);
                        localStorage.setItem('savedPassword', password);
                } else {
                        // Si no está marcado, eliminamos cualquier valor guardado anteriormente
                        localStorage.removeItem('savedUsername');
                        localStorage.removeItem('savedPassword');
                }

                mensaje.textContent = 'Inicio de sesión exitoso. Redirigiendo...';

                // Redirigimos al usuario a su página correspondiente
                window.location.href = paginaDestino;

        } catch (error) {
                // Capturamos errores de red (servidor caído, sin conexión, etc.)
                mensaje.textContent = 'Error de conexión: ' + error.message;
        }
});

// ----- EVENTO: OLVIDAR CONTRASEÑA -----
// Por ahora solo mostramos un mensaje. Está pendiente de implementar
document.querySelector('#forgot-password').addEventListener('click', function (e) {
        e.preventDefault();
        let mensaje = document.querySelector('#message');
        mensaje.textContent = 'Falta implementar';
});