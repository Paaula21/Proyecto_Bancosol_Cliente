import { useContext } from 'react';
import { UserContext } from './ContextoUsuario';

export function useNotificaciones() {
    // Sacamos al usuario logueado directamente del contexto
    const { usuario } = useContext(UserContext);

    // Creamos la función que usaremos en nuestros componentes
    const enviarNotificacion = async (titulo, mensaje, tipo) => {
        
        const nuevaNotificacion = {
            id: Math.random().toString(36).substring(2, 12),
            id_notificacion: Date.now(),
            id_persona_destino: Number(usuario.id_usuario) || 1, // Se lo mandamos a quien haya hecho la acción
            id_tipo: tipo, // "CAMPANA", "CAMBIO", "ASIGNACION", etc.
            titulo: titulo,
            mensaje: mensaje,
            leida: false,
            fecha_creacion: new Date().toISOString(),
            fecha_envio_programado: null,
            id_asignacion_ref: null
        };

        try {
            await fetch('http://localhost:3000/notificacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaNotificacion)
            });
            console.log("¡Notificación enviada con éxito desde React!");
        } catch (error) {
            console.error("Error al guardar la notificación:", error);
        }
    };

    // El Hook devuelve la función para que otros la usen
    return { enviarNotificacion };
}