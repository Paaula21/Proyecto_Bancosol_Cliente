import React, { useContext } from 'react';
import { UserContext } from './ContextoUsuario'; 
import { Link, useLocation } from 'react-router-dom'; // IMPORTANTE: Importamos useLocation para saber en qué ruta estamos y marcar el menú activo

export default function Sidebar() {
    const { usuario } = useContext(UserContext);
    
    // Obtenemos la ruta actual del navegador (ej: "/campanas", "/perfil", etc.)
    const location = useLocation();

    const rolesTexto = {
        '1': 'Administrador',
        '2': 'Coordinador',
        '3': 'Colaborador'
    };
    const rolTexto = rolesTexto[usuario.rol] || 'Desconocido';

    let rutaDashboard = '/dashboard';

    // Función auxiliar: Si la URL actual incluye la ruta que le pasamos, devuelve la clase 'active'
    const verificarActivo = (ruta) => {
        return location.pathname.includes(ruta) ? 'active' : '';
    };

    return (
        <aside className="sidebar">
            {/* Si entras al perfil, también se puede marcar como activo si quisieras */}
            <Link to="/perfil" className="enlace-perfil" data-titulo="Perfil de usuario" data-subtitulo="Ajustes del usuario">
                <div className="user-block">
                    <div className="avatar avatar-jc">{usuario.nombre.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{usuario.nombre}</p>
                        <p className="user-role">{rolTexto}</p>
                    </div>
                </div>
            </Link>

            <h2 className="menu-heading">MENÚ PRINCIPAL</h2>
            <ul id="menu">
                {/* Le asignamos dinámicamente la clase con nuestra función verificarActivo */}
                <li id="dashboard" className={verificarActivo('dashboard')}>
                    <Link to={rutaDashboard}>Dashboard</Link>
                </li>

                {(usuario.rol === '1' || usuario.rol === '2') && (
                    <>
                        <li id="campana" className={verificarActivo('/campanas')}>
                            <Link to="/campanas">Campañas</Link>
                        </li>
                        <li id="cadena" className={verificarActivo('/cadenas')}>
                            <Link to="/cadenas">Cadenas</Link>
                        </li>
                        <li id="voluntarios" className={verificarActivo('/voluntarios')}>
                            <Link to="/voluntarios">Voluntarios</Link>
                        </li>
                    </>
                )}

                {usuario.rol === '1' && (
                    <>
                        <li id="establecimientos" className={verificarActivo('/tiendas')}>
                            <Link to="/tiendas">Tiendas</Link>
                        </li>
                        <li id="colaboradores" className={verificarActivo('/colaboradores')}>
                            <Link to="/colaboradores">Colaboradores</Link>
                        </li>
                    </>
                )}
            </ul>

            <div className="bottom-menu">
                <ul>
                    <li id="btn-logout">
                        <a href="#cerrar-sesion" onClick={(e) => {
                            e.preventDefault();
                            sessionStorage.clear();
                            window.location.href = '../html/Login.html';
                        }}>
                            Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
        </aside>
    );
}