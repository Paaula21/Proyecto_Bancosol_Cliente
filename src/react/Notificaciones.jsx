import React, { useState } from 'react';
import { useFetch } from './useFetch'; 

export default function Notificaciones() {
    const { datos: notificacionesBrutas, cargando, eliminarDato } = useFetch('http://localhost:3000/notificacion');
    
    const [seleccionada, setSeleccionada] = useState(null);
    const [leidas, setLeidas] = useState([]);
    const [mostrarPopup, setMostrarPopup] = useState(false);

    const notificaciones = [...notificacionesBrutas].sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    const formatearFecha = (fechaCadena) => {
        const fecha = new Date(fechaCadena);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleSeleccionar = (notif) => {
        setSeleccionada(notif);
        
        if (!notif.leida && !leidas.includes(notif.id)) {
            setLeidas([...leidas, notif.id]);
        }
    };

    const handleConfirmarBorrado = async () => {
        if (!seleccionada) return;

        const exito = await eliminarDato(seleccionada.id);

        if (exito) {
            setSeleccionada(null);
            setMostrarPopup(false);
        } else {
            alert("Hubo un error al borrar la notificación del servidor.");
            setMostrarPopup(false);
        }
    };

    return (
        <>
            <link rel="stylesheet" href="/css/Campana.css" />
            <link rel="stylesheet" href="/css/DetalleColaborador.css" />
            <link rel="stylesheet" href="/css/popUpRegistro.css" />

            <main className="campana-container notificaciones-main">

                <div className="content-wrapper">
                    
                    {/* COLUMNA IZQUIERDA */}
                    <section className="list-container">
                        <header className="list-header">
                            <h2>Listado de Avisos</h2>
                            <p>{cargando ? 'Cargando...' : `Total: ${notificaciones.length} notificaciones`}</p>
                        </header>

                        {cargando ? (
                            <p>Cargando tus notificaciones...</p>
                        ) : notificaciones.length === 0 ? (
                            <div className="mensaje-vacio">
                                <p>No tienes notificaciones nuevas en este momento.</p>
                            </div>
                        ) : (
                            <div className="notificaciones-list">
                                {notificaciones.map((notif) => {
                                    const esLeida = notif.leida || leidas.includes(notif.id);
                                    const estaSeleccionada = seleccionada?.id === notif.id;

                                    return (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleSeleccionar(notif)}
                                            className={`notificacion-item ${estaSeleccionada ? 'selected' : ''} ${!esLeida ? 'unread' : ''}`}
                                        >
                                            <div>
                                                <h4 className="notif-item-title">{notif.titulo}</h4>
                                                <span className="notif-item-type">{notif.id_tipo}</span>
                                            </div>
                                            <div className="notif-item-right">
                                                <span className="notif-item-date">
                                                    {formatearFecha(notif.fecha_creacion).split(',')[0]}
                                                </span>
                                                {!esLeida && (
                                                    <span className="notif-item-new-badge">Nueva</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                    
                    {/* COLUMNA DERECHA */}
                    <aside className="detail-panel" id="detail-panel">
                        <div className="detail-content">
                            
                            {!seleccionada ? (
                                <div className="estado-vacio notif-empty-state">
                                    <h3>Detalle de la Notificación</h3>
                                    <p>Haz clic en una notificación de la lista de la izquierda para leer el mensaje completo.</p>
                                </div>
                            ) : (
                                <div className="datos-colaborador">
                                    <h3 className="ficha-titulo-principal">Mensaje</h3>

                                    <div className="ficha-cabecera">
                                        <div className="ficha-titulos">
                                            <h4 className="ficha-nombre notif-detalle-titulo">
                                                {seleccionada.titulo}
                                            </h4>
                                            <span className="ficha-etiqueta-codigo">
                                                {seleccionada.id_tipo}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="ficha-tarjeta-info">
                                        <h5>Fecha de recepción</h5>
                                        <p>{formatearFecha(seleccionada.fecha_creacion)}</p>
                                    </div>

                                    <div className="ficha-tarjeta-info">
                                        <h5>Contenido</h5>
                                        <p className="notif-detalle-mensaje">
                                            {seleccionada.mensaje}
                                        </p>
                                    </div>

                                    <div className="ficha-acciones">
                                        <button 
                                            className="btn-ficha btn-eliminar"
                                            onClick={() => setMostrarPopup(true)}
                                        >
                                            Borrar notificación
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </aside>
                </div>
            </main>

            {/* POPUP DE CONFIRMACIÓN (Ahora sí, 100% libre de estilos inline) */}
            {mostrarPopup && (
                <div className="overlay active">
                    <div className="popup active">
                        <h3>¿Borrar notificación?</h3>
                        <p className="notif-popup-mensaje">
                            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este mensaje?
                        </p>
                        
                        <div className="botones">
                            <button 
                                className="btn-add btn-confirmar-borrado" 
                                onClick={handleConfirmarBorrado}
                            >
                                Eliminar
                            </button>
                            <button 
                                className="btn-cerrar-popup" 
                                onClick={() => setMostrarPopup(false)}
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