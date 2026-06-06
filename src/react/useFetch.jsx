import { useState, useEffect } from 'react';

export function useFetch(url) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Efecto para LEER los datos (GET)
    useEffect(() => {
        let ignore = false; 

        setCargando(true);
        fetch(url)
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

    // Efecto para BORRAR datos (DELETE)
    const eliminarDato = async (id) => {
        try {
            // Hacemos la petición DELETE a la base de datos
            const respuesta = await fetch(`${url}/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                // Si el servidor lo borra bien, lo quitamos de nuestra variable local
                // usando filter() (como sugiere vuestro temario para Arrays en estado)
                setDatos(datosActuales => datosActuales.filter(item => item.id !== id));
                return true; // Indicamos que salió bien
            }
            return false;
        } catch (error) {
            console.error("Error al eliminar:", error);
            return false; // Indicamos que salió mal
        }
    };

    // Ahora el hook devuelve los datos, si está cargando, Y la función para borrar
    return { datos, cargando, eliminarDato };
}