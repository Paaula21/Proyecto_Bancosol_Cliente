import { useState, useEffect, useCallback } from 'react';

export function useFetch(url) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Separamos la petición en una función para poder llamarla cuando queramos
    const fetchData = useCallback(async () => {
        try {
            const respuesta = await fetch(url, { cache: 'no-store' });
            const json = await respuesta.json();
            setDatos(json);
        } catch (error) {
            console.error("Error en la base de datos:", error);
        } finally {
            setCargando(false);
        }
    }, [url]);

    useEffect(() => {
        let ignore = false;
        
        // 1. Carga inicial
        fetchData();

        // 2. Escuchar si alguien avisa de que hay cambios
        const handleCambios = () => {
            if (!ignore) fetchData();
        };
        window.addEventListener('notificacionesActualizadas', handleCambios);

        // Limpiamos el evento cuando se desmonta el componente
        return () => {
            ignore = true;
            window.removeEventListener('notificacionesActualizadas', handleCambios);
        };
    }, [fetchData]);

    const eliminarDato = async (id) => {
        try {
            const respuesta = await fetch(`${url}/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                setDatos(datosActuales => datosActuales.filter(item => item.id !== id));
                
                // AVISAMOS A TODA LA APP (Por ejemplo, al Header)
                window.dispatchEvent(new Event('notificacionesActualizadas'));
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
                
                // AVISAMOS A TODA LA APP (Para que el Header quite el color morado y el punto rojo)
                window.dispatchEvent(new Event('notificacionesActualizadas'));
            }
        } catch (error) {
            console.error("Error al marcar como leída:", error);
        }
    };

    return { datos, cargando, eliminarDato, marcarComoLeida };
}