//Se genera un id aleatorio para que, en el caso de que se añada una nueva persona de contacto, se guarde con un id nuevo
function generarIdAleatorio() {
    return Math.random().toString(36).substring(2, 13);
}

//Limpia los valores que salen cuando un campo está vacío
function limpiarValor(valor) {
    if (!valor) return '';
    const valLower = valor.toLowerCase().trim();
    const invalidos = ['---', 'sin asignar', 'no disponible', 'sin localidad', 'dirección no disponible'];
    if (invalidos.includes(valLower)) return '';
    return valor.trim();
}

document.addEventListener('click', async function(e) {
    
    // Ocultamos la tabla en el caso que se seleccione otro colaborador
    const filaTabla = e.target.closest('#tabla-colaboradores tr');
    if (filaTabla) {
        const formEditar = document.getElementById('formulario-editar-colaborador');
        if (formEditar) formEditar.style.display = 'none';
    }

    // Al pulsar editar colaborador
    const btnEditar = e.target.closest('#btn-editar-colaborador');
    if (btnEditar) {
        e.preventDefault();
        
        if (!colaboradorSeleccionadoId) {
            const fichaCodigoTxt = document.getElementById('ficha-codigo').textContent;
            if (fichaCodigoTxt && fichaCodigoTxt !== '---') {
                colaboradorSeleccionadoId = fichaCodigoTxt.replace('Código: ', '').trim();
            }
        }

        if (!colaboradorSeleccionadoId) {
            document.getElementById('texto-error-popup').textContent = "Error: No se ha podido identificar el colaborador seleccionado.";
            document.getElementById('overlay-error').classList.add('active');
            document.getElementById('popup-error').classList.add('active');
            return;
        }

        const colab = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId);
        
        // Valores actuales del colaborador
        const nombreFicha = document.getElementById('ficha-nombre').textContent;
        const personaFicha = document.getElementById('ficha-contacto-nombre').textContent;
        const emailFicha = document.getElementById('ficha-contacto-email').textContent;
        const telFicha = document.getElementById('ficha-contacto-tel').textContent;
        const direccionFicha = document.getElementById('ficha-direccion').textContent;
        const localidadFicha = document.getElementById('ficha-localidad').textContent;

        document.getElementById('edit-nombre').value = limpiarValor((colab && colab.nombre_colaborador) ? colab.nombre_colaborador : nombreFicha);
        if (colab && colab.id_zona) document.getElementById('edit-zona').value = colab.id_zona;
        
        document.getElementById('edit-contacto-nombre').value = limpiarValor((colab && colab.contacto_principal) ? colab.contacto_principal : personaFicha);
        document.getElementById('edit-contacto-email').value = limpiarValor((colab && colab.contacto_correo) ? colab.contacto_correo : emailFicha);
        document.getElementById('edit-contacto-tel').value = limpiarValor((colab && colab.contacto_telefono) ? colab.contacto_telefono : telFicha);
        
        let viaPrevia = '';
        let numPrevio = '';
        if (colab && colab.obj_direccion) {
            viaPrevia = colab.obj_direccion.nombre_via || '';
            numPrevio = colab.obj_direccion.numero || '';
        } else if (direccionFicha && direccionFicha !== '---' && direccionFicha !== 'Dirección no disponible') {
            const partesDir = direccionFicha.split(',');
            viaPrevia = partesDir[0];
            numPrevio = partesDir[1] || '';
        }
        document.getElementById('edit-direccion-via').value = limpiarValor(viaPrevia);
        document.getElementById('edit-direccion-num').value = limpiarValor(numPrevio);
        document.getElementById('edit-localidad').value = limpiarValor((colab && colab.localidad) ? colab.localidad : localidadFicha.split('(')[0]);
        
        document.getElementById('datos-colaborador').style.display = 'none';
        document.getElementById('formulario-editar-colaborador').style.display = 'block';
    }
    // Boton cancelar
    const btnCancelar = e.target.closest('#btn-cancelar-edicion');
    if (btnCancelar) {
        e.preventDefault();
        document.getElementById('formulario-editar-colaborador').style.display = 'none';
        document.getElementById('datos-colaborador').style.display = 'block';
    }
    
    if (e.target && e.target.id === 'btn-aceptar-exito') {
        e.preventDefault();
        
        document.getElementById('overlay-exito').classList.remove('active');
        document.getElementById('popup-exito').classList.remove('active');

        await cargarDatosColaboradores();
        document.getElementById('formulario-editar-colaborador').style.display = 'none';
        
        const colabActualizado = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId);
        if (colabActualizado) {
            mostrarDetalle(colabActualizado);
        } else {
            document.getElementById('estado-vacio').style.display = 'block';
        }
    }

    if (e.target && e.target.id === 'btn-aceptar-error') {
        e.preventDefault();
        document.getElementById('overlay-error').classList.remove('active');
        document.getElementById('popup-error').classList.remove('active');
    }
});

