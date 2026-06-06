import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Perfil from './react/PerfilUsuario'; 
import { UserProvider } from './react/ContextoUsuario'; 
import Sidebar from './react/Sidebar'; 
import Header from './react/Header';

export default function App() {
    return (
        <UserProvider>
            <BrowserRouter>
                {/* Aseguramos que el contenedor ocupe toda la pantalla */}
                <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                    
                    <Sidebar />
                    
                    {/*flex-direction: column para apilar el Header y las páginas */
                    /*flexGrow: 1 para que el contenedor se estire y deje espacio en la pantalla */}
                    <div className="main-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>                        
                        
                        <Header />

                        {/* Contenedor dinámico que ocupará el espacio sobrante debajo del Header */}
                        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Routes>
                                <Route path="/perfil" element={<Perfil />} />
                                
                                {/* RUTAS DEL MENÚ CON IFRAMES */}
                                <Route path="/campanas" element={
                                    <iframe 
                                        src="/html/Campana.html" 
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title="Campañas"
                                    />
                                } />

                                <Route path="/dashboard" element={
                                    <iframe 
                                        src="/html/Administrador.html" 
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title="Dashboard"
                                    />
                                } />
                                
                                {/* Añade los demás igual... */}
                                
                                {/* Ruta de la nueva ventana de notificaciones */}
                                <Route path="/notificaciones" element={
                                    <div style={{ padding: '20px' }}>
                                        <h2>Tus Notificaciones</h2>
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