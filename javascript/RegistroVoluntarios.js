document.getElementById('form-register').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const datosVoluntario = Object.fromEntries(formData.entries());

    // Capturamos los checkboxes marcados
    const asistencias = [];
    document.querySelectorAll('input[name="asistencia"]:checked').forEach((checkbox) => {
        asistencias.push(checkbox.value);
    });

    // Añadimos el array de horarios y borramos el campo individual duplicado
    datosVoluntario.horarios = asistencias;
    delete datosVoluntario.asistencia;

    console.log("Enviando a json-server:", datosVoluntario);

    try {
        // Conexión al servidor local en el puerto 3000
        const response = await fetch('http://localhost:3001/turnos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosVoluntario)
        });

        if (response.ok) {
            alert("¡Registro guardado en db.json con éxito!");
            e.target.reset();
        } else {
            alert("Error: El servidor no pudo procesar el registro.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor. Revisa la terminal.");
    }
});