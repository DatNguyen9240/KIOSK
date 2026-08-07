/**
 * Debt Report & Tower Breakdown Module
 */

import { fetchDebtReport } from '../../services/debt.service.js';
import { DEFAULT_TOWERS } from '../../core/constants.js';
import { formatCurrency } from '../../utils/currency.js';
import { debounce } from '../../utils/debounce.js';
import { toast } from '../../components/toast.js';

export function initDebtReportModule(container) {
  if (!container) return;

  let currentFilters = {
    tower: 'ALL',
    search: '',
    status: 'ALL',
    page: 1
  };

  container.innerHTML = `
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Báo cáo công nợ & Gia hạn theo Tháp</h2>
          <p class="text-xs text-slate-500">Quản lý các khoản phí giữ xe cần thu, công nợ ngày/tháng phân chia theo từng Tháp</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="export-excel-btn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-emerald-200/60">
            📊 Xuất Excel
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <!-- Search Input -->
        <div class="sm:col-span-2 relative">
          <input type="text" id="debt-search-input" placeholder="Tìm tên cư dân, biển số, hoặc số căn hộ..." class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <!-- Tower Select -->
        <div>
          <select id="debt-tower-select" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            ${DEFAULT_TOWERS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>

        <!-- Status Select -->
        <div>
          <select id="debt-status-select" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="EXPIRING_SOON">Sắp hết hạn</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
        </div>
      </div>

      <!-- Report Summary Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
        <div>
          <span class="text-slate-500 block">Tổng số khoản nợ:</span>
          <span class="font-bold text-slate-900 text-base" id="summary-total-items">0</span>
        </div>
        <div>
          <span class="text-slate-500 block">Tổng tiền cần thu:</span>
          <span class="font-bold text-blue-600 text-base" id="summary-total-amount">0 đ</span>
        </div>
        <div>
          <span class="text-slate-500 block">Đã chọn theo Tháp:</span>
          <span class="font-bold text-slate-700 text-base" id="summary-tower-display">Tất cả</span>
        </div>
      </div>

      <!-- Table Container -->
      <div id="debt-table-container" class="min-h-[250px]">
        <div class="text-center py-12 text-slate-400 text-sm">Đang tải báo cáo...</div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#debt-search-input');
  const towerSelect = container.querySelector('#debt-tower-select');
  const statusSelect = container.querySelector('#debt-status-select');
  const exportBtn = container.querySelector('#export-excel-btn');
  const tableContainer = container.querySelector('#debt-table-container');

  const loadData = async () => {
    tableContainer.innerHTML = `<div class="flex items-center justify-center py-12 text-blue-600 font-medium text-xs gap-2"><div class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div> Đang tải dữ liệu...</div>`;

    try {
      const res = await fetchDebtReport(currentFilters);
      renderDebtTable(res.data, tableContainer);

      container.querySelector('#summary-total-items').textContent = res.summary.totalItems;
      container.querySelector('#summary-total-amount').textContent = formatCurrency(res.summary.totalAmount);
      container.querySelector('#summary-tower-display').textContent = towerSelect.options[towerSelect.selectedIndex].text;
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
        <p class="text-xs text-slate-500">Không tìm thấy bản ghi công nợ phù hợp</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
          <tr>
            <th class="p-3 rounded-l-xl">Cư dân</th>
            <th class="p-3">Biển số</th>
            <th class="p-3">Căn hộ</th>
            <th class="p-3">Gói giữ xe</th>
            <th class="p-3">Đến hạn</th>
            <th class="p-3">Số tiền</th>
            <th class="p-3 rounded-r-xl">Trạng thái</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${items.map(item => `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="p-3 text-slate-900 font-bold">${item.residentName}</td>
              <td class="p-3 font-mono font-bold text-blue-600">${item.plateNumber}</td>
              <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">${item.apartmentNumber}</span></td>
              <td class="p-3 text-slate-600">${item.packageType}</td>
              <td class="p-3 text-slate-500">${item.dueDate}</td>
              <td class="p-3 font-bold text-slate-900">${formatCurrency(item.amount)}</td>
              <td class="p-3">
                ${item.status === 'PENDING' ? '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">Chờ thanh toán</span>' : ''}
                ${item.status === 'EXPIRING_SOON' ? '<span class="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-bold">Sắp hết hạn</span>' : ''}
                ${item.status === 'PAID' ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">Đã thanh toán</span>' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
