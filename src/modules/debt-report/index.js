/**
 * Debt Report & Tower Breakdown Module
 */

import { fetchDebtReport } from '../../services/debt.service.js';
import { DEFAULT_TOWERS } from '../../core/constants.js';
import { formatCurrency } from '../../utils/currency.js';
import { debounce } from '../../utils/debounce.js';
import { toast } from '../../components/toast.js';
import { UISelect } from '../../components/ui-select.js';
import { UITable } from '../../components/ui-table.js';

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

  let debtTable = null;

  const loadData = async () => {
    tableContainer.innerHTML = `<div class="flex items-center justify-center py-12 text-[#0B2C4D] font-bold text-xs gap-2"><div class="animate-spin w-4 h-4 border-2 border-[#0B2C4D] border-t-transparent rounded-full"></div> Đang tải dữ liệu...</div>`;

    try {
      const res = await fetchDebtReport(currentFilters);
      
      debtTable = new UITable({
        container: tableContainer,
        pageSize: 5,
        columns: [
          { key: 'residentName', title: 'Cư dân', sortable: true, classNames: 'font-bold text-slate-900' },
          { key: 'plateNumber', title: 'Biển số', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-slate-100/90 text-[#0B2C4D] font-mono font-bold rounded-lg border border-slate-200/50">${val}</span>` },
          { key: 'apartmentNumber', title: 'Căn hộ', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">${val}</span>` },
          { key: 'packageType', title: 'Gói giữ xe', sortable: true, classNames: 'text-slate-600' },
          { key: 'dueDate', title: 'Đến hạn', sortable: true, classNames: 'text-slate-500 font-semibold' },
          { key: 'amount', title: 'Số tiền', sortable: true, render: (val) => `<span class="font-black text-slate-900">${formatCurrency(val)}</span>` },
          { key: 'status', title: 'Trạng thái', sortable: true, render: (val) => {
              if (val === 'PAID') return '<span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>Đã thanh toán</span>';
              if (val === 'PENDING') return '<span class="px-3 py-1 bg-[#FEF0C7] text-[#DC6803] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#DC6803]"></span>Chờ thanh toán</span>';
              return '<span class="px-3 py-1 bg-[#FEE4E2] text-[#D92D20] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#D92D20]"></span>Sắp hết hạn</span>';
            }
          },
          { key: 'actions', title: 'Thao tác', render: (_, row) => `
              <button data-action="remind" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition mr-1">
                Nhắc nợ
              </button>
              <button data-action="pay" class="px-2.5 py-1 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition">
                Thanh toán
              </button>
            `
          }
        ],
        data: res.data,
        onRowAction: (action, rowData) => {
          if (action === 'remind') {
            toast.show(`Đã gửi thông báo nhắc nợ đến ${rowData.residentName} (${rowData.apartmentNumber})`, 'success');
          } else if (action === 'pay') {
            toast.show(`Mở cổng thanh toán cho ${rowData.residentName} (${rowData.plateNumber})`, 'info');
          }
        }
      });

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

  exportBtn.onclick = () => {
    toast.show('Đã xuất file báo cáo Excel thành công', 'success');
  };

  loadData();
}

