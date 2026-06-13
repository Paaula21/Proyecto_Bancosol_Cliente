import React, { useState, useEffect } from 'react';
import { useNotificaciones } from './useNotificaciones'; // IMPORTAMOS EL HOOK DE LAS NOTIFICACIONES


export default function FormularioIncidencias({ idCampana, contexto = 'campana', onClose }) {
    const { enviarNotificacion } = useNotificaciones(); // INICIALIZAMOS EL HOOK DE NOTIFICACIONES
    const [estadoFormulario, setEstadoFormulario] = useState('escribiendo');
    const [error, setError] = useState(null);
    const [mostrarPopupConfirmacion, setMostrarPopupConfirmacion] = useState(false);
    const [campanas, setCampanas] = useState([]);
    const [cadenas, setCadenas] = useState([]);
    const [cadenasFiltradas, setCadenasFiltradas] = useState([]);
    const [formData, setFormData] = useState({
        rol: 'Coordinador',
        nombre_persona: '',
        id_campana: idCampana || '',
        id_cadena: '',
        tienda: '',
        turno_dia: 'Lunes',
        turno_franja: 'Mañana',
        urgencia: 'Media',
        descripcion: ''
    });

    useEffect(() => {
        fetch('http://localhost:3000/campana')
            .then(r => r.json())
            .then(data => setCampanas(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch('http://localhost:3000/cadena')
            .then(r => r.json())
            .then(data => setCadenas(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!formData.id_campana) {
            setCadenasFiltradas([]);
            return;
        }
        fetch(`http://localhost:3000/campana_cadena?id_campana=${formData.id_campana}`)
            .then(r => r.json())
            .then(data => {
                const ids = data.map(cc => cc.id_cadena);
                setCadenasFiltradas(cadenas.filter(c => ids.includes(c.id_cadena)));
            })
            .catch(() => setCadenasFiltradas([]));
    }, [formData.id_campana, cadenas]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUrgenciaClick = (valor) => {
        setFormData(prev => ({ ...prev, urgencia: valor }));
    };

    const handleConfirmarGuardado = async () => {
        setMostrarPopupConfirmacion(false);
        setError(null);
        setEstadoFormulario('enviando');

        try {
            // 1. Guardamos la incidencia
            const resIncidencia = await fetch('http://localhost:3000/incidencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fecha_creacion: new Date().toISOString()
                })
            });

            if (!resIncidencia.ok) throw new Error('Error al registrar la incidencia');

            let nuevoIdNotificacion = 1;
            try {
                const resNotifsActuales = await fetch('http://localhost:3000/notificacion');
                if (resNotifsActuales.ok) {
                    const notifsActuales = await resNotifsActuales.json();
                    if (notifsActuales.length > 0) {
                        nuevoIdNotificacion = Math.max(...notifsActuales.map(n => n.id_notificacion)) + 1;
                    }
                }
            } catch (_) {}

            const idPersonaRaw = sessionStorage.getItem('id_usuario');
            const idPersonaDestino = idPersonaRaw ? parseInt(idPersonaRaw, 10) : null;

            const campanaObj = campanas.find(c => c.id_campana === formData.id_campana);
            const nombreCampana = campanaObj?.nombre_campana || null;
            const titulo = nombreCampana ? `Incidencia en ${nombreCampana}` : 'Incidencia';

            const cadenaObj = cadenas.find(c => c.id_cadena === formData.id_cadena);
            const nombreCadena = (cadenaObj?.nombre_cadena) || null;

            const tienda = formData.tienda?.trim() || null;
            const descripcion = formData.descripcion?.trim() || null;

            const mensajeTexto = [
                `Cadena: ${nombreCadena ?? ''}`,
                tienda && `Tienda: ${tienda}`,
                `Turno: ${formData.turno_dia} ${formData.turno_franja}`,
                `Urgencia: ${formData.urgencia}`,
                descripcion && `Descripción: ${descripcion}`
            ].filter(Boolean).join('\n');

            const idUnico = Math.random().toString(36).substring(2, 13);

            const notificacionObj = {
                id_notificacion: nuevoIdNotificacion,
                id_persona_destino: idPersonaDestino,
                id_tipo: 'INCIDENCIA',
                titulo: titulo,
                mensaje: mensajeTexto,
                leida: false,
                fecha_creacion: new Date().toISOString(),
                fecha_envio_programado: null,
                id_asignacion_ref: null,
                id: idUnico
            };

            const resNotif = await fetch('http://localhost:3000/notificacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificacionObj)
            });

            if (!resNotif.ok) {
                console.warn('La incidencia se guardó pero no se pudo crear la notificación.');
            }

            onClose();
        } catch (err) {
            setError(err.message);
            setEstadoFormulario('escribiendo');
        }
    };

    const urgencias = [
        { value: 'Baja', label: 'Baja' },
        { value: 'Media', label: 'Media' },
        { value: 'Alta', label: 'Alta' }
    ];

    return (
        <>
            <div className="form-card-scroll">
                <div className="datos-colaborador">
                    <h3 className="ficha-titulo-principal">Registro de Incidencias</h3>
                    <form id="form-incidencias" onSubmit={(e) => { e.preventDefault(); setMostrarPopupConfirmacion(true); }}>

                        <div className="ficha-tarjeta-info">
                            <h5>Rol del usuario <span className="asterisco-rojo">*</span></h5>
                            <div className="campo-formulario-ficha">
                                <select name="rol" className="select-ficha-lateral" required
                                    value={formData.rol} onChange={handleChange}>
                                    <option value="Coordinador">Coordinador</option>
                                    <option value="Voluntario">Voluntario</option>
                                    <option value="Responsable de tienda">Responsable de tienda</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Nombre de la persona <span className="asterisco-rojo">*</span></h5>
                            <div className="campo-formulario-ficha">
                                <input type="text" name="nombre_persona" className="input-ficha-lateral"
                                    required minLength={2} placeholder="Nombre y apellidos"
                                    value={formData.nombre_persona} onChange={handleChange} />
                            </div>
                        </div>

                        {contexto === 'campana' && (
                            <div className="ficha-tarjeta-info">
                                <h5>Campaña <span className="asterisco-rojo">*</span></h5>
                                <div className="campo-formulario-ficha">
                                    <select name="id_campana" className="select-ficha-lateral" required
                                        value={formData.id_campana} onChange={handleChange}>
                                        <option value="">Seleccionar campaña</option>
                                        {campanas.map(c => (
                                            <option key={c.id_campana} value={c.id_campana}>
                                                {c.nombre_campana}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="ficha-tarjeta-info">
                            <h5>Cadena</h5>
                            <div className="campo-formulario-ficha">
                                <select name="id_cadena" className="select-ficha-lateral"
                                    value={formData.id_cadena} onChange={handleChange}>
                                    <option value="">Seleccionar cadena</option>
                                    {cadenasFiltradas.map(c => (
                                        <option key={c.id_cadena} value={c.id_cadena}>
                                            {c.nombre_cadena}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Tienda</h5>
                            <div className="campo-formulario-ficha">
                                <input type="text" name="tienda" className="input-ficha-lateral"
                                    placeholder="Nombre o ubicación de la tienda"
                                    value={formData.tienda} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Turno</h5>
                            <div className="turno-row">
                                <div className="campo-formulario-ficha turno-column">
                                    <label htmlFor="turno-dia"><strong>Día:</strong></label>
                                    <select id="turno-dia" name="turno_dia" className="select-ficha-lateral"
                                        value={formData.turno_dia} onChange={handleChange}>
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="campo-formulario-ficha turno-column">
                                    <label htmlFor="turno-franja"><strong>Franja:</strong></label>
                                    <select id="turno-franja" name="turno_franja" className="select-ficha-lateral"
                                        value={formData.turno_franja} onChange={handleChange}>
                                        <option value="Mañana">Mañana</option>
                                        <option value="Tarde">Tarde</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Nivel de urgencia <span className="asterisco-rojo">*</span></h5>
                            <div className="urgencia-row">
                                {urgencias.map(u => (
                                    <button key={u.value} type="button"
                                        onClick={() => handleUrgenciaClick(u.value)}
                                        className={`urgencia-btn ${u.value.toLowerCase()} ${formData.urgencia === u.value ? 'selected' : ''}`}>
                                        {u.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Descripción <span className="asterisco-rojo">*</span></h5>
                            <div className="campo-formulario-ficha">
                                <textarea name="descripcion" className="input-ficha-lateral" required
                                    rows={4} placeholder="Describe la incidencia..."
                                    value={formData.descripcion} onChange={handleChange} />
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
            </div>

            <div className="detail-actions-sticky">
                <button type="submit" form="form-incidencias"
                    disabled={estadoFormulario === 'enviando'} className="btn btn--primary">
                    {estadoFormulario === 'enviando' ? 'Enviando...' : 'Registrar incidencia'}
                </button>
                <button type="button" onClick={onClose}
                    disabled={estadoFormulario === 'enviando'} className="btn btn--cancel">
                    Cancelar
                </button>
            </div>

            {mostrarPopupConfirmacion && (
                <div className="overlay active">
                    <div className="popup active">
                        <h3>¿Registrar incidencia?</h3>
                        <p>¿Estás seguro de que deseas guardar esta incidencia?</p>
                        <div className="botones">
                            <button
                                className="btn-add"
                                onClick={handleConfirmarGuardado}
                                disabled={estadoFormulario === 'enviando'}
                            >
                                {estadoFormulario === 'enviando' ? 'Guardando...' : 'Aceptar'}
                            </button>
                            <button
                                className="btn-cerrar-popup"
                                onClick={() => setMostrarPopupConfirmacion(false)}
                                disabled={estadoFormulario === 'enviando'}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
