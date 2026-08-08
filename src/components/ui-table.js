/**
 * UITable — Custom Tailwind Data Table Component
 * Features: Sorting, Pagination, Custom Cell Rendering, Row Action Delegation
 */

export class UITable {
  constructor({
    container,
    columns = [],
    data = [],
    pageSize = 5,
    emptyText = 'Không tìm thấy bản ghi phù hợp',
    onRowAction = null
  } = {}) {
    this.container = container;
    this.columns = columns;
    this.data = data;
    this.pageSize = pageSize;
    this.emptyText = emptyText;
    this.onRowAction = onRowAction;

    this.currentPage = 1;
    this.sortKey = null;
    this.sortOrder = 'asc';

    this.render();
  }

  setData(data) {
    this.data = data || [];
    this.currentPage = 1;
    this.render();
  }

  setSort(key) {
    if (this.sortKey === key) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortOrder = 'asc';
    }
    this.render();
  }

  getSortedData() {
    if (!this.sortKey) return [...this.data];

    return [...this.data].sort((a, b) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  render() {
    if (!this.container) return;

    const sortedData = this.getSortedData();
    const totalItems = sortedData.length;

    if (totalItems === 0) {
      this.container.innerHTML = `
        <div class="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <p class="text-xs font-semibold text-slate-400">${this.emptyText}</p>
        </div>
      `;
      return;
    }

    const totalPages = Math.ceil(totalItems / this.pageSize);
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const pageItems = sortedData.slice(startIndex, endIndex);

    this.container.innerHTML = `
      <div class="space-y-4">
        <!-- Table Scroll Container -->
        <div class="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-100">
          <table class="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead class="bg-slate-50/90 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 select-none">
              <tr>
                ${this.columns.map(col => {
                  const isSorted = this.sortKey === col.key;
                  const sortIcon = isSorted
                    ? (this.sortOrder === 'asc' ? '▲' : '▼')
                    : '⇅';
                  return `
                    <th
                      class="py-2.5 px-3 sm:py-3.5 sm:px-4 ${col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition' : ''} ${col.headerClass || ''}"
                      ${col.sortable ? `data-sort-key="${col.key}"` : ''}
                    >
                      <div class="flex items-center gap-1.5">
                        <span>${col.title}</span>
                        ${col.sortable ? `<span class="text-[10px] ${isSorted ? 'text-[#0B2C4D] font-bold' : 'text-slate-300'}">${sortIcon}</span>` : ''}
                      </div>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-semibold text-slate-800">
              ${pageItems.map((row, rIdx) => `
                <tr class="hover:bg-blue-50/40 transition-colors" data-row-index="${startIndex + rIdx}">
                  ${this.columns.map(col => {
                    let cellVal = row[col.key];
                    let rendered = col.render ? col.render(cellVal, row, startIndex + rIdx) : (cellVal ?? '');
                    return `<td class="py-2.5 px-3 sm:py-3.5 sm:px-4 ${col.classNames || ''}">${rendered}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1 text-xs">
          <div class="text-slate-400 font-semibold">
            Hiển thị <span class="font-bold text-slate-800">${startIndex + 1}</span> – <span class="font-bold text-slate-800">${endIndex}</span> trong tổng số <span class="font-bold text-[#0B2C4D]">${totalItems}</span> bản ghi
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center gap-1 select-none">
              <!-- Previous Button -->
              <button
                type="button"
                id="uitable-prev-btn"
                class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                ${this.currentPage === 1 ? 'disabled' : ''}
              >
                ‹ Trước
              </button>

              <!-- Page Numbers -->
              <div class="flex items-center gap-1 px-1">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                  <button
                    type="button"
                    data-page="${p}"
                    class="uitable-page-btn w-8 h-8 rounded-xl font-bold text-xs transition flex items-center justify-center ${p === this.currentPage ? 'bg-[#0B2C4D] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}"
                  >
                    ${p}
                  </button>
                `).join('')}
              </div>

              <!-- Next Button -->
              <button
                type="button"
                id="uitable-next-btn"
                class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                ${this.currentPage === totalPages ? 'disabled' : ''}
              >
                Sau ›
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Sort header click events
    this.container.querySelectorAll('th[data-sort-key]').forEach(th => {
      th.onclick = () => {
        const key = th.dataset.sortKey;
        this.setSort(key);
      };
    });

    // Pagination events
    const prevBtn = this.container.querySelector('#uitable-prev-btn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render();
        }
      };
    }

    const nextBtn = this.container.querySelector('#uitable-next-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.render();
        }
      };
    }

    this.container.querySelectorAll('.uitable-page-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentPage = parseInt(btn.dataset.page, 10);
        this.render();
      };
    });

    // Row Action delegation
    if (this.onRowAction) {
      this.container.querySelectorAll('[data-action]').forEach(actionEl => {
        actionEl.onclick = (e) => {
          e.stopPropagation();
          const action = actionEl.dataset.action;
          const tr = actionEl.closest('tr');
          const rIdx = parseInt(tr.dataset.rowIndex, 10);
          const rowData = sortedData[rIdx];
          this.onRowAction(action, rowData, rIdx);
        };
      });
    }
  }
}
