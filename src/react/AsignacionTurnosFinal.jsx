import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../AsignacionTurnosFinal.css';

export default function AsignacionTurnosFinal() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [voluntarios, setVoluntarios] = useState([]);
    const [listaTurnos, setListaTurnos] = useState([]);
    const [asignaciones, setAsignaciones] = useState({});
    const [tiendaActual, setTiendaActual] = useState(null);

    const idCampana = searchParams.get('id_campana');
    const idTienda = searchParams.get('id_tienda');

    const diasSemana = [
        { id: 'lunes', nombre: 'Lunes', index: 1 },
        { id: 'martes', nombre: 'Martes', index: 2 },
        { id: 'miercoles', nombre: 'Miércoles', index: 3 },
        { id: 'jueves', nombre: 'Jueves', index: 4 },
        { id: 'viernes', nombre: 'Viernes', index: 5 },
        { id: 'sabado', nombre: 'Sábado', index: 6 },
        { id: 'domingo', nombre: 'Domingo', index: 0 }
    ];

    const RELACION_DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    // Convertidor de fecha ultra-preciso UTC
    const obtenerDiaSemanaSeguro = (fechaStr) => {
        if (!fechaStr) return '';
        try {
            const soloFecha = fechaStr.split('T')[0];
            const partes = soloFecha.split(/[-/]/);
            if (partes.length !== 3) return '';

            let anio = parseInt(partes[0], 10);
            let mes = parseInt(partes[1], 10) - 1;
            let dia = parseInt(partes[2], 10);

            if (partes[0].length !== 4) { // Formato DD/MM/YYYY
                dia = parseInt(partes[0], 10);
                mes = parseInt(partes[1], 10) - 1;
                anio = parseInt(partes[2], 10);
            }

            const dateObj = new Date(Date.UTC(anio, mes, dia, 12, 0, 0));
            return isNaN(dateObj.getTime()) ? '' : RELACION_DIAS[dateObj.getUTCDay()];
        } catch (e) {
            return '';
        }
    };

    // Función auxiliar para calcular la fecha YYYY-MM-DD correspondiente a un día de la semana concreto
    const calcularFechaParaDia = (fechaReferencia, targetDiaId) => {
        try {
            const soloFecha = fechaReferencia.split('T')[0];
            const partes = soloFecha.split(/[-/]/);
            let anio = parseInt(partes[0], 10);
            let mes = parseInt(partes[1], 10) - 1;
            let dia = parseInt(partes[2], 10);

            if (partes[0].length !== 4) {
                dia = parseInt(partes[0], 10);
                mes = parseInt(partes[1], 10) - 1;
                anio = parseInt(partes[2], 10);
            }

            const fechaObj = new Date(Date.UTC(anio, mes, dia, 12, 0, 0));
            const diaSemanaActual = fechaObj.getUTCDay(); // 0-6

            const targetDiaObj = diasSemana.find(d => d.id === targetDiaId);
            const targetIndex = targetDiaObj ? targetDiaObj.index : 1;

            // Calculamos la diferencia de días
            let diferencia = targetIndex - diaSemanaActual;
            fechaObj.setUTCDate(fechaObj.getUTCDate() + diferencia);

            return fechaObj.toISOString().split('T')[0];
        } catch (e) {
            return fechaReferencia.split('T')[0];
        }
    };

    useEffect(() => {
        async function cargarDatos() {
            try {
                if (idTienda) {
                    const resTienda = await fetch(`http://localhost:3000/establecimiento?id_establecimiento=${idTienda}`);
                    const datosTienda = await resTienda.json();
                    if (datosTienda.length > 0) setTiendaActual(datosTienda[0]);
                }

                const resVol = await fetch('http://localhost:3000/voluntario');
                const datosVol = await resVol.json();
                const resPers = await fetch('http://localhost:3000/persona');
                const datosPers = await resPers.json();

                const voluntariosCompletos = datosVol.map(vol => {
                    const persona = datosPers.find(p => String(p.id_persona) === String(vol.id_persona));
                    return { ...vol, nombre_completo: persona?.nombre_completo || 'Voluntario' };
                });
                setVoluntarios(voluntariosCompletos);

                if (idCampana && idTienda) {
                    const resTurnos = await fetch(`http://localhost:3000/asignacion_turno_colaborador`);
                    const todosLosTurnos = await resTurnos.json();

                    const datosTurnos = todosLosTurnos.filter(turno =>
                        String(turno.id_campana) === String(idCampana) &&
                        String(turno.id_tienda) === String(idTienda)
                    );

                    const inicialAsignaciones = {};
                    const turnosProcesados = datosTurnos.map(turno => {
                        const diaCalculado = obtenerDiaSemanaSeguro(turno.fecha);
                        const hora = parseInt(turno.hora_inicio.split(':')[0], 10);
                        const momentoCalculado = hora < 14 ? 'mañana' : 'tarde';

                        const clave = `${diaCalculado}-${momentoCalculado}`;
                        if (turno.id_voluntario !== null && turno.id_voluntario !== undefined && String(turno.id_voluntario) !== "") {
                            inicialAsignaciones[clave] = String(turno.id_voluntario);
                        }

                        return { ...turno, diaCalculado, momentoCalculado };
                    });

                    setListaTurnos(turnosProcesados);
                    setAsignaciones(inicialAsignaciones);
                }
            } catch (error) {
                console.error("Error cargando los datos de la planificación:", error);
            }
        }
        cargarDatos();
    }, [idCampana, idTienda]);

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
            let cambiosRealizados = false;

            // Buscamos cualquier fecha base existente de esta campaña en el JSON para usarla de pivote de calendario
            let fechaPivote = "2025-11-22";
            if (listaTurnos.length > 0) {
                fechaPivote = listaTurnos[0].fecha;
            }

            for (const dia of diasSemana) {
                for (const momento of ['mañana', 'tarde']) {
                    const clave = `${dia.id}-${momento}`;
                    const valNuevo = asignaciones[clave] || "";

                    const turnoExistente = listaTurnos.find(t => t.diaCalculado === dia.id && t.momentoCalculado === momento);

                    if (turnoExistente) {
                        const valOriginal = turnoExistente.id_voluntario !== null && turnoExistente.id_voluntario !== undefined ? String(turnoExistente.id_voluntario) : "";

                        if (valOriginal !== valNuevo) {
                            const idVoluntarioFinal = valNuevo === "" ? null : Number(valNuevo);

                            await fetch(`http://localhost:3000/asignacion_turno_colaborador/${turnoExistente.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_voluntario: idVoluntarioFinal })
                            });
                            cambiosRealizados = true;
                        }
                    } else {
                        if (valNuevo !== "") {
                            const idVoluntarioFinal = Number(valNuevo);
                            // Calculamos dinámicamente la fecha exacta del día seleccionado (Evita guardar un Lunes con fecha de Sábado)
                            const fechaCorrecta = calcularFechaParaDia(fechaPivote, dia.id);

                            const nuevoTurno = {
                                id_campana: idCampana,
                                id_tienda: isNaN(Number(idTienda)) ? idTienda : Number(idTienda),
                                fecha: fechaCorrecta,
                                hora_inicio: momento === 'mañana' ? "09:00:00" : "16:00:00",
                                hora_fin: momento === 'mañana' ? "14:00:00" : "21:00:00",
                                id_voluntario: idVoluntarioFinal
                            };

                            await fetch(`http://localhost:3000/asignacion_turno_colaborador`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(nuevoTurno)
                            });
                            cambiosRealizados = true;
                        }
                    }
                }
            }

            if (cambiosRealizados) {
                // Delay de seguridad de 400ms para asegurar que json-server termine de escribir en el disco duro db.json
                await new Promise(resolve => setTimeout(resolve, 400));
                alert("¡Cuadrante guardado con éxito!");
                navigate(-1);
            } else {
                alert("No se realizaron modificaciones en el cuadrante.");
            }
        } catch (error) {
            console.error("Error crítico en el proceso de guardado:", error);
            alert("Ocurrió un error al intentar guardar los cambios.");
        }
    };

    return (
        <div className="shifts-main-container">
            <div className="list-container">
                <div className="list-header">
                    <h2>Planificación de Turnos {tiendaActual ? `- ${tiendaActual.nombre_resena}` : ''}</h2>
                    {tiendaActual && (
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                            Campaña: <strong>{idCampana}</strong> | ID Tienda: <strong>{idTienda}</strong>
                        </p>
                    )}
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
                                <td>
                                    <select
                                        className="select-turno"
                                        value={asignaciones[`${dia.id}-mañana`] || ""}
                                        onChange={(e) => handleSelectChange(dia.id, 'mañana', e.target.value)}
                                    >
                                        <option value="">Sin asignar</option>
                                        {obtenerVoluntariosDisponibles(dia.id, 'mañana').map(v => (
                                            <option key={v.id_voluntario} value={v.id_voluntario}>
                                                {v.nombre_completo}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className="select-turno"
                                        value={asignaciones[`${dia.id}-tarde`] || ""}
                                        onChange={(e) => handleSelectChange(dia.id, 'tarde', e.target.value)}
                                    >
                                        <option value="">Sin asignar</option>
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

                <div className="popup-actions" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>

                    <button
                        type="button"
                        className="btn--cancel"
                        onClick={() => navigate(-1)}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="btn--primary"
                        onClick={handleGuardar}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}