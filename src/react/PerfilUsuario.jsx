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


    // Valores del header añadidos en el sidebar
    const timer = setTimeout(() => {
        const enlacePerfil = document.querySelector('a[href="/perfil"]');
        
        if (enlacePerfil) {
            const tituloDinamico = enlacePerfil.getAttribute('data-titulo');
            const subtituloDinamico = enlacePerfil.getAttribute('data-subtitulo');

            const headerTitulo = document.querySelector('.main-header h1, #header-titulo');
            const headerSubtitulo = document.querySelector('.main-header p, #header-subtitulo');

            if (headerTitulo && tituloDinamico) {
                headerTitulo.textContent = tituloDinamico;
            }
            if (headerSubtitulo && subtituloDinamico) {
                headerSubtitulo.textContent = subtituloDinamico;
            }
        }
    }, 150);

    return () => clearTimeout(timer);
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
//Falta refactorizar el css en un archivo aparte
    return (
        <div className="main-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* SIDEBAR */}
            <aside className="sidebar">
                <include-html src="/html/Sidebar.html"></include-html>
            </aside>

            <div className="right-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* HEADER */}
                <header className="main-header">
                    <include-html src="/html/Header.html"></include-html>
                </header>

                {/* CONTENIDO PRINCIPAL */}
                <main className="dashboard-container" style={{ backgroundColor: '#f5f7f9', padding: '32px', boxSizing: 'border-box', width: '100%' }}>

                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '32px', width: '100%', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                        <h3 style={{ marginTop: 0, fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
                            Información del Perfil
                        </h3>

                        {/* Datos del perfil */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Nombre</label>
                                <input type="text" readOnly value="J.M. Cobos" style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#6b7280', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Rol en el sistema</label>
                                <input type="text" readOnly value="Administrador" style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#6b7280', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Correo Electrónico</label>
                                <input type="email" readOnly value="admin@bancosol.org" style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#6b7280', outline: 'none' }} />
                            </div>
                        </div>
                        {/* Sección de actualización de contraseña */}
                        <h3 style={{ marginTop: 0, fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
                            Contraseña
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                            Actualice su contraseña de acceso a la plataforma
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                    <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Contraseña actual</label>
                                    <input
                                        type="password"
                                        name="actual"
                                        required
                                        style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', maxWidth: '500px' }}
                                        value={passwords.actual}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Nueva contraseña</label>
                                    <input
                                        type="password"
                                        name="nueva"
                                        required
                                        style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                                        value={passwords.nueva}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>Confirmar nueva contraseña</label>
                                    <input
                                        type="password"
                                        name="confirmacion"
                                        required
                                        style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                                        value={passwords.confirmacion}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', marginTop: '10px' }}>
                                <button
                                    type="submit"
                                    style={{ padding: '10px 24px', backgroundColor: '#420098', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background-color 0.2s' }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#2d006b'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#420098'}
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