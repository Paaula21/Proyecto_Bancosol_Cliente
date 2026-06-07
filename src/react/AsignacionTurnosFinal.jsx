import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../AsignacionTurnosFinal.css';

export default function AsignacionTurnosFinal() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [voluntarios, setVoluntarios] = useState([]);
    const [listaTurnos, setListaTurnos] = useState([]);
    const [asignaciones, setAsignaciones] = useState({});

    const diasSemana = [
        { id: 'lunes', nombre: 'Lunes' },
        { id: 'martes', nombre: 'Martes' },
        { id: 'miercoles', nombre: 'Miércoles' },
        { id: 'jueves', nombre: 'Jueves' },
        { id: 'viernes', nombre: 'Viernes' },
        { id: 'sabado', nombre: 'Sábado' },
        { id: 'domingo', nombre: 'Domingo' }
    ];

    const RELACION_DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    // Extracción segura del día de la semana sin alteraciones por la franja horaria UTC
    const obtenerDiaSemanaSeguro = (fechaStr) => {
        if (!fechaStr) return '';
        const partes = fechaStr.split('-');
        if (partes.length !== 3) return '';
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        const dateObj = new Date(anio, mes, dia);
        return RELACION_DIAS[dateObj.getDay()];
    };

    useEffect(() => {
        async function cargarDatos() {
            try {
                const idCampana = searchParams.get('id_campana');
                const idTienda = searchParams.get('id_tienda');

                // 1. Cargar el catálogo completo de voluntarios y personas
                const resVol = await fetch('http://localhost:3000/voluntario');
                const datosVol = await resVol.json();
                const resPers = await fetch('http://localhost:3000/persona');
                const datosPers = await resPers.json();

                const voluntariosCompletos = datosVol.map(vol => {
                    const persona = datosPers.find(p => String(p.id_persona) === String(vol.id_persona));
                    return { ...vol, nombre_completo: persona?.nombre_completo || 'Voluntario' };
                });
                setVoluntarios(voluntariosCompletos);

                // 2. Cargar los turnos directamente filtrados por el backend (Evita errores de filtrado en cliente)
                if (idCampana && idTienda) {
                    const resTurnos = await fetch(`http://localhost:3000/asignacion_turno_colaborador?id_campana=${idCampana}&id_tienda=${idTienda}`);
                    const datosTurnos = await resTurnos.json();

                    const inicialAsignaciones = {};
                    const turnosProcesados = datosTurnos.map(turno => {
                        const diaCalculado = obtenerDiaSemanaSeguro(turno.fecha);
                        const hora = parseInt(turno.hora_inicio.split(':')[0], 10);
                        const momentoCalculado = hora < 14 ? 'mañana' : 'tarde';

                        const clave = `${diaCalculado}-${momentoCalculado}`;
                        if (turno.id_voluntario !== null && turno.id_voluntario !== undefined) {
                            inicialAsignaciones[clave] = String(turno.id_voluntario);
                        }

                        return {
                            ...turno,
                            diaCalculado,
                            momentoCalculado
                        };
                    });

                    setListaTurnos(turnosProcesados);
                    setAsignaciones(inicialAsignaciones);
                }
            } catch (error) {
                console.error("Error cargando los datos de la planificación:", error);
            }
        }
        cargarDatos();
    }, [searchParams]);

    const obtenerVoluntariosDisponibles = (diaId, turno) => {
        const slotBuscado = `${diaId}-${turno}`;
        return voluntarios.filter(vol => vol.preferencia_horario?.toLowerCase().includes(slotBuscado));
    };

    const handleSelectChange = (diaId, turno, volId) => {
        const clave = `${diaId}-${turno}`;
        setAsignaciones(prev => ({ ...prev, [clave]: volId }));
    };

    const handleGuardar = async (e) => {
        e.preventDefault();

        try {
            const promesas = [];

            // Recorremos el array original completo, garantizando que no se salte ningún turno repetido
            listaTurnos.forEach(turno => {
                const clave = `${turno.diaCalculado}-${turno.momentoCalculado}`;
                const volSeleccionadoString = asignaciones[clave] || "";

                let idVoluntarioFinal = null;
                if (volSeleccionadoString !== "") {
                    const volEncontrado = voluntarios.find(v => String(v.id_voluntario) === volSeleccionadoString);
                    idVoluntarioFinal = volEncontrado ? volEncontrado.id_voluntario : volSeleccionadoString;
                }

                // Normalización limpia de valores para evitar fallas entre null, undefined, strings y numbers
                const valOriginal = turno.id_voluntario !== null && turno.id_voluntario !== undefined ? String(turno.id_voluntario) : "";
                const valNuevo = idVoluntarioFinal !== null && idVoluntarioFinal !== undefined ? String(idVoluntarioFinal) : "";

                // Si detectamos un cambio real, disparamos el PATCH apuntando al id único del registro
                if (valOriginal !== valNuevo) {
                    console.log(`[PATCH] Actualizando turno ID: ${turno.id} -> Nuevo voluntario: ${idVoluntarioFinal}`);
                    promesas.push(
                        fetch(`http://localhost:3000/asignacion_turno_colaborador/${turno.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_voluntario: idVoluntarioFinal })
                        })
                    );
                }
            });

            if (promesas.length > 0) {
                await Promise.all(promesas);
                alert("¡Cambios guardados con éxito!");
                navigate(-1);
            } else {
                alert("No se realizaron modificaciones en el cuadrante.");
            }
        } catch (error) {
            console.error("Error crítico guardando los datos:", error);
            alert("No se pudieron guardar los cambios.");
        }
    };

    return (
        <div className="shifts-main-container">
            <div className="list-container">
                <div className="list-header">
                    <h2>Planificación Semanal</h2>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Día</th>
                            <th>Turno Mañana</th>
                            <th>Turno Tarde</th>
                        </tr>
                        </thead>
                        <tbody>
                        {diasSemana.map((dia) => (
                            <tr key={dia.id}>
                                <td style={{ fontWeight: '700' }}>{dia.nombre}</td>

                                {/* Celda Turno Mañana */}
                                <td>
                                    <select
                                        className="select-turno"
                                        value={asignaciones[`${dia.id}-mañana`] || ""}
                                        onChange={(e) => handleSelectChange(dia.id, 'mañana', e.target.value)}
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {obtenerVoluntariosDisponibles(dia.id, 'mañana').map(v => (
                                            <option key={v.id_voluntario} value={v.id_voluntario}>
                                                {v.nombre_completo}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                {/* Celda Turno Tarde */}
                                <td>
                                    <select
                                        className="select-turno"
                                        value={asignaciones[`${dia.id}-tarde`] || ""}
                                        onChange={(e) => handleSelectChange(dia.id, 'tarde', e.target.value)}
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {obtenerVoluntariosDisponibles(dia.id, 'tarde').map(v => (
                                            <option key={v.id_voluntario} value={v.id_voluntario}>
                                                {v.nombre_completo}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="popup-actions">
                    <button type="button" className="btn-cancelar" onClick={() => navigate(-1)}>Cancelar</button>
                    <button type="button" className="btn-confirmar" onClick={handleGuardar}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
}