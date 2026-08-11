/**
 * Tenant & Project Management Module
 */

import { MOCK_TENANTS } from '#core/mock-data.js';
import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';

export function initTenantManagementModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Quản lý Đối tác & Dự án (Tenant Management)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Quản lý không gian làm việc (Tenants), tên miền và thương hiệu riêng</p>
        </div>
        <button type="button" id="add-tenant-btn" class="px-4 py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span>Thêm đối tác mới</span>
        </button>
      </div>

      <!-- Tenants Table Container -->
      <div id="tenants-table-wrap" class="min-h-[250px]"></div>
    </div>
  `;

  const tableWrap = container.querySelector('#tenants-table-wrap');
  const addBtn = container.querySelector('#add-tenant-btn');

  const loadTenants = () => {
    const data = MOCK_TENANTS.map(t => ({
      ...t,
      contact: t.code === 'VINHOMES_OCEAN' ? 'admin@vinhomes.vn' : 'admin@masteri.vn',
      towersCount: t.code === 'VINHOMES_OCEAN' ? 3 : 2
    }));

    new UITable({
      container: tableWrap,
      pageSize: 5,
      columns: [
        { key: 'name', title: 'Tên đối tác (Tenant)', sortable: true, render: (val, row) => `
          <div>
            <div class="font-bold text-slate-900">${val}</div>
            <div class="text-[10px] text-slate-400 font-bold">${row.code}</div>
          </div>
        `},
        { key: 'domain', title: 'Tên miền truy cập', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg font-semibold font-mono">${val}</span>` },
        { key: 'contact', title: 'Email liên hệ', sortable: true, classNames: 'text-slate-500 font-medium' },
        { key: 'towersCount', title: 'Số tòa tháp', sortable: true, classNames: 'font-bold text-slate-700' },
        { key: 'is_active', title: 'Trạng thái', sortable: true, render: (val) => val ? 
            '<span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Đang kích hoạt</span>' :
            '<span class="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">Tạm khóa</span>'
        },
        { key: 'actions', title: 'Cấu hình', render: () => `
          <button data-action="config" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition">
            Branding
          </button>
        `}
      ],
      data: data,
      onRowAction: (action, rowData) => {
        if (action === 'config') {
          toast.show(`Mở cấu hình thương hiệu cho ${rowData.name} (${rowData.domain})`, 'info');
        }
      }
    });
  };

  addBtn.onclick = () => {
    toast.show('Yêu cầu phân bổ tài nguyên Tenant mới (Provisioning Tenant Workspace)...', 'info');
  };

  loadTenants();
}
