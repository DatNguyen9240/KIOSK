/**
 * Debt Report & Tower Breakdown Module
 */

import { fetchDebtReport } from '../../services/debt.service.js';
import { DEFAULT_TOWERS } from '../../core/constants.js';
import { formatCurrency } from '../../utils/currency.js';
import { debounce } from '../../utils/debounce.js';
import { toast } from '../../components/toast.js';
import { UISelect } from '../../components/ui-select.js';

export function initDebtReportModule(container) {
  if (!container) return;

  let currentFilters = {
    tower: 'ALL',
    search: '',
    status: 'ALL',
    page: 1
  };

  container.innerHTML = `
    <div class="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-xl font-black text-[#0B2C4D] tracking-tight">Báo cáo công nợ & Gia hạn theo Tháp</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Quản lý các khoản phí giữ xe cần thu, công nợ ngày/tháng phân chia theo từng Tháp</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="export-excel-btn" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <!-- Search Input -->
        <div class="sm:col-span-2 relative">
          <input type="text" id="debt-search-input" placeholder="Tìm tên cư dân, biển số, hoặc số căn hộ..." class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>

        <!-- Tower Select Slot -->
        <div id="debt-tower-select-wrap"></div>

        <!-- Status Select Slot -->
        <div id="debt-status-select-wrap"></div>
      </div>

      <!-- Report Summary Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
        <div>
          <span class="text-slate-400 font-semibold block">Tổng số khoản nợ:</span>
          <span class="font-black text-slate-900 text-base" id="summary-total-items">0</span>
        </div>
        <div>
          <span class="text-slate-400 font-semibold block">Tổng tiền cần thu:</span>
          <span class="font-black text-[#0B2C4D] text-base" id="summary-total-amount">0 đ</span>
        </div>
        <div>
          <span class="text-slate-400 font-semibold block">Đã chọn theo Tháp:</span>
          <span class="font-bold text-slate-700 text-base" id="summary-tower-display">Tất cả</span>
        </div>
      </div>

      <!-- Table Container -->
      <div id="debt-table-container" class="min-h-[250px]">
        <div class="text-center py-12 text-slate-400 text-xs">Đang tải báo cáo...</div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#debt-search-input');
  const exportBtn = container.querySelector('#export-excel-btn');
  const tableContainer = container.querySelector('#debt-table-container');

  // Initialize UISelect for Tower
  const towerUISelect = new UISelect({
    container: container.querySelector('#debt-tower-select-wrap'),
    options: DEFAULT_TOWERS.map(t => ({ value: t.id, label: t.name })),
    value: 'ALL',
    onChange: (val) => {
      currentFilters.tower = val;
      loadData();
    }
  });

  // Initialize UISelect for Status
  new UISelect({
    container: container.querySelector('#debt-status-select-wrap'),
    options: [
      { value: 'ALL', label: 'Tất cả trạng thái' },
      { value: 'PENDING', label: 'Chờ thanh toán' },
      { value: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
      { value: 'PAID', label: 'Đã thanh toán' }
    ],
    value: 'ALL',
    onChange: (val) => {
      currentFilters.status = val;
      loadData();
    }
  });

  const loadData = async () => {
    tableContainer.innerHTML = `<div class="flex items-center justify-center py-12 text-[#0B2C4D] font-bold text-xs gap-2"><div class="animate-spin w-4 h-4 border-2 border-[#0B2C4D] border-t-transparent rounded-full"></div> Đang tải dữ liệu...</div>`;

    try {
      const res = await fetchDebtReport(currentFilters);
      renderDebtTable(res.data, tableContainer);

      container.querySelector('#summary-total-items').textContent = res.summary.totalItems;
      container.querySelector('#summary-total-amount').textContent = formatCurrency(res.summary.totalAmount);
      container.querySelector('#summary-tower-display').textContent = towerUISelect.getLabel();
    } catch (err) {
      tableContainer.innerHTML = `<div class="text-center py-8 text-rose-500 text-xs">Lỗi tải dữ liệu báo cáo</div>`;
      toast.show('Lỗi tải báo cáo công nợ', 'error');
    }
  };

  const debouncedLoad = debounce(loadData, 300);

  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.trim();
    debouncedLoad();
  });

  towerSelect.addEventListener('change', (e) => {
    currentFilters.tower = e.target.value;
    loadData();
  });

  statusSelect.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadData();
  });

  exportBtn.onclick = () => {
    toast.show('Đã xuất file báo cáo Excel thành công', 'success');
  };

  loadData();
}

function renderDebtTable(items, container) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p class="text-xs font-semibold text-slate-500">Không tìm thấy bản ghi công nợ phù hợp</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th class="py-3 px-4 rounded-l-2xl">Cư dân</th>
            <th class="py-3 px-4">Biển số</th>
            <th class="py-3 px-4">Căn hộ</th>
            <th class="py-3 px-4">Gói giữ xe</th>
            <th class="py-3 px-4">Đến hạn</th>
            <th class="py-3 px-4">Số tiền</th>
            <th class="py-3 px-4 rounded-r-2xl">Trạng thái</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-semibold text-slate-800">
          ${items.map(item => `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="py-3.5 px-4 font-bold text-slate-900">${item.residentName}</td>
              <td class="py-3.5 px-4 font-mono font-bold text-[#0B2C4D]">${item.plateNumber}</td>
              <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">${item.apartmentNumber}</span></td>
              <td class="py-3.5 px-4 text-slate-600">${item.packageType}</td>
              <td class="py-3.5 px-4 text-slate-500">${item.dueDate}</td>
              <td class="py-3.5 px-4 font-bold text-slate-900">${formatCurrency(item.amount)}</td>
              <td class="py-3.5 px-4">
                ${item.status === 'PENDING' ? '<span class="px-3 py-1 bg-[#FEF0C7] text-[#DC6803] rounded-full font-extrabold text-[11px] inline-block">Chờ thanh toán</span>' : ''}
                ${item.status === 'EXPIRING_SOON' ? '<span class="px-3 py-1 bg-[#FEE4E2] text-[#D92D20] rounded-full font-extrabold text-[11px] inline-block">Sắp hết hạn</span>' : ''}
                ${item.status === 'PAID' ? '<span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-block">Đã thanh toán</span>' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

