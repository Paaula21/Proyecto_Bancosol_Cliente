import React, { useState, useEffect } from 'react';
import { useDashboardColaborador } from './useDashboardColaborador';

// Subcomponente visual para animar cada barra de progreso de las zonas
const ZoneBar = ({ zona, index, maxTiendas }) => {
    const [width, setWidth] = useState(0);
    const targetWidth = Math.round((zona.tiendas / maxTiendas) * 100);

    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(targetWidth);
        }, 100 + index * 80);
        return () => clearTimeout(timer);
    }, [targetWidth, index]);

    return (
        <div className="shops-item">
            <div className="shop-labels">
                <span>{zona.nombre_zona}</span>
                <span>{zona.tiendas} tiendas</span>
            </div>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${width}%` }}></div>
            </div>
        </div>
    );
};

export default function DashboardColaborador() {
    // LLAMAMOS AL HOOK PARA OBTENER LOS DATOS
    const { stats, campanas, zonas, cargando } = useDashboardColaborador();

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '';
        const partes = fechaISO.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${partes[2]} ${meses[parseInt(partes[1]) - 1]} ${partes[0]}`;
    };

    const maxTiendas = zonas[0]?.tiendas || 1;

    // Si aún está haciendo las peticiones a la DB, mostramos esto
    if (cargando) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando el dashboard...</div>;
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <link rel="stylesheet" href="/css/Administrador.css" />
            
            <main className="dashboard-container" style={{ padding: '24px 32px' }}>
                
                {/* TARJETAS DE RESUMEN */}
                <section className="grid">
                    <div className="card">
                        <h3>Campañas Activas</h3>
                        <div className="card" id="stat-campaigns-value">{stats.campanas}</div>
                        <p className="card" id="stat-campaigns-subtitle">{stats.nombres}</p>
                    </div>
                    <div className="card">
                        <h3>Tiendas Totales</h3>
                        <div className="card" id="stat-stores-value">{stats.tiendas}</div>
                        <p className="card" id="stat-stores-subtitle">En {stats.zonasCount} zonas geográficas</p>
                    </div>
                    <div className="card">
                        <h3>Colaboradores</h3>
                        <div className="card" id="stat-collaborators-value">{stats.colaboradores}</div>
                        <p className="card" id="stat-collaborators-subtitle">Entidades y organizaciones</p>
                    </div>
                    <div className="card">
                        <h3>Coordinadores</h3>
                        <div className="card" id="stat-coordinators-value">{stats.coordinadores}</div>
                        <p className="card" id="stat-coordinators-subtitle">Activos en campaña</p>
                    </div>
                </section>

                <section className="dashboard-middle">
                    
                    {/* PRÓXIMAS CAMPAÑAS */}
                    <div className="upcoming-campaigns">
                        <div className="header-upcoming-campaigns">
                            <div>
                                <h2>Próximas Campañas</h2>
                                <p>Campañas programadas</p>
                            </div>
                        </div>
                        <div className="campaign-container">
                            {campanas.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No hay campañas próximas.</p>
                            ) : (
                                campanas.map(campana => (
                                    <div key={campana.id_campana} className="campaign-item">
                                        <div className="campaign-info">
                                            <h4>{campana.nombre_campana}</h4>
                                            <span>{formatearFecha(campana.fecha_inicio)} - {formatearFecha(campana.fecha_fin)}</span>
                                        </div>
                                        <div className="campaign-stats">
                                            <div className="stat">
                                                <strong>{campana.estado}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COBERTURA POR ZONA */}
                    <div className="zone-coverage panel">
                        <div className="panel-header">
                            <h2>Cobertura por Zona</h2>
                            <p>Número de tiendas por zona</p>
                        </div>
                        <div className="shops-list">
                            {zonas.map((zona, idx) => (
                                <ZoneBar key={zona.id_zona} zona={zona} index={idx} maxTiendas={maxTiendas} />
                            ))}
                        </div>
                    </div>
                    
                </section>
            </main>
        </div>
    );
}