import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioIncidencias from './FormularioIncidencias';

export default function PaginaIncidencias() {
    const navigate = useNavigate();

    return (
        <>
            <link rel="stylesheet" href="/css/DetalleColaborador.css" />
            <link rel="stylesheet" href="/css/EditarAnadirColaborador.css" />
            <link rel="stylesheet" href="/css/EditarCampana.css" />
            <link rel="stylesheet" href="/css/Common.css" />

            <div className="incidencias-page">
                <div className="form-page-card">
                    <FormularioIncidencias
                        contexto="campana"
                        onClose={() => navigate('/dashboard')}
                    />
                </div>
            </div>
        </>
    );
}
