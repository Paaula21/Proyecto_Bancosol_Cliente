/**
 * InformacionTienda.js
 * Funcionalidades:
 *  1. Panel de detalle dinámico al hacer clic en una fila
 *  2. Pop-up de confirmación antes de borrar
 *  3. Filtros en tiempo real sobre la tabla
 */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Datos de ejemplo ────────────────────────────────────────────────────
    const storeData = {
        'Carrefour Hiper': {
            cadena: 'Carrefour', alias: 'Carrefour Hiper', lineales: 1,
            coordinador: 'J.M. Cobos', direccion: 'C/ Arroyo de Totalán, 36',
            colaborador: 'Cristóbal', localidad: 'Rincón de la Victoria',
            zona: 'Málaga', granRecogida: true, primavera: true,
        },
        'Carrefour Express': {
            cadena: 'Carrefour', alias: 'Carrefour Express', lineales: 2,
            coordinador: 'J.M. Cobos', direccion: 'Av. del Mediterráneo, 12',
            colaborador: 'Lucía Martín', localidad: 'Rincón de la Victoria',
            zona: 'Málaga', granRecogida: true, primavera: false,
        },
        'Carrefour Market': {
            cadena: 'Carrefour', alias: 'Carrefour Market', lineales: 3,
            coordinador: 'J.M. Cobos', direccion: 'Plaza Mayor, 5',
            colaborador: 'Antonio García', localidad: 'Rincón de la Victoria',
            zona: 'Málaga', granRecogida: true, primavera: true,
        },
    };

    // ─── Referencias al DOM ──────────────────────────────────────────────────
    const tbody        = document.querySelector('.data-table tbody');
    const detailPanel  = document.getElementById('detail-panel');
    const filterForm   = document.querySelector('form');
    const overlay      = document.getElementById('delete-overlay');
    const targetName   = document.getElementById('delete-target-name');
    const btnCancel    = document.getElementById('btn-cancel-del');
    const btnConfirm   = document.getElementById('btn-confirm-del');
    const tableWrapper = document.querySelector('.table-wrapper');

    // Crear el elemento del contador de resultados (debajo de la tabla)
    const resultCount = document.createElement('p');
    resultCount.id = 'result-count';
    resultCount.style.cssText = 'margin: 12px 0 0 0; font-size: 0.8125rem; color: #6b7280;';
    tableWrapper?.insertAdjacentElement('afterend', resultCount);

    let pendingRow = null;

    // ─── Helpers popup ───────────────────────────────────────────────────────

    function openDeletePopup(row) {
        const name = row.querySelector('td strong')?.textContent.trim() ?? '';
        targetName.textContent = `"${name}"`;
        pendingRow = row;
        overlay.classList.add('active');
    }

    function closeDeletePopup() {
        overlay.classList.remove('active');
        pendingRow = null;
    }

    btnCancel?.addEventListener('click', closeDeletePopup);

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeDeletePopup();
    });

    btnConfirm?.addEventListener('click', () => {
        if (pendingRow) {
            const storeName = pendingRow.querySelector('td strong')?.textContent.trim();
            const panelTitle = detailPanel?.querySelector('.detail-panel-header h3');
            if (panelTitle?.textContent === storeName) {
                detailPanel.innerHTML = '<p>Selecciona un establecimiento para ver su información.</p>';
                detailPanel.classList.add('empty');
            }
            pendingRow.remove();
            updateCounterAndScroll();
        }
        closeDeletePopup();
    });

    // ─── Panel de detalle ─────────────────────────────────────────────────────

    function dotHTML(value) {
        return value
            ? '<span class="dot-yes">Sí</span>'
            : '<span class="dot-no">No</span>';
    }

    function updateDetailPanel(storeName) {
        const data = storeData[storeName];
        if (!data || !detailPanel) return;

        detailPanel.classList.remove('empty');
        detailPanel.innerHTML = `
            <div class="detail-panel-header">
                <h3>${data.alias}</h3>
                <p>${data.localidad} · ${data.zona}</p>
            </div>
            <div class="detail-fields">
                <div class="detail-field">
                    <span class="field-label">Cadena</span>
                    <span class="field-value">${data.cadena}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Alias</span>
                    <span class="field-value">${data.alias}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Lineales</span>
                    <span class="field-value">${data.lineales}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Coordinador</span>
                    <span class="field-value">${data.coordinador}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Dirección</span>
                    <span class="field-value">${data.direccion}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Colaborador</span>
                    <span class="field-value">${data.colaborador}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Primavera</span>
                    <span class="field-value">${dotHTML(data.primavera)}</span>
                </div>
                <div class="detail-field">
                    <span class="field-label">Gran Recogida</span>
                    <span class="field-value">${dotHTML(data.granRecogida)}</span>
                </div>
            </div>
        `;
    }

    // ─── Delegación de eventos en la tabla ───────────────────────────────────

    tbody?.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        if (e.target.closest('.btn-icon--danger')) {
            openDeletePopup(row);
            return;
        }

        if (e.target.closest('.btn--secondary') && !e.target.closest('.btn-icon--danger')) {
            // Distinguir botón Editar del botón Borrar por texto
            const btn = e.target.closest('button');
            if (btn && btn.textContent.trim() === 'Editar') {
                const storeName = row.querySelector('td strong')?.textContent.trim();
                if (storeName) {
                    window.location.href = `NuevaTienda.html?edit=${encodeURIComponent(storeName)}`;
                }
                return;
            }
        }

        // Selección de fila → actualizar panel de detalle
        document.querySelectorAll('.data-table tbody tr').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        const storeName = row.querySelector('td strong')?.textContent.trim();
        if (storeName) updateDetailPanel(storeName);
    });

    // ─── Filtros en tiempo real ───────────────────────────────────────────────

    function getFilterValues() {
        return {
            name:        (document.getElementById('filter-name')?.value || '').toLowerCase(),
            city:        (document.getElementById('filter-city')?.value || '').toLowerCase(),
            coordinator: (document.getElementById('filter-coordinator')?.value || '').toLowerCase(),
            gr:          document.getElementById('filter-gr')?.value || '',
            primavera:   document.getElementById('filter-primavera')?.value || '',
        };
    }

    function rowMatchesFilters(row, f) {
        const cells = row.querySelectorAll('td');
        if (!cells.length) return true;

        const name        = cells[0]?.textContent.toLowerCase() ?? '';
        const city        = cells[1]?.textContent.toLowerCase() ?? '';
        const coordinator = cells[2]?.textContent.toLowerCase() ?? '';
        const grText      = cells[3]?.textContent.trim().toLowerCase() ?? '';
        const primText    = cells[4]?.textContent.trim().toLowerCase() ?? '';

        if (f.name && !name.includes(f.name))               return false;
        if (f.city && !city.includes(f.city))               return false;
        if (f.coordinator && !coordinator.includes(f.coordinator)) return false;
        if (f.gr === 'yes' && grText !== 'sí')              return false;
        if (f.gr === 'no'  && grText !== 'no')              return false;
        if (f.primavera === 'yes' && primText !== 'sí')     return false;
        if (f.primavera === 'no'  && primText !== 'no')     return false;

        return true;
    }

    // ─── Actualiza contador y scroll vertical ────────────────────────────────

    function updateCounterAndScroll() {
        const allRows    = tbody?.querySelectorAll('tr') ?? [];
        const visibleRows = [...allRows].filter(r => r.style.display !== 'none');
        const count      = visibleRows.length;

        // Contador de resultados
        if (resultCount) {
            resultCount.textContent = count === 1
                ? '1 resultado'
                : `${count} resultados`;
        }

        // Barra vertical solo si hay más de 4 filas visibles
        if (tableWrapper) {
            tableWrapper.classList.toggle('scrollable', count > 4);
        }
    }

    function applyFilters() {
        const f = getFilterValues();
        tbody?.querySelectorAll('tr').forEach(row => {
            row.style.display = rowMatchesFilters(row, f) ? '' : 'none';
        });
        updateCounterAndScroll();
    }

    document.querySelectorAll('.filters input, .filters select').forEach(el => {
        el.addEventListener('input', applyFilters);
        el.addEventListener('change', applyFilters);
    });

    filterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    // ─── Seleccionar la primera fila al cargar ────────────────────────────────
    const firstRow = tbody?.querySelector('tr');
    if (firstRow) {
        firstRow.classList.add('selected');
        const firstName = firstRow.querySelector('td strong')?.textContent.trim();
        if (firstName) updateDetailPanel(firstName);
    }

    // Inicializar contador y scroll al cargar
    updateCounterAndScroll();

});