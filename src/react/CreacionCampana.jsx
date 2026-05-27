import React, { useState } from 'react';

export default function CrearCampana() {
    // 1. Creamos la memoria (Estado) para cada campo del formulario
    const [nombre, setNombre] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estado, setEstado] = useState('Planificada'); // Valor inicial por defecto

    // Lista de supermercados disponibles para el formulario
    const listaCadenas = ['Mercadona', 'Carrefour', 'Dia', 'Eroski', 'Lidl'];

    // Memoria para saber qué supermercados ha seleccionado el usuario
    const [cadenasSeleccionadas, setCadenasSeleccionadas] = useState([]);

    // Función que se ejecuta cuando el usuario marca o desmarca un supermercado
    const manejarCheckbox = (cadena) => {
        if (cadenasSeleccionadas.includes(cadena)) {
            // Si ya estaba seleccionado, lo quitamos de la lista
            setCadenasSeleccionadas(cadenasSeleccionadas.filter(item => item !== cadena));
        } else {
            // Si no estaba, lo añadimos a la lista
            setCadenasSeleccionadas([...cadenasSeleccionadas, cadena]);
        }
    };

    // Función que se ejecuta al pulsar el botón de enviar el formulario
    const enviarFormulario = (e) => {
        e.preventDefault(); // Evita que la página se recargue por completo

        // Aquí ya tienes todos los datos juntos listos para usar
        const nuevaCampana = {
            nombre: nombre,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            estado: estado,
            cadenas: cadenasSeleccionadas
        };

        console.log('Datos de la nueva campaña listos para guardar:', nuevaCampana);
    };

    return (
        <div id="create-campaign-container" className="datos-colaborador">
            <h3 className="ficha-titulo-principal">Crear Campaña</h3>

            <form id="form-create-campaign" onSubmit={enviarFormulario}>

                {/* Campo: Nombre de la campaña */}
                <div className="ficha-tarjeta-info tarjeta-cabecera-edit">
                    <h5>Nombre de la campaña</h5>
                    <input
                        type="text"
                        id="name-campanya"
                        className="input-ficha-lateral input-nombre-principal"
                        required
                        placeholder="ej., Campaña de Verano"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>

                {/* Campos: Fechas */}
                <div className="ficha-tarjeta-info">
                    <h5>Fechas</h5>
                    <div className="campo-formulario-ficha">
                        <label htmlFor="initial-date"><strong>Fecha de Inicio:</strong></label>
                        <input
                            type="date"
                            id="initial-date"
                            className="input-ficha-lateral"
                            required
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>
                    <div className="campo-formulario-ficha">
                        <label htmlFor="final-date"><strong>Fecha de Fin:</strong></label>
                        <input
                            type="date"
                            id="final-date"
                            className="input-ficha-lateral"
                            required
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>
                </div>

                {/* Campo: Estado */}
                <div className="ficha-tarjeta-info">
                    <h5>Estado</h5>
                    <div className="campo-formulario-ficha">
                        <label htmlFor="status"><strong>Estado inicial:</strong></label>
                        <select
                            id="status"
                            className="select-ficha-lateral"
                            required
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="Planificada">Planificada</option>
                            <option value="Activa">Activa</option>
                            <option value="Completada">Completada</option>
                            <option value="Finalizada">Finalizada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>
                </div>

                {/* Campo: Cadenas Participantes creadas dinámicamente */}
                <div className="ficha-tarjeta-info sin-margen-inferior">
                    <h5>Cadenas Participantes</h5>
                    <p className="checkbox-section-title" style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>
                        Seleccione las cadenas:
                    </p>
                    <div className="checkbox-list" id="checkbox-list">
                        {listaCadenas.map((cadena) => (
                            <div key={cadena} className="opcion-checkbox">
                                <input
                                    type="checkbox"
                                    id={`cadena-${cadena}`}
                                    checked={cadenasSeleccionadas.includes(cadena)}
                                    onChange={() => manejarCheckbox(cadena)}
                                />
                                <label htmlFor={`cadena-${cadena}`} style={{ marginLeft: '5px' }}>
                                    {cadena}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Añadimos un botón para activar el envío */}
                <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-guardar">Crear Campaña</button>
                </div>
            </form>
        </div>
    );
}