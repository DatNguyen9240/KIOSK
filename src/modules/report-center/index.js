/**
 * Report Center Module with Revenue Chart Integration
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
        <div class="space-y-5">
          <!-- 4 Stats Cards Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-800">
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[9px] text-slate-400 font-bold block">TỔNG DOANH THU</span>
              <span class="text-sm sm:text-base font-black text-[#0B2C4D] block mt-1">3.650.000.000 đ</span>
            </div>
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[9px] text-slate-400 font-bold block">TIỀN MẶT</span>
              <span class="text-sm sm:text-base font-black text-slate-700 block mt-1">350.000.000 đ</span>
            </div>
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[9px] text-slate-400 font-bold block">CHUYỂN KHOẢN</span>
              <span class="text-sm sm:text-base font-black text-[#7CB342] block mt-1">2.800.000.000 đ</span>
            </div>
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[9px] text-slate-400 font-bold block">VÍ ĐIỆN TỬ</span>
              <span class="text-sm sm:text-base font-black text-[#00A8CC] block mt-1">500.000.000 đ</span>
            </div>
          </div>

          <!-- Revenue Chart Container -->
          <div class="bg-white border border-slate-100 rounded-3xl p-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 class="text-xs font-black text-slate-800">Phân bổ Doanh thu theo Ngày</h4>
              <button id="download-revenue-btn" class="px-3.5 py-1.5 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">
                Tải xuống PDF
              </button>
            </div>
            <div class="relative h-[250px] w-full">
              <canvas id="revenue-report-canvas"></canvas>
            </div>
          </div>
        </div>
      `;

      viewContainer.querySelector('#download-revenue-btn').onclick = () => {
        toast.show('Đang xuất báo cáo doanh thu PDF...', 'info');
      };

      setTimeout(() => renderRevenueChart(document.getElementById('revenue-report-canvas')), 50);
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

  const renderRevenueChart = (canvasEl) => {
    if (!canvasEl || typeof Chart === 'undefined') return;
    const ctx = canvasEl.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'],
        datasets: [
          {
            label: 'Doanh thu (Triệu)',
            data: [120, 150, 180, 90, 200, 220, 250, 280, 300, 310, 290, 330, 340, 380, 400, 420, 390, 410, 430, 450, 480, 500, 460, 470, 490, 520, 550, 580, 600, 620, 650],
            backgroundColor: '#0B2C4D',
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 8 } } },
          y: { grid: { color: '#F1F5F9' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 8 } } }
        }
      }
    });
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
