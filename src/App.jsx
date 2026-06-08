import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Perfil from './react/PerfilUsuario'; 
import { UserProvider } from './react/ContextoUsuario'; 
import Sidebar from './react/Sidebar'; 
import Header from './react/Header';
import Notificaciones from './react/Notificaciones';
import AsignacionTurnosFinal from './react/AsignacionTurnosFinal';
import './App.css';

export default function App() {

    // Leemos la sesión antes de que React dibuje nada en pantalla.
    const rolUsuario = sessionStorage.getItem('id_rol');

    // Si no hay rol (o es 0), el usuario NO ha iniciado sesión.
    if (!rolUsuario || rolUsuario === '0') {
        // Lo redirigimos a tu página de Login original
        window.location.href = '/html/Login.html';
        
        // Devolvemos 'null' para que React no pinte el menú de "Invitado"
        // mientras el navegador cambia de página.
        return null; 
    }

    return (
        <UserProvider>
            <BrowserRouter>
                <div className="app-container">
                    
                    <Sidebar />
                    
                    <div className="main-content">                        
                        
                        <Header />

                        <div className="routes-container">
                            <Routes>
                                {/* RUTA DE PERFIL */}
                                <Route path="/perfil" element={<Perfil />} />
                                
                                {/* RUTAS DEL MENÚ CON IFRAMES */}
                                <Route path="/dashboard" element={
                                    <iframe 
                                        src="/html/Administrador.html" 
                                        className="content-iframe"
                                        title="Dashboard"
                                    />
                                } />

                                <Route path="/campanas" element={
                                    <iframe 
                                        src="/html/Campana.html" 
                                        className="content-iframe"
                                        title="Campañas"
                                    />
                                } />

                                <Route path="/cadenas" element={
                                    <iframe 
                                        src="/html/InformacionCadena.html" 
                                        className="content-iframe"
                                        title="Cadenas"
                                    />
                                } />

                                <Route path="/tiendas" element={
                                    <iframe 
                                        src="/html/InformacionTienda.html" 
                                        className="content-iframe"
                                        title="Tiendas"
                                    />
                                } />

                                <Route path="/colaboradores" element={
                                    <iframe 
                                        src="/html/Colaboradores.html" 
                                        className="content-iframe"
                                        title="Colaboradores"
                                    />
                                } />

                                <Route path="/voluntarios" element={
                                    <iframe 
                                        src="/html/AsignacionTurnos.html"
                                        className="content-iframe"
                                        title="Voluntarios"
                                    />
                                } />

                                <Route path="/gestion-final-turnos" element={<AsignacionTurnosFinal />} />

                                <Route path="/notificaciones" element={<Notificaciones />} />
                                
                            </Routes>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        </UserProvider>
    );
}