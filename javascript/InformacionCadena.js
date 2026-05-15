/**
 * InformacionCadena.js
 * Funcionalidades:
 *  1. Pop-up de confirmación antes de borrar una fila
 *  2. Filtros en tiempo real sobre la tabla de cadenas
 */

document.addEventListener('DOMContentLoaded', () => {

    const tbody      = document.querySelector('.data-table tbody');
    const filterForm = document.querySelector('form');
    const overlay    = document.getElementById('delete-overlay');
    const targetName = document.getElementById('delete-target-name');
    const btnCancel  = document.getElementById('btn-cancel-del');
    const btnConfirm = document.getElementById('btn-confirm-del');

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
        pendingRow?.remove();
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

        if (e.target.closest('.btn-icon')) {
            const chainName = row.querySelector('td strong')?.textContent.trim();
            alert(`Editar: ${chainName}\n(Funcionalidad pendiente de implementar)`);
        }
    });

    // ─── Filtros en tiempo real ───────────────────────────────────────────────

    function getFilterValues() {
        return {
            chain:    (document.getElementById('filter-chain')?.value || '').toLowerCase(),
            gr:        document.getElementById('filter-gr')?.value || '',
            primavera: document.getElementById('filter-primavera')?.value || '',
        };
    }

    function rowMatchesFilters(row, f) {
        const cells = row.querySelectorAll('td');
        if (!cells.length) return true;

        const name     = cells[0]?.textContent.toLowerCase() ?? '';
        const grText   = cells[2]?.textContent.trim().toLowerCase() ?? '';
        const primText = cells[3]?.textContent.trim().toLowerCase() ?? '';

        if (f.chain && !name.includes(f.chain)) return false;
        if (f.gr === 'yes' && grText !== 'sí')  return false;
        if (f.gr === 'no'  && grText !== 'no')  return false;
        if (f.primavera === 'yes' && primText !== 'sí') return false;
        if (f.primavera === 'no'  && primText !== 'no') return false;

        return true;
    }

    function applyFilters() {
        const f = getFilterValues();
        tbody?.querySelectorAll('tr').forEach(row => {
            row.style.display = rowMatchesFilters(row, f) ? '' : 'none';
        });
    }

    document.querySelectorAll('.filters input, .filters select').forEach(el => {
        el.addEventListener('input', applyFilters);
        el.addEventListener('change', applyFilters);
    });

    filterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

});
