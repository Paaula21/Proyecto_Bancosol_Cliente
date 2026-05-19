
document.getElementById('form-voluntario').addEventListener('submit', async function (e) {

    // Capturamos los checkboxes marcados
    const asistencias = [];
    document.querySelectorAll('input[name="asistencia"]:checked').forEach((checkbox) => {
        asistencias.push(checkbox.value);
    });

    // VALIDACIÓN
    if (asistencias.length === 0) {
        e.preventDefault();
        alert("Debes seleccionar al menos una disponibilidad.");
        return;
    }

    e.preventDefault();

    const formData = new FormData(e.target);
    const datosVoluntario = Object.fromEntries(formData.entries());

    // Añadimos el array de horarios
    datosVoluntario.horarios = asistencias;

    // Eliminamos el campo duplicado
    delete datosVoluntario.asistencia;

    console.log("Enviando a json-server:", datosVoluntario);

    try {

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