// Guardar datos editados
document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'form-edicion-colaborador') {
        e.preventDefault();
        
        const btnGuardar = document.getElementById('btn-guardar-cambios');
        const textoOriginal = btnGuardar.textContent;

        try {
            btnGuardar.textContent = "Guardando...";
            btnGuardar.disabled = true;

            const colabOriginal = colaboradoresGlobal.find(c => c.id == colaboradorSeleccionadoId || c.id_colaborador == colaboradorSeleccionadoId) || {};
            
            const nombreInput = document.getElementById('edit-nombre').value.trim();
            const nombreContactoInput = document.getElementById('edit-contacto-nombre').value.trim();
            const emailContactoInput = document.getElementById('edit-contacto-email').value.trim();
            const telContactoInput = document.getElementById('edit-contacto-tel').value.trim();
            const direccionViaInput = document.getElementById('edit-direccion-via').value.trim();
            const direccionNumInput = document.getElementById('edit-direccion-num').value.trim();

            // Se guarda la dirección
            if (colabOriginal.id_direccion) {
                const resDir = await fetch(`${API_BASE}/direccion?id_direccion=${colabOriginal.id_direccion}`);
                const dirs = await resDir.json();
                if (dirs.length > 0) {
                    const dirObj = dirs[0];
                    const dirActualizada = {
                        id: dirObj.id,
                        id_direccion: dirObj.id_direccion,
                        tipo_via: dirObj.tipo_via !== undefined ? dirObj.tipo_via : null,
                        nombre_via: direccionViaInput, 
                        numero: direccionNumInput || null,
                        id_cp: dirObj.id_cp
                    };
                    await fetch(`${API_BASE}/direccion/${dirObj.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dirActualizada)
                    });
                }
            }

            // Se guarda el contacto 
            const resRel = await fetch(`${API_BASE}/contacto_colaborador?id_colaborador=${colabOriginal.id_colaborador}`);
            const rels = await resRel.json();
            const relacionPrincipal = rels.find(r => r.es_principal === true);

            if (relacionPrincipal) {
                const resPers = await fetch(`${API_BASE}/persona?id_persona=${relacionPrincipal.id_contacto}`);
                const personasEncontradas = await resPers.json();
                if (personasEncontradas.length > 0) {
                    const personaObj = personasEncontradas[0];
                    const personaActualizada = {
                        id: personaObj.id,
                        id_persona: personaObj.id_persona,
                        nombre_completo: nombreContactoInput, 
                        telefono: telContactoInput || null, 
                        email: emailContactoInput || null, 
                        observacion: personaObj.observacion !== undefined ? personaObj.observacion : null
                    };
                    await fetch(`${API_BASE}/persona/${personaObj.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(personaActualizada)
                    });
                }
                // Si no había contacto, se crea una nueva
            } else if (nombreContactoInput !== '') {
                const resAllPers = await fetch(`${API_BASE}/persona`);
                const todasPersonas = await resAllPers.json();
                let maxIdPersona = 0;
                todasPersonas.forEach(p => {
                    if (p.id_persona > maxIdPersona) maxIdPersona = p.id_persona;
                });
                const nuevoIdPersona = maxIdPersona + 1;

                const nuevaPersona = {
                    id_persona: nuevoIdPersona,
                    nombre_completo: nombreContactoInput,
                    telefono: telContactoInput || null,
                    email: emailContactoInput || null,
                    observacion: null,
                    id: generarIdAleatorio()
                };

                await fetch(`${API_BASE}/persona`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevaPersona)
                });

                const nuevaRelacion = {
                    id: generarIdAleatorio(),
                    id_colaborador: colabOriginal.id_colaborador,
                    id_contacto: nuevoIdPersona,
                    es_principal: true
                };

                await fetch(`${API_BASE}/contacto_colaborador`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevaRelacion)
                });
            }

            // Se actualizan los datos del colaborador
            const datosColaborador = {
                id: colabOriginal.id || colaboradorSeleccionadoId,
                id_colaborador: colabOriginal.id_colaborador,
                nombre_colaborador: nombreInput,
                observaciones: colabOriginal.observaciones !== undefined ? colabOriginal.observaciones : null,
                id_direccion: colabOriginal.id_direccion
            };

            const response = await fetch(`${API_BASE}/colaborador/${datosColaborador.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosColaborador)
            });

            if (!response.ok) throw new Error("Error en la respuesta del servidor");

            document.getElementById('overlay-exito').classList.add('active');
            document.getElementById('popup-exito').classList.add('active');

        } catch (error) {
            console.error("Error al intentar editar el colaborador:", error);
            document.getElementById('texto-error-popup').textContent = "No se pudieron guardar los cambios. Revisa la consola y db.json.";
            document.getElementById('overlay-error').classList.add('active');
            document.getElementById('popup-error').classList.add('active');
        } finally {
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
        }
    }
});