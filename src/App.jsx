import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Perfil from './react/PerfilUsuario'; 

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas para cada uno de los archivos jsx */}
                <Route path="/perfil" element={<Perfil />} />
            </Routes>
        </BrowserRouter>
    );
}