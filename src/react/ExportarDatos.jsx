import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function BotonExportarExcel({ endpoints, nombreArchivo }) {
    const [cargando, setCargando] = useState(false);

    const API_BASE = 'http://localhost:3000';

    const exportarAExcel = async () => {
        setCargando(true);
        try {
            const libroDeTrabajo = XLSX.utils.book_new();

            const [
                resCampana, resCadena, resEstablecimiento, resColaborador, resVoluntario,
                resPersona, resDireccion, resCP, resDivision, resZona
            ] = await Promise.all([
                fetch(`${API_BASE}/campana`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/cadena`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/establecimiento`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/colaborador`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/voluntario`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/persona`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/direccion`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/codigo_postal`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/division_territorial`).then(r => r.ok ? r.json() : []),
                fetch(`${API_BASE}/zona_geografica`).then(r => r.ok ? r.json() : [])
            ]);

            // Se mapean las relaciones para las múltiples tablas
            const mapaPersonas = Object.fromEntries(resPersona.map(p => [p.id_persona, p]));
            const mapaCadenas = Object.fromEntries(resCadena.map(c => [c.id_cadena, c.nombre_cadena]));
            const mapaColaboradores = Object.fromEntries(resColaborador.map(c => [c.id_colaborador, c.nombre_colaborador]));

            const mapaZonas = Object.fromEntries(resZona.map(z => [z.id_zona, z.nombre_zona]));
            const mapaDivisiones = Object.fromEntries(resDivision.map(d => [
                d.id_division, 
                { nombre: d.nombre_division, zona: mapaZonas[d.id_zona] }
            ]));
            
            const mapaCP = Object.fromEntries(resCP.map(cp => [
                cp.id_cp, 
                { codigo: cp.codigo, division: mapaDivisiones[cp.id_division]?.nombre }
            ]));
            
            // Para las direcciones, unimos cada unos de los valores que lo forman, como la calle, el cp, el municipio...
            const mapaDirecciones = Object.fromEntries(resDireccion.map(d => {
                const infoCP = mapaCP[d.id_cp] || {};
                
                // Quitamos los valores null para que no aparezcan al exportarlo
                let textoCalle = [d.tipo_via, d.nombre_via].filter(Boolean).join(' ');
                
                if (d.numero) {
                    textoCalle = textoCalle ? `${textoCalle}, ${d.numero}` : `${d.numero}`;
                }

                return [
                    d.id_direccion, 
                    {
                        calle: textoCalle || '',
                        cp: infoCP.codigo || '',
                        municipio: infoCP.division || ''
                    }
                ];
            }));
            // Unificamos cada una de las tablas con todos sus datos

            // --- CAMPAÑAS ---
            if (endpoints.includes('campana') && resCampana.length > 0) {
                const datos = resCampana.map(c => ({
                    'Código': c.id_campana || '',
                    'Nombre': c.nombre_campana || '',
                    'Fecha Inicio': c.fecha_inicio || '',
                    'Fecha Fin': c.fecha_fin || '',
                    'Estado': c.estado || ''
                }));
                XLSX.utils.book_append_sheet(libroDeTrabajo, XLSX.utils.json_to_sheet(datos), "CAMPAÑAS");
            }

            // --- CADENAS ---
            if (endpoints.includes('cadena') && resCadena.length > 0) {
                const datos = resCadena.map(c => ({
                    'ID': c.id_cadena || '',
                    'Nombre': c.nombre_cadena || ''
                }));
                XLSX.utils.book_append_sheet(libroDeTrabajo, XLSX.utils.json_to_sheet(datos), "CADENAS");
            }

            // --- ESTABLECIMIENTOS ---
            if (endpoints.includes('establecimiento') && resEstablecimiento.length > 0) {
                const datos = resEstablecimiento.map(e => {
                    const dir = mapaDirecciones[e.id_direccion] || {};
                    return {
                        'ID': e.id_establecimiento || '',
                        'Nombre': e.nombre_resena || '',
                        'Cadena': mapaCadenas[e.id_cadena] || e.id_cadena || '',
                        'Lineales': e.lineales ?? '', 
                        'Dirección': dir.calle || '',
                        'CP': dir.cp || '',
                        'Municipio': dir.municipio || ''
                    };
                });
                XLSX.utils.book_append_sheet(libroDeTrabajo, XLSX.utils.json_to_sheet(datos), "ESTABLECIMIENTOS");
            }

            // --- COLABORADORES ---
            if (endpoints.includes('colaborador') && resColaborador.length > 0) {
                const datos = resColaborador.map(col => {
                    const dir = mapaDirecciones[col.id_direccion] || {};
                    return {
                        'Código Entidad': col.id_colaborador || '',
                        'Nombre del Colaborador': col.nombre_colaborador || '',
                        'Dirección': dir.calle || '',
                        'CP': dir.cp || '',
                        'Municipio': dir.municipio || '',
                        'Observaciones': col.observaciones || ''
                    };
                });
                XLSX.utils.book_append_sheet(libroDeTrabajo, XLSX.utils.json_to_sheet(datos), "COLABORADORES");
            }

            // --- VOLUNTARIOS ---
            if (endpoints.includes('voluntario') && resVoluntario.length > 0) {
                const datos = resVoluntario.map(v => {
                    const personaAsociada = mapaPersonas[v.id_persona] || {};
                    return {
                        'ID': v.id_voluntario || '',
                        'Nombre': personaAsociada.nombre_completo || '',
                        'Correo': personaAsociada.email || '',
                        'Teléfono': personaAsociada.telefono || '',
                        'Preferencia Horario': v.preferencia_horario || '',
                        'Colaborador Vinculado': mapaColaboradores[v.id_colaborador] || ''
                    };
                });
                XLSX.utils.book_append_sheet(libroDeTrabajo, XLSX.utils.json_to_sheet(datos), "VOLUNTARIOS");
            }

            if (libroDeTrabajo.SheetNames.length === 0) {
                alert("No se encontraron registros para exportar.");
                return;
            }

            XLSX.writeFile(libroDeTrabajo, `${nombreArchivo}.xlsx`);

        } catch (error) {
            console.error("Error en la exportación estructurada:", error);
            alert("Error al intentar generar el archivo. Comprueba la consola.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <button 
            onClick={exportarAExcel} 
            disabled={cargando || endpoints.length === 0}
            className="btn btn--primary"
        >
            {cargando ? 'Creando archivo...' : 'Descargar datos'}
        </button>
    );
}