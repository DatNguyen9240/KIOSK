/**
 * Report Center Module
 */

import { initDebtManagementModule } from '#modules/debt-management/index.js';
import { toast } from '#components/toast.js';

export function initReportCenterModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Trung tâm Báo cáo & Phân tích (Report Center)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Xuất bản dữ liệu, biểu đồ vận hành và đối soát tài chính</p>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="flex border-b border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto gap-4">
        <button id="tab-revenue" class="px-4 py-2 border-b-2 border-[#0B2C4D] text-[#0B2C4D] whitespace-nowrap transition">Báo cáo Doanh thu</button>
        <button id="tab-traffic" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap transition">Biểu đồ Lưu lượng xe</button>
        <button id="tab-debt" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap transition">Báo cáo Công nợ</button>
        <button id="tab-voucher" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap transition">Hiệu quả Voucher</button>
      </div>

      <!-- Report View Container -->
      <div id="report-view-container" class="min-h-[300px]"></div>
    </div>
  `;

  const viewContainer = container.querySelector('#report-view-container');
  const tabs = {
    revenue: container.querySelector('#tab-revenue'),
    traffic: container.querySelector('#tab-traffic'),
    debt: container.querySelector('#tab-debt'),
    voucher: container.querySelector('#tab-voucher')
  };

  const switchTab = (activeKey) => {
    Object.keys(tabs).forEach(key => {
      if (key === activeKey) {
        tabs[key].classList.add('border-[#0B2C4D]', 'text-[#0B2C4D]');
        tabs[key].classList.remove('border-transparent');
      } else {
        tabs[key].classList.remove('border-[#0B2C4D]', 'text-[#0B2C4D]');
        tabs[key].classList.add('border-transparent');
      }
    });

    renderTabContent(activeKey);
  };

  const renderTabContent = (key) => {
    if (key === 'debt') {
      initDebtManagementModule(viewContainer);
      return;
    }

    if (key === 'revenue') {
      viewContainer.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span class="text-slate-400 font-semibold text-xs block">Tổng doanh thu kỳ trước:</span>
              <span class="font-black text-slate-900 text-lg">1.258.000.000 đ</span>
            </div>
            <button id="download-revenue-btn" class="px-3.5 py-1.5 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">
              Tải xuống PDF
            </button>
          </div>
          <div class="text-center py-12 text-slate-400 text-xs">
            Hệ thống đang tổng hợp dữ liệu doanh thu thời gian thực...
          </div>
        </div>
      `;
      viewContainer.querySelector('#download-revenue-btn').onclick = () => {
        toast.show('Đang xuất báo cáo doanh thu PDF...', 'info');
      };
      return;
    }

    if (key === 'traffic') {
      viewContainer.innerHTML = `
        <div class="space-y-4">
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 font-semibold">
            Tần suất xe ra vào cao điểm: <span class="text-[#0B2C4D] font-bold">07:30 - 08:30 (Sáng) & 17:30 - 18:30 (Chiều)</span>.
          </div>
          <div class="text-center py-12 text-slate-400 text-xs">
            [Biểu đồ lưu lượng xe LPR camera] Đang kết nối dữ liệu Gateway...
          </div>
        </div>
      `;
      return;
    }

    if (key === 'voucher') {
      viewContainer.innerHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
              <span class="text-[10px] text-slate-400 font-bold block">VOUCHER SỬ DỤNG NHIỀU NHẤT</span>
              <span class="text-sm font-black text-slate-800 block mt-1">HE2024 (Giảm 10%)</span>
              <span class="text-xs text-slate-500 block">458 lượt sử dụng</span>
            </div>
            <div class="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
              <span class="text-[10px] text-slate-400 font-bold block">TỔNG GIÁ TRỊ MIỄN GIẢM</span>
              <span class="text-sm font-black text-emerald-600 block mt-1">45.800.000 đ</span>
              <span class="text-xs text-slate-500 block">Tích lũy từ đầu năm</span>
            </div>
          </div>
          <div class="text-center py-8 text-slate-400 text-xs">
            Bảng thống kê hiệu suất Voucher
          </div>
        </div>
      `;
      return;
    }
  };

  // Bind tab click events
  tabs.revenue.onclick = () => switchTab('revenue');
  tabs.traffic.onclick = () => switchTab('traffic');
  tabs.debt.onclick = () => switchTab('debt');
  tabs.voucher.onclick = () => switchTab('voucher');

  // Initial load
  switchTab('revenue');
}

// Keep legacy export for testing backwards compatibility
export { initReportCenterModule as initReportsModule };
