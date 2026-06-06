import React from 'react';

export default function Campanas() {
    return (
        // En React, cuando devolvemos varios elementos (el main y los popups)
        // hay que envolverlos en una etiqueta vacía <> </> (llamada Fragmento)
        <>
            <link rel="stylesheet" href="/css/Campana.css" />
            <link rel="stylesheet" href="/css/popUpRegistro.css" />

            <main className="campana-container">
                <section className="filters">
                    <div className="filter-group" id="estado">
                        <label>Estado</label>
                        <select id="filter-state">
                            <option value="Todos">Todos</option>
                            <option value="Planificada">Planificada</option>
                            <option value="Activa">Activa</option>
                            <option value="Completada">Completada</option>
                            <option value="Finalizada">Finalizada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>

                    <div className="filter-group" id="search">
                        <label>Buscar</label>
                        <input type="text" id="filter-search" placeholder="Nombre de campaña..." />
                    </div>

                    <div className="filter-button">
                        <button type="button" id="btn-filter">Filtrar</button>
                    </div>
                </section>

                <div className="content-wrapper">
                    <section className="list-container">
                        <header className="list-header">
                            <h2>Listado de Campañas</h2>
                            <p id="total-campanas">Cargando campañas...</p>
                            <button type="button" className="btn-add">Añadir campaña</button>
                        </header>

                        <table>
                            <thead>
                                <tr>
                                    <th>Campaña</th>
                                    <th>Fecha de Inicio</th>
                                    <th>Fecha de Fin</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="table-campanas">
                                {/* Más adelante, en clase aprenderéis a rellenar esto con un .map() usando variables de estado */}
                            </tbody>
                        </table>
                    </section>
                    
                    <aside className="detail-panel" id="detail-panel">
                        <div className="detail-content">
                            {/* Aquí pondremos más adelante los componentes <DetalleCampana /> y <EditarCampana /> */}
                            <p style={{ padding: '20px', color: '#666' }}>Selecciona una campaña para ver sus detalles</p>
                        </div>
                        
                        <div className="detail-actions-sticky" id="detail-actions-campaign" style={{ display: 'none' }}>
                            <button type="button" id="btn-edit-campaign" className="btn-ficha btn-editar">
                                Editar Campaña
                            </button>
                            <button type="button" id="btn-delete-campaign" className="btn-ficha btn-eliminar">
                                Eliminar
                            </button>
                        </div>
                        
                        <div className="detail-actions-sticky" id="edit-actions-campaign" style={{ display: 'none' }}>
                            <button type="button" id="btn-save-changes-campaign" className="btn-ficha btn-guardar">
                                Guardar Cambios
                            </button>
                            <button type="button" id="btn-cancel-edit-campaign" className="btn-ficha btn-cancel-edit">
                                Cancelar
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* MODALES (Popups) - Los dejamos ocultos de momento */}
            <div className="overlay" id="overlay-delete" style={{ display: 'none' }}>
                <div className="popup" id="popup-delete">
                    <h3>¿Eliminar Campaña?</h3>
                    <p>Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta campaña de la base de datos?</p>
                    <div className="botones">
                        <button className="btn-add btn-rojo" id="btn-confirm-delete">Eliminar</button>
                        <button className="btn-cerrar-popup" id="btn-cancel-delete">Cancelar</button>
                    </div>
                </div>
            </div>

            <div className="overlay" id="overlay-success-campaign" style={{ display: 'none' }}>
                <div className="popup" id="popup-success-campaign">
                    <h3>¡Guardado con éxito!</h3>
                    <p>La campaña y sus cadenas asociadas se han actualizado correctamente.</p>
                    <div className="botones">
                        <button type="button" className="btn-add" id="btn-accept-edit-campaign">Aceptar</button>
                    </div>
                </div>
            </div>

            <div className="overlay" id="overlay-error-campaign" style={{ display: 'none' }}>
                <div className="popup" id="popup-error-campaign">
                    <h3>Ha ocurrido un error</h3>
                    <p id="error-text-popup-campaign">No se han podido guardar los cambios en el servidor.</p>
                    <div className="botones">
                        <button type="button" className="btn-cerrar-popup" id="btn-accept-error-campaign">Aceptar</button>
                    </div>
                </div>
            </div>
        </>
    );
}