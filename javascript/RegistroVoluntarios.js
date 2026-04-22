document.getElementById('form-register').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evita que la página se refresque

    // 1. Obtener los datos del formulario de forma sencilla
    const formData = new FormData(e.target);

    // 2. Convertir los datos básicos a un objeto
    // Esto guardará nombre, email, telefono y observaciones
    const datosVoluntario = Object.fromEntries(formData.entries());

    // 3. Manejar los checkboxes de disponibilidad (la tabla)
    // Como hay muchos con el mismo nombre "asistencia", los guardaremos en un array
    const asistencias = [];
    document.querySelectorAll('input[name="asistencia"]:checked').forEach((checkbox) => {
        // Aquí podrías guardar algo más específico si añades IDs a los checkboxes
        asistencias.push(checkbox.value);
    });

    // Añadimos las asistencias al objeto principal
    datosVoluntario.horarios = asistencias;

    console.log("Datos a enviar:", datosVoluntario);

    // 4. Simular el envío al servidor con 'fetch'
    try {
        // Aquí pondrías la URL de tu API o servidor
        const response = await fetch('https://tu-api-ejemplo.com/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosVoluntario) // Convertimos el objeto a texto JSON
        });

        if (response.ok) {
            alert("¡Registro enviado con éxito!");
            e.target.reset(); // Limpia el formulario
        } else {
            alert("Hubo un error en el servidor.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor (es normal si aún no tienes uno).");
    }
});