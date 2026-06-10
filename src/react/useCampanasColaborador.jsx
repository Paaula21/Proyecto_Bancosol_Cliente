import { useState, useEffect } from 'react';

export function useCampanasColaborador() {
    const [campanas, setCampanas] = useState([]);
    const [cadenas, setCadenas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setCargando(true);
                // Obtenemos campañas y cadenas en paralelo
                const [resCampanas, resCadenas] = await Promise.all([
                    fetch('http://localhost:3000/campana'),
                    fetch('http://localhost:3000/cadena')
                ]);

                const dataCampanas = await resCampanas.json();
                const dataCadenas = await resCadenas.json();

                setCampanas(dataCampanas);
                setCadenas(dataCadenas);
            } catch (error) {
                console.error("Error cargando datos de campañas:", error);
            } finally {
                setCargando(false);
            }
        }
        fetchData();
    }, []);

    return { campanas, cadenas, cargando };
}