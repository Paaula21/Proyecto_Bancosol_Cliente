import React, { useState, useEffect } from 'react';

export default function FormularioIncidencias({ idCampana, contexto = 'campana', onClose }) {
    const [estadoFormulario, setEstadoFormulario] = useState('escribiendo');
    const [error, setError] = useState(null);
    const [campanas, setCampanas] = useState([]);
    const [cadenas, setCadenas] = useState([]);
    const [formData, setFormData] = useState({
        rol: 'Coordinador',
        nombre_persona: '',
        id_campana: idCampana || '',
        id_cadena: '',
        tienda: '',
        turno_dia: 'Lunes',
        turno_franja: 'Mañana',
        urgencia: 'Media',
        descripcion: '',
        aspectos_positivos: ''
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

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUrgenciaClick = (valor) => {
        setFormData(prev => ({ ...prev, urgencia: valor }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setEstadoFormulario('enviando');

        try {
            const res = await fetch('http://localhost:3000/incidencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fecha_creacion: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error('Error al registrar la incidencia');

            setEstadoFormulario('exito');
        } catch (err) {
            setError(err.message);
            setEstadoFormulario('escribiendo');
        }
    };

    if (estadoFormulario === 'exito') {
        return (
            <div className="form-card-scroll">
                <div className="datos-colaborador" style={{ textAlign: 'center', padding: '24px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        backgroundColor: '#27ae60', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <span style={{ color: '#fff', fontSize: '40px' }}>&#10003;</span>
                    </div>
                    <h3 className="ficha-titulo-principal" style={{ border: 'none' }}>Incidencia registrada</h3>
                    <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                        La incidencia se ha enviado correctamente.
                    </p>
                    <button type="button" onClick={onClose} className="btn btn--primary">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const urgencias = [
        { value: 'Baja', label: 'Baja', color: '#27ae60' },
        { value: 'Media', label: 'Media', color: '#f39c12' },
        { value: 'Alta', label: 'Alta', color: '#e74c3c' }
    ];

    return (
        <>
            <div className="form-card-scroll">
                <div className="datos-colaborador" style={{ padding: '24px' }}>
                    <h3 className="ficha-titulo-principal">Registro de Incidencias</h3>
                    <form id="form-incidencias" onSubmit={handleSubmit}>

                        <div className="ficha-tarjeta-info">
                            <h5>Rol del usuario <span style={{ color: '#e74c3c' }}>*</span></h5>
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
                            <h5>Nombre de la persona <span style={{ color: '#e74c3c' }}>*</span></h5>
                            <div className="campo-formulario-ficha">
                                <input type="text" name="nombre_persona" className="input-ficha-lateral"
                                    required minLength={2} placeholder="Nombre y apellidos"
                                    value={formData.nombre_persona} onChange={handleChange} />
                            </div>
                        </div>

                        {contexto === 'campana' && (
                            <div className="ficha-tarjeta-info">
                                <h5>Campaña <span style={{ color: '#e74c3c' }}>*</span></h5>
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
                                    {cadenas.map(c => (
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
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="campo-formulario-ficha" style={{ flex: 1 }}>
                                    <label htmlFor="turno-dia"><strong>Día:</strong></label>
                                    <select id="turno-dia" name="turno_dia" className="select-ficha-lateral"
                                        value={formData.turno_dia} onChange={handleChange}>
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="campo-formulario-ficha" style={{ flex: 1 }}>
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
                            <h5>Nivel de urgencia <span style={{ color: '#e74c3c' }}>*</span></h5>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {urgencias.map(u => (
                                    <button key={u.value} type="button"
                                        onClick={() => handleUrgenciaClick(u.value)}
                                        style={{
                                            flex: 1, padding: '10px 16px', border: '2px solid',
                                            borderColor: formData.urgencia === u.value ? u.color : '#d1d5db',
                                            borderRadius: '8px', background: formData.urgencia === u.value ? `${u.color}15` : '#fff',
                                            color: formData.urgencia === u.value ? u.color : '#6b7280',
                                            fontWeight: formData.urgencia === u.value ? '700' : '400',
                                            cursor: 'pointer', fontSize: '0.9rem',
                                            transition: 'all 0.15s'
                                        }}>
                                        {u.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info">
                            <h5>Descripción <span style={{ color: '#e74c3c' }}>*</span></h5>
                            <div className="campo-formulario-ficha">
                                <textarea name="descripcion" className="input-ficha-lateral" required
                                    rows={4} placeholder="Describe la incidencia..."
                                    value={formData.descripcion} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="ficha-tarjeta-info sin-margen-inferior">
                            <h5>Aspectos positivos</h5>
                            <div className="campo-formulario-ficha">
                                <textarea name="aspectos_positivos" className="input-ficha-lateral"
                                    rows={3} placeholder="¿Algo que destacar positivamente?"
                                    value={formData.aspectos_positivos} onChange={handleChange} />
                            </div>
                        </div>

                        {error && <p style={{ color: '#e74c3c', fontSize: '0.875rem' }}>{error}</p>}
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
        </>
    );
}
