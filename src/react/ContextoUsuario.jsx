import React, { createContext, useState } from 'react';

// Creamos el contexto
export const UserContext = createContext();

export function UserProvider({ children }) {
    // Al cargar la página de React, leemos lo que el Login en JS dejó en sessionStorage
    const [usuario, setUsuario] = useState({
        id: sessionStorage.getItem('id') || null,
        id_usuario: sessionStorage.getItem('id_usuario') || null,
        nombre: sessionStorage.getItem('username') || null,
        // Siguiendo nuestra lógica implementada en el js y la db: 1=Admin, 2=Coordinador, 3=Colaborador
        rol: sessionStorage.getItem('id_rol') || '0' 
    });

    return (
        <UserContext.Provider value={{ usuario, setUsuario }}>
            {children}
        </UserContext.Provider>
    );
}