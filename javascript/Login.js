// ----- CONFIGURACIÓN INICIAL -----
// dirección del servidor
const API_ENDPOINT = 'http://localhost:3000/usuarios'
// Diccionario para enviar al usuario a la página según su rol
// Cambiar según las páginas que vayamos haciendo
const DIRECCION_POR_ROL = {
        admin: 'Administrador.html',
        colab: 'Colaboradores.html'
};

// ----- RECUÉRDAME -----
// Si el usuario marcó "Recordarme" completamos los campos
document.addEventListener('DOMContentLoaded', () => {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        if(savedUsername && savedPassword) {
                document.getElementById('username').value = savedUsername;
                document.getElementById('password').value = savedPassword;
                document.getElementById('remember').checked = true;
        }
});

// ----- EVENTOS DEL FORMULARIO -----
// Buscamos el formulario en la página (document.getElementById)
// Añadimos addEventListener para que se quede escuchando hasta que se pulse el botón de submit
// Usamos async poque nos conectamos a un servidor y tendremos que esperar respuestas 
document.getElementById('form-login').addEventListener('submit', async function (e) {
        // Cancelamos las recargas para que no se pierdan los datos escritos si se recarga
        e.preventDefault();

        // ----- GUARDAMOS DATOS -----
        // Nombre de usuario, usamos trim para limpiar el dato recogido
        const username = document.getElementById('username').value.trim();
        // Contraseña
        const password = document.getElementById('password').value;
        // Mensajes para mostrar al usuario
        const message = document.getElementById('message');

        message.textContent = 'Iniciando sesión...'; // Mensaje de carga

        // ----- PETICIÓN AL SERVIDOR -----
        try {
                // Usamos fetch para enviar los datos al servidor (Esta forma no es segura porque es un get y la contraseña se quedaría en el historial)
                // Lo descomentamos para usar json-server y hacer pruebas
                const response = await fetch(API_ENDPOINT + `?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,{});

                // Usamos fecth con método POST para la seguridad de las contraseñas
                // const response = await fetch(API_ENDPOINT, {
                //         method: 'POST',
                //         headers: { 'Content-Type': 'application/json' },
                //         body: JSON.stringify({ username, password })
                // });

                // Convertimos la respuesta del servidor a JSON
                // const data = await response.json();

                // if(response.ok && data.token && data.role) {
                //         sessionStorage.setItem('token', data.token); // Guardamos el token en sessionStorage para usarlo en otras páginas
                //         sessionStorage.setItem('role', data.role); // Guardamos el rol del usuario para redirigirlo a la página correcta
                
                //         // Redirigimos al usuario a la página que le corresponda
                //         const targetPage = DIRECCION_POR_ROL[data.role];
                // Convertimos la respuesta del servidor a JSON
                const data = await response.json();

                // Comprobamos que data sea una lista y tenga al menos 1 elemento
                if(response.ok && data.length > 0) {
                        
                        const usuario = data[0]; // Extraemos el primer usuario de la lista

                        sessionStorage.setItem('token', usuario.token); 
                        sessionStorage.setItem('role', usuario.role); 
                
                        // Usamos usuario.role en lugar de data.role
                        const targetPage = DIRECCION_POR_ROL[usuario.role];

                        // Manejo del error en caso de no encontrar el rol
                        if(!targetPage) {
                                message.textContent = 'Rol desconocido: ' + usuario.role;
                                return;
                        }

                        message.textContent = 'Inicio de sesión exitoso. Redirigiendo...';

                        // Si se marcó "Recordarme"
                        const remember = document.getElementById('remember');
                        if(remember.checked) {
                                // Si está marcado, se guardan los valores para la siguiente sesión
                                localStorage.setItem('savedUsername', username);
                                localStorage.setItem('savedPassword', password);
                        } else {
                                // Si no etsá marcado, borramos los valores localmente
                                localStorage.removeItem('savedUsername');
                                localStorage.removeItem('savedPassword');
                        }

                        window.location.href = targetPage;
                } else {
                        // Si el usuario o la contraseña están mal
                        message.textContent = 'Error de autenticación: ' + (data.message || 'Credenciales incorrectas');
                }
        } catch (error) {
                // Si hay un error en la conexión, lo mostramos al usuario
                message.textContent = 'Error de conexión: ' + error.message;
                return;
        }
});

// ----- EVENTO DE OLVIDAR CONTRASEÑA -----
document.getElementById('forgot-password').addEventListener('click', function (e) {
        e.preventDefault();

        const message = document.getElementById('message');
        message.textContent = 'Falta implementar';
});