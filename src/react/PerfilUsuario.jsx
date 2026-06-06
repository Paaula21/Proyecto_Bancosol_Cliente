import React, { useState, useEffect } from 'react';
export default function Perfil() {
    const [passwords, setPasswords] = useState({
        actual: '',
        nueva: '',
        confirmacion: ''
    });

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
    // Hay que gus¡ardarlos en la base de datos (NO FUNCIONAL)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (passwords.nueva !== passwords.confirmacion) {
            alert("Las contraseñas nuevas no coinciden");
            return;
        }
        console.log("Datos a enviar:", passwords);
        alert("Contraseña actualizada con éxito");
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
                                <input type="text" readOnly value="J.M. Cobos" className='input' />
                            </div>
                            <div className='data-item'>
                                <label className='label-name'>Rol en el sistema</label>
                                <input type="text" readOnly value="Administrador" className='input' />
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