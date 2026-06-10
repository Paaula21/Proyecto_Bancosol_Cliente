import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Perfil from './react/PerfilUsuario'; 
import { UserProvider } from './react/ContextoUsuario'; 
import Sidebar from './react/Sidebar'; 
import Header from './react/Header';
import Notificaciones from './react/Notificaciones';
import AsignacionTurnosFinal from './react/AsignacionTurnosFinal';
import Historial from './react/Historial';
import AnadirCampana from './react/AnadirCampana';
import PaginaIncidencias from './react/PaginaIncidencias';
import DashboardColaborador from './react/DashboardColaborador'; 
import CampanaColaborador from './react/CampanaColaborador';


import './App.css';

export default function App() {

    // Leemos la sesión antes de que React dibuje nada en pantalla.
    const rolUsuario = sessionStorage.getItem('id_rol');

    // Si no hay rol, el usuario NO ha iniciado sesión.
    if (!rolUsuario) {
        // Lo redirigimos a tu página de Login original
        window.location.href = '/html/Login.html';
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
                                
                                {/* 
                                   RUTA DASHBOARD DINÁMICA:
                                   Si es el rol '3' (Colaborador), pinta el componente React.
                                   Si no, pinta el iframe de Administrador.html (que sirve para admin y coordinador).
                                */}
                                <Route path="/dashboard" element={
                                    rolUsuario === '3' 
                                        ? <DashboardColaborador /> 
                                        : <iframe 
                                            src="/html/Administrador.html" 
                                            className="content-iframe"
                                            title="Dashboard"
                                          />
                                } />

                                <Route path="/campanas" element={
                                    rolUsuario === '3' 
                                        ? <CampanaColaborador /> 
                                        : <iframe 
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

                                <Route path="/historial" element={<Historial />} />

                                <Route path="/crear-campana" element={<AnadirCampana />} />

                                <Route path="/incidencias" element={<PaginaIncidencias />} />

                                <Route path="/notificaciones" element={<Notificaciones />} />
                                
                            </Routes>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        </UserProvider>
    );
}