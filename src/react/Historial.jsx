import React, { useState, useEffect } from 'react';

export default function Historial() {
    const [logs, setLogs] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Cargar el historial desde la base de datos (db.json)
    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                // Ajusta esta URL a la ruta real de tu API/json-server
                const response = await fetch('http://localhost:3000/historial');
                if (response.ok) {
                    const data = await response.json();
                    // Ordenamos para que el más reciente salga arriba
                    const dataOrdenada = data.sort((a, b) => b.id - a.id);
                    setLogs(dataOrdenada);
                }
            } catch (error) {
                console.error("Error al cargar el historial:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchHistorial();
    }, []);

    // Función que devuelve los textos exactos que pediste y sus estilos
    const getActionStyles = (action, name) => {
        switch (action) {
            case 'create':
                return {
                    text: `Se ha creado la campaña "${name}"`,
                    bgClass: 'bg-green-50 text-green-700 border-green-200',
                    dotClass: 'bg-green-500 ring-green-100',
                    icon: '➕'
                };
            case 'edit':
                return {
                    text: `Se ha editado la campaña "${name}"`,
                    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    dotClass: 'bg-blue-500 ring-blue-100',
                    icon: '✏️'
                };
            case 'delete':
                return {
                    text: `Se ha eliminado la campaña "${name}"`,
                    bgClass: 'bg-red-50 text-red-700 border-red-200',
                    dotClass: 'bg-red-500 ring-red-100',
                    icon: '🗑️'
                };
            default:
                return {
                    text: `Acción desconocida en la campaña "${name}"`,
                    bgClass: 'bg-gray-50 text-gray-700 border-gray-200',
                    dotClass: 'bg-gray-500 ring-gray-100',
                    icon: '❓'
                };
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>🕒</span> Historial de Campañas
                </h2>
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {logs.length} eventos registrados
                </span>
            </div>

            {cargando ? (
                <p className="text-gray-500 text-center py-8">Cargando historial...</p>
            ) : logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay movimientos registrados en el historial.</p>
            ) : (
                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                    {logs.map((log) => {
                        const { text, bgClass, dotClass, icon } = getActionStyles(log.action, log.campaignName);

                        return (
                            <div key={log.id} className="relative pl-6 group">
                                <span className={`absolute -left-[6.5px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ${dotClass}`}></span>

                                <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:shadow-sm ${bgClass}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{icon}</span>
                                        <p className="font-medium text-sm md:text-base">{text}</p>
                                    </div>
                                    <span className="text-xs opacity-75 font-mono whitespace-nowrap sm:text-right">
                                        {log.timestamp}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}