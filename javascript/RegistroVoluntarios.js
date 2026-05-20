function maxNumero(lista, campo) {
    return Math.max(0, ...lista.map(item => Number(item?.[campo]) || 0));
}

document.getElementById('form-voluntario').addEventListener('submit', async function (e) {

    e.preventDefault();

    // CHECKBOXES
    const asistencias = [];

    document.querySelectorAll('input[name="asistencia"]:checked')
        .forEach((checkbox) => {
            asistencias.push(checkbox.value);
        });

    // VALIDACIÓN
    if (asistencias.length === 0) {

        alert("Debes seleccionar al menos una disponibilidad.");
        return;
    }

    const formData = new FormData(e.target);

    const datos = Object.fromEntries(formData.entries());

    try {
        // ====================================
        // 1. OBTENER PERSONAS EXISTENTES
        // ====================================
        const responsePersonas = await fetch('http://localhost:3000/persona');
        const personas = await responsePersonas.json();

        // CORRECCIÓN: Quitamos el ".personas" extra
        const nuevoIdPersona = maxNumero(personas, 'id_persona') + 1;

        // ====================================
        // 2. CREAR PERSONA
        // ====================================
        const nuevaPersona = {
            id_persona: nuevoIdPersona,
            nombre_completo: datos.volunt_name,
            telefono: datos.volunt_tel || "",
            email: datos.volunt_email || "",
            observacion: datos.volunt_obs || null
        };

        console.log(nuevaPersona);

        const responsePersona = await fetch('http://localhost:3000/persona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaPersona)
        });

        if (!responsePersona.ok) {
            throw new Error("Error al crear persona");
        }

        // ====================================
        // 3. OBTENER VOLUNTARIOS EXISTENTES
        // ====================================
        const responseVols = await fetch('http://localhost:3000/voluntario');
        const voluntarios = await responseVols.json();

        // CORRECCIÓN: Usamos la variable 'voluntarios' y el campo 'id_voluntario'
        const nuevoIdVoluntario = maxNumero(voluntarios, 'id_voluntario') + 1;

        // ====================================
        // 4. CREAR VOLUNTARIO
        // ====================================
        const nuevoVoluntario = {
            id_voluntario: nuevoIdVoluntario,
            id_persona: nuevoIdPersona,
            preferencia_horario: asistencias.join(', '),
            id_colaborador: null
        };

    } catch (error) {

        console.error(error);

        alert("Error al registrar voluntario");
    }
});