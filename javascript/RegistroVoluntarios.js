document.getElementById('form-voluntario').addEventListener('submit', async function (e) {

    // SIEMPRE evitamos el envío por defecto primero
    e.preventDefault();

    // Capturamos los checkboxes marcados
    const asistencias = [];

    document.querySelectorAll('input[name="asistencia"]:checked').forEach((checkbox) => {
        asistencias.push(checkbox.value);
    });

    // VALIDACIÓN CHECKBOXES
    if (asistencias.length === 0) {
        alert("Debes seleccionar al menos una disponibilidad.");
        return;
    }

    // Si llega aquí, TODO está correcto
    const formData = new FormData(e.target);
    const datosVoluntario = Object.fromEntries(formData.entries());

    // Añadimos horarios
    datosVoluntario.horarios = asistencias;

    // Eliminamos el campo duplicado
    delete datosVoluntario.asistencia;

    console.log("Enviando a json-server:", datosVoluntario);

    try {

        const response = await fetch('http://localhost:3000/voluntario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosVoluntario)
        });

        if (response.ok) {

            // AQUÍ muestras el popup
            document.getElementById("overlay").classList.add("active");
            document.getElementById("popup").classList.add("active");

            e.target.reset();

        } else {

            alert("Error: El servidor no pudo procesar el registro.");

        }

    } catch (error) {

        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor. Revisa la terminal.");

    }

});