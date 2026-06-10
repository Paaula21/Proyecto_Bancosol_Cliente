import { useState, useEffect } from 'react';

export function useDashboardColaborador() {
    const [stats, setStats] = useState({ campanas: 0, nombres: 'Cargando...', tiendas: 0, zonasCount: 0, colaboradores: 0, coordinadores: 0 });
    const [campanas, setCampanas] = useState([]);
    const [zonas, setZonas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setCargando(true);
                // Hacemos todas las peticiones en paralelo
                const res = await Promise.all([
                    fetch('http://localhost:3000/campana').then(r => r.json()),
                    fetch('http://localhost:3000/establecimiento').then(r => r.json()),
                    fetch('http://localhost:3000/colaborador').then(r => r.json()),
                    fetch('http://localhost:3000/usuario?id_rol=2').then(r => r.json()),
                    fetch('http://localhost:3000/zona_geografica').then(r => r.json()),
                    fetch('http://localhost:3000/division_territorial').then(r => r.json()),
                    fetch('http://localhost:3000/codigo_postal').then(r => r.json()),
                    fetch('http://localhost:3000/direccion').then(r => r.json())
                ]);

                const [campData, estData, colData, coordData, zonaData, divData, cpData, dirData] = res;

                // --- 1. ESTADÍSTICAS GLOBALES ---
                const activas = campData.filter(c => c.estado === 'Activa');
                const nombres = activas.map(c => c.nombre_campana.replace(' 2025', '')).join(', ');

                setStats({
                    campanas: activas.length,
                    nombres: nombres || 'Sin campañas activas',
                    tiendas: estData.length,
                    zonasCount: zonaData.length,
                    colaboradores: colData.length,
                    coordinadores: coordData.length
                });

                // --- 2. PRÓXIMAS CAMPAÑAS ---
                const proximas = campData
                    .filter(c => c.estado !== 'Completada')
                    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
                setCampanas(proximas);

                // --- 3. COBERTURA POR ZONA ---
                const divisionAZona = {};
                divData.forEach(d => divisionAZona[d.id_division] = d.id_zona);

                const cpAZona = {};
                cpData.forEach(cp => cpAZona[cp.id_cp] = divisionAZona[cp.id_division]);

                const dirAZona = {};
                dirData.forEach(d => dirAZona[d.id_direccion] = cpAZona[d.id_cp]);

                const conteo = {};
                estData.forEach(e => {
                    const idZ = dirAZona[e.id_direccion];
                    if (idZ) conteo[idZ] = (conteo[idZ] || 0) + 1;
                });

                const zonasOrd = zonaData.map(z => ({
                    id_zona: z.id_zona,
                    nombre_zona: z.nombre_zona,
                    tiendas: conteo[z.id_zona] || 0
                })).filter(z => z.tiendas > 0).sort((a, b) => b.tiendas - a.tiendas);

                setZonas(zonasOrd);

            } catch (error) {
                console.error('Error al cargar el dashboard de colaborador:', error);
            } finally {
                setCargando(false);
            }
        }

        fetchDashboardData();
    }, []);

    // El hook devuelve todo lo que la vista necesita
    return { stats, campanas, zonas, cargando };
}