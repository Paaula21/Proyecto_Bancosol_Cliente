import React, { useState } from 'react';
import { useCampanasColaborador } from './useCampanasColaborador';

export default function CampanaColaborador() {
    const { campanas, cadenas, cargando } = useCampanasColaborador();
    
    // Estados para lo que el usuario escribe/selecciona en los inputs
    const [inputEstado, setInputEstado] = useState('Todos');
    const [inputBuscar, setInputBuscar] = useState('');

    // Estados para los filtros que se aplican a la tabla
    const [filtros, setFiltros] = useState({ estado: 'Todos', buscar: '' });
    
    // Estados para el detalle de la campaña seleccionada
    const [campanaSel, setCampanaSel] = useState(null);
    const [cadenasParticipantes, setCadenasParticipantes] = useState([]);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // --- FUNCIÓN PARA APLICAR FILTROS ---
    const aplicarFiltros = () => {
        setFiltros({ estado: inputEstado, buscar: inputBuscar });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const campanasFiltradas = campanas.filter(c => {
        const cumpleEstado = filtros.estado === 'Todos' || 
            (c.estado && c.estado.toLowerCase() === filtros.estado.toLowerCase());
            
        const cumpleBusqueda = !filtros.buscar || 
            (c.nombre_campana && c.nombre_campana.toLowerCase().includes(filtros.buscar.toLowerCase())) ||
            (c.id_campana && c.id_campana.toLowerCase().includes(filtros.buscar.toLowerCase()));
            
        return cumpleEstado && cumpleBusqueda;
    });

    // --- FORMATEO DE FECHAS ---
    const formatearFecha = (fechaString) => {
        if (!fechaString) return '-';
        try {
            const fecha = new Date(fechaString);
            if (isNaN(fecha.getTime())) return fechaString;
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            return `${dia}/${mes}/${fecha.getFullYear()}`;
        } catch (e) {
            return fechaString;
        }
    };

    // --- SELECCIONAR CAMPAÑA PARA VER DETALLE ---
    const handleSeleccionar = async (campana) => {
        setCampanaSel(campana);
        setCargandoDetalle(true);
        try {
            const res = await fetch(`http://localhost:3000/campana_cadena?id_campana=${encodeURIComponent(campana.id_campana)}`);
            const relaciones = await res.json();
            
            const nombresCadenas = relaciones.map(rel => {
                const cadenaDb = cadenas.find(cad => cad.id_cadena === rel.id_cadena);
                return cadenaDb ? cadenaDb.nombre_cadena : rel.id_cadena;
            });
            setCadenasParticipantes(nombresCadenas);
        } catch (e) {
            console.error("Error al cargar cadenas", e);
            setCadenasParticipantes([]);
        } finally {
            setCargandoDetalle(false);
        }
    };

    if (cargando) {
        return <div>Cargando campañas...</div>;
    }

    return (
        <div className="main-container" style={{ height: '100%', overflowY: 'hidden' }}>
            <link rel="stylesheet" href="/css/Campana.css" />
            <link rel="stylesheet" href="/css/DetalleColaborador.css" />
            <link rel="stylesheet" href="/css/Common.css" />

            <main className="campana-container" style={{ height: '100%', padding: '24px 32px' }}>
                
                {/* FILTROS SUPERIORES */}
                <section className="filters">
                    <div className="filter-group">
                        <label>Estado</label>
                        <select 
                            value={inputEstado} 
                            onChange={(e) => setInputEstado(e.target.value)}
                        >
                            <option value="Todos">Todos</option>
                            <option value="Planificada">Planificada</option>
                            <option value="Activa">Activa</option>
                            <option value="Finalizada">Finalizada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Buscar</label>
                        <input 
                            type="text" 
                            placeholder="Nombre de campaña..." 
                            value={inputBuscar}
                            onChange={(e) => setInputBuscar(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {/* BOTÓN FILTRAR */}
                    <div className="filter-button">
                        <button type="button" id="btn-filter" onClick={aplicarFiltros}>
                            Filtrar
                        </button>
                    </div>
                </section>

                <div className="content-wrapper">
                    
                    {/* LISTA DE CAMPAÑAS */}
                    <section className="list-container">
                        <header className="list-header">
                            <h2>Listado de Campañas</h2>
                            <p>{campanasFiltradas.length} campañas encontradas</p>
                        </header>

                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Campaña</th>
                                        <th>Fecha de Inicio</th>
                                        <th>Fecha de Fin</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campanasFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="mensaje-vacio">No se encontraron campañas con los filtros actuales.</td>
                                        </tr>
                                    ) : (
                                        campanasFiltradas.map((campana) => {
                                            const estadoClase = campana.estado ? campana.estado.toLowerCase().replace(' ', '-') : 'planificada';
                                            const estaSeleccionada = campanaSel?.id_campana === campana.id_campana;

                                            return (
                                                <tr 
                                                    key={campana.id} 
                                                    className={estaSeleccionada ? 'selected' : ''}
                                                    onClick={() => handleSeleccionar(campana)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>
                                                        <strong>{campana.nombre_campana || 'Sin nombre'}</strong>
                                                        <br/>
                                                        <small>{campana.id_campana}</small>
                                                    </td>
                                                    <td>{formatearFecha(campana.fecha_inicio)}</td>
                                                    <td>{formatearFecha(campana.fecha_fin)}</td>
                                                    <td>
                                                        <span className={`estado-badge estado-${estadoClase}`}>
                                                            {campana.estado || 'Planificada'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn-edit" 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Evitamos que seleccione la fila al hacer clic en el botón
                                                                window.location.href = `/html/AsignaciónTurnosTienda.html?id_campana=${encodeURIComponent(campana.id_campana)}`;
                                                            }}
                                                        >
                                                            Añadir turnos
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* PANEL DE DETALLES DERECHO */}
                    <aside className="detail-panel">
                        <div className="detail-content">
                            {!campanaSel ? (
                                <div className="estado-vacio" style={{ marginTop: '50px' }}>
                                    <h3>Detalle de la Campaña</h3>
                                    <p>Haz clic en una campaña de la lista para ver sus detalles.</p>
                                </div>
                            ) : (
                                <div className="datos-colaborador">
                                    <h3 className="ficha-titulo-principal">Ficha de la Campaña</h3>

                                    <div className="ficha-cabecera">
                                        <div className="ficha-titulos">
                                            <h4 className="ficha-nombre">{campanaSel.nombre_campana}</h4>
                                            <span className="ficha-etiqueta-codigo">ID: {campanaSel.id_campana}</span>
                                        </div>
                                    </div>

                                    <div className="ficha-tarjeta-info">
                                        <h5>Fechas</h5>
                                        <p><strong>Fecha de Inicio:</strong> <span>{formatearFecha(campanaSel.fecha_inicio)}</span></p>
                                        <p><strong>Fecha de Fin:</strong> <span>{formatearFecha(campanaSel.fecha_fin)}</span></p>
                                    </div>

                                    <div className="ficha-tarjeta-info">
                                        <h5>Estado</h5>
                                        <p>
                                            <span className={`estado-badge estado-${campanaSel.estado ? campanaSel.estado.toLowerCase().replace(' ', '-') : 'planificada'}`}>
                                                {campanaSel.estado}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="ficha-tarjeta-info sin-margen-inferior">
                                        <h5>Cadenas Participantes</h5>
                                        {cargandoDetalle ? (
                                            <p>Cargando cadenas...</p>
                                        ) : (
                                            <ul className="lista-cadenas-detalle">
                                                {cadenasParticipantes.length === 0 ? (
                                                    <li>No hay cadenas participantes</li>
                                                ) : (
                                                    cadenasParticipantes.map((cadena, idx) => (
                                                        <li key={idx}>{cadena}</li>
                                                    ))
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                </div>
            </main>
        </div>
    );
}