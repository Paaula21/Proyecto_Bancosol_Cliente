// ----- CONFIGURACIÓN INICIAL -----
const API_BASE = 'http://localhost:3000';

let colaboradoresGlobal = [];
let colaboradorSeleccionadoId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosColaboradores();

    document.getElementById('btn-filter').addEventListener('click', aplicarFiltros);
    document.getElementById('input-search').addEventListener('input', aplicarFiltros);

    const btnAnadir = document.getElementById('btn-abrir-registro');
    if (btnAnadir) {
        btnAnadir.addEventListener('click', () => {
            // Cambia 'NuevoColaborador.html' por 'AnadirColaborador.html' si renombraste el archivo
            window.location.href = 'AnadirColaborador.html'; 
        });
    }

    const tbodyColaboradores = document.getElementById('tabla-colaboradores');

    if (tbodyColaboradores) {

        tbodyColaboradores.addEventListener('click', (e) => {
            
            const filaClicada = e.target.closest('tr');
            
            if (!filaClicada) return;

            const todasLasFilas = tbodyColaboradores.querySelectorAll('tr');
            todasLasFilas.forEach(fila => fila.classList.remove('selected'));

            filaClicada.classList.add('selected');
        });
    }
});

// ----- OBTENER Y PROCESAR DATOS DE LA DB -----
async function cargarDatosColaboradores() {
    try {
        const [resColab, resZonas, resDirs, resCP, resDivs, resRelContacto, resPersonas] = await Promise.all([
            fetch(`${API_BASE}/colaborador`),
            fetch(`${API_BASE}/zona_geografica`),
            fetch(`${API_BASE}/direccion`),
            fetch(`${API_BASE}/codigo_postal`),
            fetch(`${API_BASE}/division_territorial`),
            fetch(`${API_BASE}/contacto_colaborador`),
            fetch(`${API_BASE}/persona`)
        ]);

        const colaboradores = await resColab.json();
        const zonas = await resZonas.json();
        const direcciones = await resDirs.json();
        const cps = await resCP.json();
        const divisiones = await resDivs.json();
        const relaciones = await resRelContacto.json();
        const personas = await resPersonas.json();

        // Rellenar selector de zonas en el filtro
        const selectZona = document.getElementById('filter-zona');
        zonas.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id_zona;
            opt.textContent = z.nombre_zona;
            selectZona.appendChild(opt);
        });

        // Mapear colaboradores con sus relaciones de dirección y contacto
        colaboradoresGlobal = colaboradores.map(colab => {
            // Ubicación
            const dir = direcciones.find(d => d.id_direccion === colab.id_direccion);
            const cp = dir ? cps.find(c => c.id_cp === dir.id_cp) : null;
            const div = cp ? divisiones.find(d => d.id_division === cp.id_division) : null;
            const zona = div ? zonas.find(z => z.id_zona === div.id_zona) : null;

            // Persona de Contacto
            const relacion = relaciones.find(r => r.id_colaborador === colab.id_colaborador && r.es_principal === true);
            const persona = relacion ? personas.find(p => p.id_persona === relacion.id_contacto) : null;

            return {
                ...colab,
                id_zona: zona ? zona.id_zona : null,
                nombre_zona: zona ? zona.nombre_zona : "Sin Zona",
                localidad: div ? div.nombre_division : "Desconocida",
                contacto_principal: persona ? persona.nombre_completo : "Sin asignar",
                contacto_correo: persona ? (persona.email || "No disponible") : "No disponible",
                contacto_telefono: persona ? persona.telefono : null,
                contacto_cargo: persona ? (persona.observacion || "Representante") : "Representante",
                obj_direccion: dir,
                obj_cp: cp
            };
        });

        mostrarColaboradores(colaboradoresGlobal);
        actualizarContador(colaboradoresGlobal.length);

    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// ----- LÓGICA DE FILTRADO -----
function aplicarFiltros() {
    const valZona = document.getElementById('filter-zona').value;
    const valSearch = document.getElementById('input-search').value.toLowerCase().trim();

    const filtrados = colaboradoresGlobal.filter(c => {
        const cumpleZona = (valZona === 'Todas' || c.id_zona == valZona);

        const cumpleTexto = c.nombre_colaborador.toLowerCase().includes(valSearch) ||
            c.id_colaborador.toLowerCase().includes(valSearch);

        return cumpleZona && cumpleTexto;
    });

    mostrarColaboradores(filtrados);
    actualizarContador(filtrados.length);
}

