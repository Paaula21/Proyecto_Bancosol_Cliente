const API_BASE = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    cargarZonas();
    
    // Boton guardar con el pop up
    const btnGuardarForm = document.getElementById('btn-guardar');
    if (btnGuardarForm) {
        btnGuardarForm.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Campos obligatorios rellenos
            const form = document.getElementById('form-nuevo-colaborador');
            if (form && !form.reportValidity()) {
                return; // Si falta algo, se para y sale el aviso rojo de HTML
            }
            
            // Mostramos el pop up antes de guardar los datos para que no se recarge la página 
            document.getElementById('overlay-confirmar').classList.add('active');
            document.getElementById('popup-confirmar').classList.add('active');
        });
    }

    // Botón aceptar del pop up, guarda los datos
    const btnConfirmar = document.getElementById('btn-aceptar-exito');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async (e) => {
            e.preventDefault();
          
            btnConfirmar.textContent = "Guardando...";
            btnConfirmar.disabled = true;
            
            // Ejecutamos la función de guardar
            await guardarColaborador(); 
            
            // Volvemos a la página de Colaboradores
            window.location.href = 'Colaboradores.html'; 
        });
    }

    // Botón cancelar registro
    const btnCancelarGeneral = document.getElementById('btn-cancelar');
    if (btnCancelarGeneral) {
        btnCancelarGeneral.addEventListener('click', (e) => {
            e.preventDefault(); 
            window.location.href = 'Colaboradores.html'; 
        });
    }
});

// Generar id aleatorio
function generarId() { return Math.random().toString(36).substring(2, 12); }

// Función para comprobar que se ha seleccionado un colaborador existente
function getVal(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.error(`ERROR: No se encontró el elemento con ID: ${id}`);
        return "";
    }
    return el.value.trim();
}
// Obtener las zonas disponibles para el selector
async function cargarZonas() {
    try {
        const res = await fetch(`${API_BASE}/zona_geografica`);
        const zonas = await res.json();
        const select = document.getElementById('nuevo-zona');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>Seleccione zona...</option>';
            zonas.forEach(z => {
                const opt = document.createElement('option');
                opt.value = z.id_zona;
                opt.textContent = z.nombre_zona;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error("Error cargando zonas", e); }
}

//Para guardar el colaborador nuevo
async function guardarColaborador(e) {
    const btnSubmit = document.getElementById('btn-guardar');
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Guardando...";

    try {
        // Datos para las relaciones de la base de datos
        const [resCP, resDiv, resPers, resDir, resCol] = await Promise.all([
            fetch(`${API_BASE}/codigo_postal`),
            fetch(`${API_BASE}/division_territorial`),
            fetch(`${API_BASE}/persona`),
            fetch(`${API_BASE}/direccion`),
            fetch(`${API_BASE}/colaborador`)
        ]);

        const cps = await resCP.json();
        const divisiones = await resDiv.json();
        const personas = await resPers.json();
        const direcciones = await resDir.json();
        const colaboradores = await resCol.json();

        const zonaId = parseInt(getVal('nuevo-zona'));
        const localidadTxt = getVal('nuevo-localidad');
        const cpTxt = getVal('nuevo-cp');

        // División territorial
        let divObj = divisiones.find(d => d.nombre_division.toLowerCase() === localidadTxt.toLowerCase() && d.id_zona === zonaId);
        if (!divObj) {
            const nuevoIdDiv = Math.max(...divisiones.map(d => d.id_division || 0), 0) + 1;
            divObj = { id: generarId(), id_division: nuevoIdDiv, nombre_division: localidadTxt, id_zona: zonaId, tipo: true };
            await fetch(`${API_BASE}/division_territorial`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(divObj) });
        }

        // Código postal
        let cpObj = cps.find(c => c.codigo === cpTxt);
        if (!cpObj) {
            const nuevoIdCPNum = Math.max(...cps.map(c => c.id_cp || 0), 0) + 1;
            cpObj = { id: generarId(), id_cp: nuevoIdCPNum, codigo: cpTxt, id_division: divObj.id_division };
            await fetch(`${API_BASE}/codigo_postal`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(cpObj) });
        }

        // Se generan los nuevos valores correspondientes
        const nuevoIdNum = Math.max(...personas.map(p => p.id_persona || 0), ...direcciones.map(d => d.id_direccion || 0), 0) + 1;
        const numColab = colaboradores.length + 600;
        const nuevoCodColab = "A" + numColab.toString().padStart(4, '0');

        // Se crea cada uno de los objetos que se guardan en cada zona de la base de datos
        const personaObj = {
            id: generarId(),
            id_persona: nuevoIdNum,
            nombre_completo: getVal('nuevo-contacto-nombre'),
            email: getVal('nuevo-contacto-email') || null,
            telefono: getVal('nuevo-contacto-tel') || null
        };

        const direccionObj = {
            id: generarId(),
            id_direccion: nuevoIdNum,
            tipo_via: getVal('nuevo-tipo-via') || null,
            nombre_via: getVal('nuevo-direccion-via'),
            numero: getVal('nuevo-direccion-num') || "s/n",
            id_cp: cpObj.id_cp
        };

        const colaboradorObj = {
            id: generarId(),
            id_colaborador: nuevoCodColab,
            nombre_colaborador: getVal('nuevo-nombre'),
            id_direccion: nuevoIdNum,
            observaciones: getVal('nuevo-observaciones') || null
        };

        const relacionObj = {
            id: generarId(),
            id_colaborador: nuevoCodColab,
            id_contacto: nuevoIdNum,
            es_principal: true
        };

        await Promise.all([
            fetch(`${API_BASE}/persona`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(personaObj) }),
            fetch(`${API_BASE}/direccion`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(direccionObj) }),
            fetch(`${API_BASE}/colaborador`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(colaboradorObj) }),
            fetch(`${API_BASE}/contacto_colaborador`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(relacionObj) })
        ]);

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error. Revisa que json-server esté encendido.");
    } finally {
        btnSubmit.disabled = false;
    }
}