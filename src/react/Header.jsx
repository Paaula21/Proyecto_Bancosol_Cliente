import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // IMPORTANTE: Importamos useNavigate

export default function Header() {
    const [titulo, setTitulo] = useState('Bancosol');
    const [subtitulo, setSubtitulo] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate(); // Iniciamos la función de navegación

    useEffect(() => {
        const rutaActual = location.pathname.split('/').pop();

        if (rutaActual.includes("RegistroVoluntarios")) {
            setTitulo("Registro de Voluntarios");
            setSubtitulo("Complete los siguientes campos");
            return;
        }

        if (rutaActual.includes("EditarVoluntario")) {
            setTitulo("Editar Voluntario");
            setSubtitulo("Modifique los datos personales y la disponibilidad del voluntario");
            return;
        }

        if (rutaActual.includes("gestion-final-turnos")) {
            setTitulo("Asignación de turnos");
            setSubtitulo("Control y asignación de voluntarios");
        }

        const titulosMenu = {
            'dashboard': { t: 'Dashboard', s: 'Resumen general de los datos' },
            'campanas': { t: 'Campañas', s: 'Gestión y planificación de campañas activas' },
            'cadenas': { t: 'Cadenas', s: 'Administración de cadenas de supermercados' },
            'tiendas': { t: 'Tiendas', s: 'Gestión de establecimientos participantes' },
            'colaboradores': { t: 'Colaboradores', s: 'Gestión de entidades colaboradoras y voluntarios' },
            'perfil': { t: 'Perfil de usuario', s: 'Ajustes del usuario' },
            'notificaciones': { t: 'Notificaciones', s: 'Bandeja de avisos y alertas' },
            'voluntarios': { t: 'Voluntarios', s: 'Gestión de voluntarios' }
        };

        const info = titulosMenu[rutaActual];
        if (info) {
            setTitulo(info.t);
            setSubtitulo(info.s);
        }
    }, [location.pathname]);

    return (
        <header className="main-header">
            <nav>
                <link rel="stylesheet" href="/css/Header.css" />

                <div className="header-branding">
                    <img src="/images/icono.png" alt="Bancosol" className="header-logo" />
                    <div className="header-titles">
                        <h1 id="dynamic-header-title">{titulo}</h1>
                        <p id="dynamic-header-subtitle">{subtitulo}</p>
                    </div>
                </div>
                
                {/* Al hacer clic, le decimos a React que navegue a la nueva pantalla */}
                <button 
                    className="btn-notificaciones" 
                    id="btn-notifications"
                    onClick={() => navigate('/notificaciones')}
                >
                    Notificaciones
                </button>
            </nav>
        </header>
    );
}