import React, { useState, useEffect, useContext } from 'react';
import {UserContext} from './ContextoUsuario';
export default function Perfil() {
    const API_BASE = 'http://localhost:3000';

    const {usuario} = useContext(UserContext);
    const [passwords, setPasswords] = useState({
        actual: '',
        nueva: '',
        confirmacion: ''
    });

    const roles = {
        '1' : 'Administrador',
        '2' : 'Coordinador',
        '3' : 'Colaborador'
    }

    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    useEffect(() => {
    // Script para incluir el sidebar y header como htmls separados
    const scriptExiste = document.querySelector('script[src="/javascript/IncludeHTML.js"]');
    //Se añade en el caso de que anteriormente no se haya incluido. Se evitan errores
    if (!scriptExiste) {
        const script = document.createElement('script');
        script.src = '/javascript/IncludeHTML.js';
        document.head.appendChild(script);
    }
}, []);

    //Para los cambios de contraseña
    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };
    //Para guardar la contraseña en la base de datos
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        
        // Caso en el que las contraseñas no coinciden
        if (passwords.nueva !== passwords.confirmacion) {
            setMensaje({ texto: 'Las contraseñas nuevas no coinciden.', tipo: 'error' });
            return;
        }
        //Caso en el que la contraseña no tiene más de 8 caracteres
        if (passwords.nueva.length < 8) { 
            setMensaje({ texto: 'La nueva contraseña debe tener al menos 8 caracteres.', tipo: 'error' });
            return;
        }

        try {
            const urlUsuario = `${API_BASE}/usuario/${usuario.id}`;
            const response = await fetch(urlUsuario, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contrasenia: passwords.nueva
                })
            });

            if (response.ok) {
                setMensaje({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
                setPasswords({ actual: '', nueva: '', confirmacion: '' });
            } else {
                const errorData = await response.text();
                setMensaje({ texto: errorData || 'La contraseña actual no es correcta.', tipo: 'error' });
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
        }
    };
    return (
        <div className="app-container">

            <div className="right-content" >

                {/* CONTENIDO PRINCIPAL */}
                <main className="content-wrapper" >

                    <div className='content'>

                        <h3 className='title'>
                            Información del Perfil
                        </h3>

                        {/* Datos del perfil */}
                        <div className='data-perfil'>
                            <div className='data-item'>
                                <label className='label-name'>Nombre</label>
                                <input type="text" readOnly value={usuario.nombre} className='input' />
                            </div>
                            <div className='data-item'>
                                <label className='label-name'>Rol en el sistema</label>
                                <input type="text" readOnly value={roles[usuario.rol] || 'Desconocido'} className='input' />
                            </div>
                        </div>
                    </div>
                    <div className='content'>
                        {/* Sección de actualización de contraseña */}
                        <h3 className='title'>
                            Contraseña
                        </h3>

                        <form onSubmit={handleSubmit} className='form'>
                            
                            <div className='table-data'>
                                <div className='data-item'>
                                    <label className='label-name'>Contraseña actual</label>
                                    <input
                                        className='input'
                                        type="password"
                                        name="actual"
                                        required
                                        value={passwords.actual}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className='data-item'>
                                    <label className='label-name'>Nueva contraseña</label>
                                    <input
                                        className='input'
                                        type="password"
                                        name="nueva"
                                        required
                                        value={passwords.nueva}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className='data-item'>
                                    <label className='label-name'>Confirmar nueva contraseña</label>
                                    <input
                                        className='input'
                                        type="password"
                                        name="confirmacion"
                                        required
                                        value={passwords.confirmacion}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                {mensaje.texto && (
                    <div style={{ 
                        color: mensaje.tipo === 'error' ? 'red' : 'green', 
                        marginBottom: '15px',
                        fontWeight: 'bold'
                    }}>
                        {mensaje.texto}
                    </div>
                )}
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>

                    </div>
                </main>
            </div>
        </div>
    );
}