import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Perfil from './react/PerfilUsuario'; 
import { UserProvider } from './react/ContextoUsuario'; 
import Sidebar from './react/Sidebar'; 
import Header from './react/Header';
import Notificaciones from './react/Notificaciones';
import './App.css';

export default function App() {
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

                                <Route path="/notificaciones" element={<Notificaciones />} />
                                
                                {/* RUTAS PENDIENTES DE IMPLEMENTAR */}
                                <Route path="/configuracion" element={
                                    <div>
                                        <h2>Configuración</h2>
                                        <p>Por implementar.</p>
                                    </div>
                                } />
                                
                            </Routes>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        </UserProvider>
    );
}