// ----- RENDERIZADO DE TABLA -----
function mostrarColaboradores(lista) {
    const tbody = document.getElementById('tabla-colaboradores');
    tbody.innerHTML = '';

    lista.forEach(colaborador => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => mostrarDetalle(colaborador);

        tr.innerHTML = `
            <td><strong>${colaborador.nombre_colaborador}</strong><br><small>${colaborador.id_colaborador}</small></td>
            <td>${colaborador.localidad}</td>
            <td>${colaborador.nombre_zona}</td> 
            <td>${colaborador.contacto_principal}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarContador(total) {
    document.getElementById('contador-colaboradores').textContent = `${total} colaboradores encontrados`;
}

// ----- PANEL DE DETALLES (Derecha) -----
async function mostrarDetalle(c) {

    colaboradorSeleccionadoId = c.id;

    document.getElementById('estado-vacio').style.display = 'none';
    document.getElementById('datos-colaborador').style.display = 'block';

    document.getElementById('ficha-nombre').textContent = c.nombre_colaborador;
    document.getElementById('ficha-codigo').textContent = `Código: ${c.id_colaborador}`;
    document.getElementById('ficha-zona').textContent = c.nombre_zona;

    document.getElementById('ficha-contacto-nombre').textContent = c.contacto_principal;

    // --- LÓGICA EMAIL ---
    const linkEmail = document.getElementById('ficha-contacto-email');
    linkEmail.textContent = c.contacto_correo;
    linkEmail.href = c.contacto_correo !== "No disponible" ? `mailto:${c.contacto_correo}` : "#";

    // --- LÓGICA TELÉFONO ---
    const contenedorTel = document.getElementById('contenedor-tel');
    const linkTel = document.getElementById('ficha-contacto-tel');

    if (c.contacto_telefono && c.contacto_telefono.trim() !== "") {
        contenedorTel.style.display = "block";
        linkTel.textContent = c.contacto_telefono;
        linkTel.href = `tel:${c.contacto_telefono}`;
    } else {
        contenedorTel.style.display = "none";
    }

    // --- LÓGICA DIRECCIÓN ---
    if (c.obj_direccion) {
        const d = c.obj_direccion;
        let via = d.nombre_via || "";
        let numeroStr = "";

        if (d.numero) {
            numeroStr = `, ${d.numero}`;
        } else {
            // Solo añadir s/n si el nombre de la vía no lo contiene ya
            if (!via.toLowerCase().includes("s/n")) {
                numeroStr = ", s/n";
            }
        }

        document.getElementById('ficha-direccion').textContent = `${d.tipo_via || ''} ${via}${numeroStr}`;
        document.getElementById('ficha-localidad').textContent = `${c.localidad} (${c.obj_cp ? c.obj_cp.codigo : ''})`;
    }
    // --- LÓGICA BOTON ELIMINAR ---

    document.addEventListener('click', async function (e) {

        if (e.target && e.target.id === 'btn-eliminar-colaborador') {
            e.preventDefault();

            if (!colaboradorSeleccionadoId) {
                alert("Error: No se ha seleccionado ningún colaborador.");
                return;
            }

            document.getElementById('overlay-eliminar').classList.add('active');
            document.getElementById('popup-eliminar').classList.add('active');
        }

        if (e.target && e.target.id === 'btn-cancelar-eliminar') {
            e.preventDefault();
            document.getElementById('overlay-eliminar').classList.remove('active');
            document.getElementById('popup-eliminar').classList.remove('active');
        }

        if (e.target && e.target.id === 'btn-confirmar-eliminar') {
            e.preventDefault();

            const btnConfirmar = e.target;
            const textoOriginal = btnConfirmar.textContent;

            try {
                btnConfirmar.textContent = "Eliminando...";
                btnConfirmar.disabled = true;

                const urlEliminar = `${API_BASE}/colaborador/${colaboradorSeleccionadoId}`;

                const response = await fetch(urlEliminar, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                document.getElementById('overlay-eliminar').classList.remove('active');
                document.getElementById('popup-eliminar').classList.remove('active');

                document.getElementById('estado-vacio').style.display = 'block';
                document.getElementById('datos-colaborador').style.display = 'none';

                colaboradorSeleccionadoId = null;

                await cargarDatosColaboradores();

                alert("Colaborador eliminado con éxito");

            } catch (error) {
                console.error("Error al intentar eliminar el colaborador:", error);
                alert("No se pudo eliminar el colaborador. Asegúrate de que el cambio a 'id' se guardó correctamente en db.json.");
            } finally {
                btnConfirmar.textContent = textoOriginal;
                btnConfirmar.disabled = false;
            }
        }
    });
}