import React, { useState, useEffect } from 'react';
import '../Historial.css';

const Historial = () => {
    const [logs, setLogs] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                const response = await fetch('http://localhost:3000/historial');
                if (response.ok) {
                    const data = await response.json();
                    const dataOrdenada = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    setLogs(dataOrdenada);
                }
            } catch (error) {
                console.error("Error al cargar el historial:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchHistorial();
    }, []);

    const getTextoAccion = (log) => {
        const nombre = log.campaignName || 'Campaña';
        switch (log.action) {
            case 'create': return `${nombre} planificada`;
            case 'edit': return `${nombre} modificada`;
            case 'delete': return `${nombre} eliminada`;
            default: return nombre;
        }
    };

    const formatFecha = (isoString) => {
        if (!isoString) return '';
        const fecha = new Date(isoString);
        const fechaTexto = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const horaTexto = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${fechaTexto} a las ${horaTexto}`;
    };

    return (
        <div className="historial-background">
            <div className="historial-container">
                <div className="historial-header">
                    {/* CAMBIO: Nuevo título y el contador ha sido eliminado */}
                    <h2 className="historial-titulo">Registro de Acciones</h2>
                </div>

                {cargando ? (
                    <p className="historial-mensaje">Cargando avisos...</p>
                ) : logs.length === 0 ? (
                    <p className="historial-mensaje">No hay registros de actividad todavía.</p>
                ) : (
                    <ul className="historial-lista">
                        {logs.map((log, index) => (
                            <li key={index} className="historial-item">
                                <div className="historial-info">
                                    <span className="historial-accion">{getTextoAccion(log)}</span>
                                </div>
                                <div className="historial-fecha">
                                    {formatFecha(log.timestamp)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Historial;