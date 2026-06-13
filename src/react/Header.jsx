import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { useFetch } from './useFetch'; 
import { UserContext } from './ContextoUsuario';

export default function Header() {
    const [titulo, setTitulo] = useState('Bancosol');
    const [subtitulo, setSubtitulo] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();

    // OBTENEMOS AL USUARIO ACTUAL
    const { usuario } = useContext(UserContext);

    // OBTENEMOS LAS NOTIFICACIONES DE LA BD
    const { datos: notificaciones } = useFetch('http://localhost:3000/notificacion');
    
    // FILTRAMOS NOTIFICACIONES
    const misNotificaciones = notificaciones ? notificaciones.filter(
        notif => String(notif.id_persona_destino) === String(usuario.id_usuario)
    ) : [];

    // COMPROBAMOS SI HAY NOTIFICACIONES SIN LEER PARA MOSTRAR EL AVISO EN EL BOTÓN
    const haySinLeer = misNotificaciones.some(notif => notif.leida === false);

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
            'voluntarios': { t: 'Voluntarios', s: 'Gestión de voluntarios' },
            'historial': { t: 'Historial', s: 'Registro de actividades y eventos pasados' },
            'crear-campana': { t: 'Nueva Campaña', s: 'Completa los datos para crear una nueva campaña' },
            'incidencias': { t: 'Incidencias', s: 'Registro y seguimiento de incidencias de campaña' },
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
                
                <button 
                    className={`btn-notificaciones ${haySinLeer ? 'notificaciones-pendientes' : ''}`} 
                    id="btn-notifications"
                    onClick={() => navigate('/notificaciones')}
                >
                    Notificaciones
                    {haySinLeer && <span className="punto-rojo-aviso"></span>}
                </button>
            </nav>
        </header>
    );
}