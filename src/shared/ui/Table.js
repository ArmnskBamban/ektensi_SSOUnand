/**
 * Table component.
 * Consistent table styling with support for rich cell content.
 */

import { el } from '../../portals/attendance-unand/ui/mount.js';

/**
 * @param {object} options
 * @param {string[]} options.headers - Column headers
 * @param {Array<Array<string | { content: any, html?: boolean }>>} options.rows - Row data
 * @param {string} [options.className] - Additional class name
 * @returns {HTMLTableElement}
 */
export function Table({ headers, rows, className = '' }) {
  const table = el('table', `siakadx-table ${className}`.trim());

  // Header
  const thead = el('thead');
  const headRow = el('tr');
  for (const h of headers) {
    headRow.appendChild(el('th', '', h));
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Body
  const tbody = el('tbody');
  for (const row of rows) {
    const tr = el('tr');
    for (const cell of row) {
      const td = el('td');

      if (typeof cell === 'string') {
        td.textContent = cell;
      } else if (cell && typeof cell === 'object') {
        if (cell.content instanceof Node) {
          td.appendChild(cell.content);
        } else if (cell.html === true && typeof cell.content === 'string') {
          td.innerHTML = cell.content;
        } else {
          td.textContent = String(cell.content ?? '');
        }
      }

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}