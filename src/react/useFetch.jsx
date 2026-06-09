import { useState, useEffect } from 'react';

export function useFetch(url) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let ignore = false; 

        setCargando(true);
        // AÑADIMOS cache: 'no-store' PARA OBLIGAR A TRAER DATOS FRESCOS
        fetch(url, { cache: 'no-store' })
            .then(respuesta => respuesta.json())
            .then(json => {
                if (!ignore) {
                    setDatos(json);
                    setCargando(false);
                }
            })
            .catch(error => {
                if (!ignore) {
                    console.error("Error en la base de datos:", error);
                    setCargando(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [url]);

    const eliminarDato = async (id) => {
        try {
            const respuesta = await fetch(`${url}/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                setDatos(datosActuales => datosActuales.filter(item => item.id !== id));
                return true; 
            }
            return false;
        } catch (error) {
            console.error("Error al eliminar:", error);
            return false; 
        }
    };

    const marcarComoLeida = async (id) => {
        try {
            const respuesta = await fetch(`${url}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leida: true })
            });

            if (respuesta.ok) {
                setDatos(datosActuales => datosActuales.map(item => 
                    item.id === id ? { ...item, leida: true } : item
                ));
            }
        } catch (error) {
            console.error("Error al marcar como leída:", error);
        }
    };

    return { datos, cargando, eliminarDato, marcarComoLeida };
}