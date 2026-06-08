import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnadirCampana() {
    const navigate = useNavigate();
    const [cadenasDisponibles, setCadenas] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [mostrarPopupExito, setMostrarPopupExito] = useState(false);
    const [formData, setFormData] = useState({
        nombre_campana: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'Planificada',
        cadenasSeleccionadas: []
    });

    useEffect(() => {
        fetch('http://localhost:3000/cadena')
            .then(r => r.json())
            .then(data => setCadenas(data))
            .catch(() => setError('Error al cargar las cadenas'));
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCheckboxCadena = (idCadena) => {
        setFormData(prev => ({
            ...prev,
            cadenasSeleccionadas: prev.cadenasSeleccionadas.includes(idCadena)
                ? prev.cadenasSeleccionadas.filter(id => id !== idCadena)
                : [...prev.cadenasSeleccionadas, idCadena]
        }));
    };

    const generarIdCampana = (nombre) => {
        const slug = nombre.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
        const year = new Date().getFullYear();
        return slug + year;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setEnviando(true);

        try {
            const idCampana = generarIdCampana(formData.nombre_campana);

            const res = await fetch('http://localhost:3000/campana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_campana: idCampana,
                    nombre_campana: formData.nombre_campana,
                    fecha_inicio: formData.fecha_inicio,
                    fecha_fin: formData.fecha_fin,
                    estado: formData.estado
                })
            });

            if (!res.ok) throw new Error('Error al crear la campaña');

            for (const idCadena of formData.cadenasSeleccionadas) {
                const resCadena = await fetch('http://localhost:3000/campana_cadena', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_campana: idCampana, id_cadena: idCadena })
                });
                if (!resCadena.ok) throw new Error('Error al asociar cadena');
            }

            setMostrarPopupExito(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    const handleClose = () => navigate('/campanas');

    const handleAceptarExito = () => {
        setMostrarPopupExito(false);
        navigate('/campanas');
    };

    return (
        <>
            <div className="crear-campana-page">
                <div className="form-page-card">
                    <div className="form-card-scroll">
                        <div className="datos-colaborador">
                            <h3 className="ficha-titulo-principal">Crear Campaña</h3>
                            <form id="form-create-campaign" onSubmit={handleSubmit}>

                                <div className="ficha-tarjeta-info tarjeta-cabecera-edit">
                                    <h5>Nombre de la campaña</h5>
                                    <input type="text" name="nombre_campana"
                                        className="input-ficha-lateral input-nombre-principal"
                                        required placeholder="ej., Campaña de Verano"
                                        value={formData.nombre_campana} onChange={handleChange} />
                                </div>

                                <div className="ficha-tarjeta-info">
                                    <h5>Fechas</h5>
                                    <div className="campo-formulario-ficha">
                                        <label htmlFor="create-fecha-inicio"><strong>Fecha de Inicio:</strong></label>
                                        <input type="date" id="create-fecha-inicio" name="fecha_inicio"
                                            className="input-ficha-lateral" required
                                            value={formData.fecha_inicio} onChange={handleChange} />
                                    </div>
                                    <div className="campo-formulario-ficha">
                                        <label htmlFor="create-fecha-fin"><strong>Fecha de Fin:</strong></label>
                                        <input type="date" id="create-fecha-fin" name="fecha_fin"
                                            className="input-ficha-lateral" required
                                            value={formData.fecha_fin} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="ficha-tarjeta-info">
                                    <h5>Estado</h5>
                                    <div className="campo-formulario-ficha">
                                        <label htmlFor="create-estado"><strong>Estado inicial:</strong></label>
                                        <select id="create-estado" name="estado"
                                            className="select-ficha-lateral" required
                                            value={formData.estado} onChange={handleChange}>
                                            <option value="Planificada">Planificada</option>
                                            <option value="Activa">Activa</option>
                                            <option value="Completada">Completada</option>
                                            <option value="Finalizada">Finalizada</option>
                                            <option value="Cancelada">Cancelada</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="ficha-tarjeta-info sin-margen-inferior">
                                    <h5>Cadenas Participantes</h5>
                                    <div className="checkbox-list">
                                        {cadenasDisponibles.map(cadena => (
                                            <div key={cadena.id_cadena} className="cadena-item">
                                                <input type="checkbox" id={'create-cadena-' + cadena.id_cadena}
                                                    checked={formData.cadenasSeleccionadas.includes(cadena.id_cadena)}
                                                    onChange={() => handleCheckboxCadena(cadena.id_cadena)} />
                                                <label htmlFor={'create-cadena-' + cadena.id_cadena}>
                                                    {cadena.nombre_cadena}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && <p className="error-message">{error}</p>}
                            </form>
                        </div>
                    </div>

                    <div className="detail-actions-sticky">
                        <button type="submit" form="form-create-campaign"
                            disabled={enviando} className="btn btn--primary">
                            {enviando ? 'Creando...' : 'Crear Campaña'}
                        </button>
                        <button type="button" onClick={handleClose}
                            disabled={enviando} className="btn btn--cancel">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            {mostrarPopupExito && (
                <div className="overlay active">
                    <div className="popup active">
                        <h3>¡Campaña creada!</h3>
                        <p>La campaña ha sido creada con éxito.</p>
                        <div className="botones">
                            <button
                                className="btn-add"
                                onClick={handleAceptarExito}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
