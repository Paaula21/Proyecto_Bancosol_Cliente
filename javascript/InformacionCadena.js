/**
 * InformacionCadena.js
 * Funcionalidades:
 *  1. Pop-up de confirmación antes de borrar
 *  2. Filtros en tiempo real sobre la tabla
 *  3. Contador de resultados + scroll vertical a partir de 5 filas
 *  4. Botón Editar navega a NuevaCadena.html?edit=Nombre
 */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Referencias al DOM ──────────────────────────────────────────────────
    const tbody        = document.querySelector('.data-table tbody');
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

    // ─── Helpers popup borrado ───────────────────────────────────────────────

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
        pendingRow?.remove();
        updateCounterAndScroll();
        closeDeletePopup();
    });

    // ─── Delegación de eventos en la tabla ───────────────────────────────────

    tbody?.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        if (e.target.closest('.btn-icon--danger')) {
            openDeletePopup(row);
            return;
        }

        if (e.target.closest('.btn--secondary') && !e.target.closest('.btn-icon--danger')) {
            const btn = e.target.closest('button');
            if (btn && btn.textContent.trim() === 'Editar') {
                const chainName = row.querySelector('td strong')?.textContent.trim();
                if (chainName) {
                    window.location.href = `NuevaCadena.html?edit=${encodeURIComponent(chainName)}`;
                }
                return;
            }
        }
    });

    // ─── Contador de resultados y scroll vertical ────────────────────────────

    function updateCounterAndScroll() {
        const allRows     = tbody?.querySelectorAll('tr') ?? [];
        const visibleRows = [...allRows].filter(r => r.style.display !== 'none');
        const count       = visibleRows.length;

        if (resultCount) {
            resultCount.textContent = count === 1 ? '1 resultado' : `${count} resultados`;
        }

        if (tableWrapper) {
            tableWrapper.classList.toggle('scrollable', count > 4);
        }
    }

    // ─── Filtros en tiempo real ───────────────────────────────────────────────

    function getFilterValues() {
        return {
            chain:     (document.getElementById('filter-chain')?.value || '').toLowerCase(),
            gr:         document.getElementById('filter-gr')?.value || '',
            primavera:  document.getElementById('filter-primavera')?.value || '',
        };
    }

    function rowMatchesFilters(row, f) {
        const cells = row.querySelectorAll('td');
        if (!cells.length) return true;

        const name     = cells[0]?.textContent.toLowerCase() ?? '';
        const grText   = cells[2]?.textContent.trim().toLowerCase() ?? '';
        const primText = cells[3]?.textContent.trim().toLowerCase() ?? '';

        if (f.chain && !name.includes(f.chain))              return false;
        if (f.gr === 'yes' && grText !== 'sí')               return false;
        if (f.gr === 'no'  && grText !== 'no')               return false;
        if (f.primavera === 'yes' && primText !== 'sí')      return false;
        if (f.primavera === 'no'  && primText !== 'no')      return false;
        // f.gr === 'todas' y f.primavera === 'todas' no filtran

        return true;
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

    // ─── Inicializar contador al cargar ──────────────────────────────────────
    updateCounterAndScroll();

});