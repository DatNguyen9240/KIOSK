/**
 * PARKING.GO Dashboard Overview Module
 */

import { initRevenueChart, initTowerDonutChart } from '#components/ui-chart.js';
import { UISelect } from '#components/ui-select.js';
import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';
import { smoothScrollTo } from '#utils/smooth-scroll.js';

export function initDashboardModule(container) {
  if (!container) return;

  container.innerHTML = `
    <!-- 4 STAT CARDS ROW (Compact 2x2 Grid on Mobile, 4-Cols on Desktop) -->
    <div class="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card grid grid-cols-2 lg:grid-cols-4 overflow-hidden divide-x divide-y divide-slate-100">
      
      <!-- Stat Item 1 -->
      <div class="p-3 sm:p-5 flex items-center justify-between relative min-w-0">
        <div class="space-y-0.5 sm:space-y-1 min-w-0 pr-1 sm:pr-2">
          <span class="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">Doanh thu hôm nay</span>
          <div class="text-xs sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">52.850.000 đ</div>
          <span class="text-[9px] sm:text-[11px] font-bold text-emerald-600 inline-flex items-center gap-0.5">
            <span>▲ 7.8%</span> <span class="text-slate-400 font-normal hidden sm:inline">so với hôm qua</span>
          </span>
        </div>
        <img src="assets/images/money.png" alt="Money Wallet 3D Icon" class="w-9 h-9 sm:w-14 sm:h-14 object-contain shrink-0" />
      </div>

      <!-- Stat Item 2 -->
      <div class="p-3 sm:p-5 flex items-center justify-between relative min-w-0">
        <div class="space-y-0.5 sm:space-y-1 min-w-0 pr-1 sm:pr-2">
          <span class="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">Công nợ cần thu</span>
          <div class="text-xs sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">128.450.000 đ</div>
          <span class="text-[9px] sm:text-[11px] font-medium text-slate-400 block">248 khoản nợ</span>
        </div>
        <img src="assets/images/report (1).png" alt="Debt 3D Icon" class="w-9 h-9 sm:w-14 sm:h-14 object-contain shrink-0" />
      </div>

      <!-- Stat Item 3 -->
      <div class="p-3 sm:p-5 flex items-center justify-between relative min-w-0">
        <div class="space-y-0.5 sm:space-y-1 min-w-0 pr-1 sm:pr-2">
          <span class="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">Thẻ sắp hết hạn</span>
          <div class="text-xs sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">86 thẻ</div>
          <span class="text-[9px] sm:text-[11px] font-medium text-slate-400 block">Trong 7 ngày tới</span>
        </div>
        <img src="assets/images/report (2).png" alt="Cards Expiring 3D Icon" class="w-9 h-9 sm:w-14 sm:h-14 object-contain shrink-0" />
      </div>

      <!-- Stat Item 4 -->
      <div class="p-3 sm:p-5 flex items-center justify-between relative min-w-0">
        <div class="space-y-0.5 sm:space-y-1 min-w-0 pr-1 sm:pr-2">
          <span class="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">Giao dịch online</span>
          <div class="text-xs sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">68 giao dịch</div>
          <span class="text-[9px] sm:text-[11px] font-medium text-slate-400 block truncate">Tổng 24.550.000 đ</span>
        </div>
        <img src="assets/images/report (3).png" alt="Online Transactions 3D Icon" class="w-9 h-9 sm:w-14 sm:h-14 object-contain shrink-0" />
      </div>

    </div>

    <!-- MIDDLE ROW: CHARTS SECTION -->
    <div class="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <h3 class="font-extrabold text-slate-900 text-sm md:text-base">Báo cáo & Phân tích</h3>
          <div class="flex lg:hidden bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
            <button type="button" id="m-chart-tab-line" class="px-2.5 py-1 rounded-lg bg-[#0B2C4D] text-white shadow-xs transition">Doanh thu</button>
            <button type="button" id="m-chart-tab-donut" class="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition">Tỷ lệ Tháp</button>
          </div>
        </div>
        <div id="chart-timeframe-select-wrap" class="w-32 self-end sm:self-center"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div id="line-chart-panel" class="lg:col-span-7 space-y-2">
          <h4 class="text-xs font-bold text-slate-500 hidden lg:block">Doanh thu theo ngày</h4>
          <div class="relative h-[200px] sm:h-[220px] w-full pt-1">
            <canvas id="revenue-chart-canvas"></canvas>
          </div>
        </div>

        <div id="donut-chart-panel" class="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-3 pt-4 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-5">
          <h4 class="text-xs font-bold text-slate-500 hidden lg:block">Tỷ lệ theo Tháp</h4>
          <div class="relative flex items-center justify-center h-40 my-1">
            <canvas id="tower-donut-canvas"></canvas>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
              <div id="donut-center-label" class="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 leading-none">TỔNG DOANH THU</div>
              <div id="donut-center-val" class="text-base font-black text-[#0B2C4D] leading-none">258.04 Tỷ</div>
            </div>
          </div>

          <div class="space-y-1.5 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between text-xs font-semibold hover:bg-slate-50 p-1 rounded-xl transition cursor-pointer">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0B2C4D]"></span>
                <span class="text-slate-700">Tháp A1</span>
              </div>
              <span class="font-bold text-slate-900">45% (120.96 Tỷ)</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold hover:bg-slate-50 p-1 rounded-xl transition cursor-pointer">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00A8CC]"></span>
                <span class="text-slate-700">Tháp A2</span>
              </div>
              <span class="font-bold text-slate-900">36% (96.76 Tỷ)</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold hover:bg-slate-50 p-1 rounded-xl transition cursor-pointer">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7CB342]"></span>
                <span class="text-slate-700">Tháp A3</span>
              </div>
              <span class="font-bold text-slate-900">15% (40.32 Tỷ)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DEBT REPORT TABLE CARD -->
    <div class="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 class="font-extrabold text-slate-900 text-sm md:text-base">Báo cáo công nợ</h3>
        <button id="excel-export-top" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span>Xuất Excel</span>
        </button>
      </div>

      <div class="relative">
        <input type="text" id="debt-table-search" placeholder="Tìm tên cư dân, biển số, căn hộ..." class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      </div>

      <div id="dashboard-debt-table-wrap"></div>
    </div>

    <!-- SHOWCASE MODULE PANELS (3 COLUMNS) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- CARD 1 -->
      <div class="lg:col-span-4 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
          <h4 class="font-extrabold text-slate-900 text-xs">Thanh toán giữ xe online (Check-in/out)</h4>
        </div>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <input type="text" id="showcase-plate-1" value="357-124.35" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </div>
          <button id="showcase-search-1" class="px-4 py-2.5 bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition">Tra cứu</button>
        </div>

        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Thời gian vào:</span>
            <span class="font-bold text-slate-800">08/05/2024 07:45</span>
          </div>
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Thời gian gửi:</span>
            <span class="font-bold text-slate-800">1 giờ 45 phút</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span class="font-bold text-slate-700">Tổng tiền giữ xe:</span>
            <span class="text-base font-black text-emerald-600">30.000 đ</span>
          </div>
        </div>

        <div id="showcase-qr-box" class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=PARKING_GO_30000" alt="QR Code Payment" class="w-28 h-28 mx-auto rounded-xl border border-slate-200 p-1 bg-white" />
          <p class="text-[10px] text-slate-400 font-medium leading-tight">Quét mã QR để thanh toán khẩn cấp qua các ngân hàng & ví điện tử</p>
          
          <div class="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[9px]">Vietcombank</span>
            <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-black rounded text-[9px]">BIDV</span>
            <span class="px-2 py-0.5 bg-pink-100 text-pink-800 font-black rounded text-[9px]">MoMo</span>
            <span class="px-2 py-0.5 bg-sky-100 text-sky-800 font-black rounded text-[9px]">ZaloPay</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button id="showcase-pay-now-btn" class="py-2.5 bg-[#7CB342] hover:bg-[#689F38] text-white font-extrabold text-xs rounded-2xl shadow-md transition">Thanh toán ngay</button>
          <button id="showcase-cancel-btn" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition">Hủy yêu cầu</button>
        </div>
      </div>

      <!-- CARD 2 -->
      <div class="lg:col-span-4 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
          <h4 class="font-extrabold text-slate-900 text-xs">Tra cứu phương tiện (Nhân viên quản lý)</h4>
        </div>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <input type="text" id="showcase-plate-2" value="307-123.45" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </div>
          <button id="showcase-search-2" class="px-4 py-2.5 bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition">Tìm kiếm</button>
        </div>

        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            TH
          </div>
          <div>
            <div class="font-bold text-slate-900 text-xs">Trần Minh Hiền</div>
            <div class="text-[10px] text-slate-400 font-medium">SĐT: 0927.354.387 • Tháp A1-1005</div>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Danh sách xe đã đăng ký</span>
          
          <div class="space-y-1.5 text-xs">
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap sm:flex-nowrap gap-1">
              <div class="flex items-center gap-2 min-w-0">
                <span>🛵</span>
                <span class="font-mono font-bold text-slate-900 truncate">30F-121.46</span>
              </div>
              <span class="text-[10px] text-slate-500 whitespace-nowrap">Xe máy - 1 tầng</span>
              <span class="px-2 py-0.5 bg-[#D1FADF] text-[#027A48] font-bold text-[10px] rounded-md whitespace-nowrap">Còn hiệu lực</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap sm:flex-nowrap gap-1">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-4 h-4 text-blue-600 fill-current shrink-0" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                <span class="font-mono font-bold text-slate-900 truncate">20G-476.49</span>
              </div>
              <span class="text-[10px] text-slate-500 whitespace-nowrap">Ô tô - 13 tháng</span>
              <span class="px-2 py-0.5 bg-[#D1FADF] text-[#027A48] font-bold text-[10px] rounded-md whitespace-nowrap">Còn hiệu lực</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap sm:flex-nowrap gap-1">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-4 h-4 text-slate-500 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span class="font-mono font-bold text-slate-900 truncate">29A.478.78</span>
              </div>
              <span class="text-[10px] text-slate-500 whitespace-nowrap">Xe máy - 1 tháng</span>
              <span class="px-2 py-0.5 bg-[#FEE4E2] text-[#D92D20] font-bold text-[10px] rounded-md whitespace-nowrap">Quá hạn</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 3 -->
      <div class="lg:col-span-4 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
          <h4 class="font-extrabold text-slate-900 text-xs">Ứng dụng bảo vệ (Nhân viên kiểm soát)</h4>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
          <div class="bg-slate-900 rounded-[24px] p-2.5 border-4 border-slate-800 shadow-lg text-white space-y-2 select-none">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[9px] text-slate-400 font-bold">
              <span>‹ Duyệt - Bãi xe</span>
              <span>07:45</span>
            </div>
            <div class="space-y-1.5 py-1">
              <button class="w-full p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 3a5 5 0 100 10 5 5 0 000-10z"/></svg> <span>Quét QR</span>
              </button>
              <button class="w-full p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-teal-400 fill-current" viewBox="0 0 24 24"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zM5 8h2v2H5V8zm0 3h2v2H5v-2zm11 6H8v-2h8v2zm1-3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg> <span>Nhập biển số</span>
              </button>
              <button class="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black shadow text-center flex items-center justify-center gap-1">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg> <span>MỞ BARIE</span>
              </button>
            </div>
          </div>

          <div class="bg-slate-900 rounded-[24px] p-2.5 border-4 border-slate-800 shadow-lg text-white space-y-2 select-none">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[9px] text-slate-400 font-bold">
              <span>‹ Biển số xe</span>
              <span>07:45</span>
            </div>
            <div class="bg-slate-800/80 p-2 rounded-xl text-center space-y-1 my-1">
              <div class="text-[9px] text-slate-400">Biển số nhận diện</div>
              <div class="text-xs font-mono font-bold text-emerald-400 tracking-wider">30F-123.45</div>
              <div class="text-[9px] text-slate-300">Xe đã đăng ký • Khởi tạo</div>
            </div>
            <button class="w-full p-2 bg-[#0B2C4D] hover:bg-slate-800 rounded-xl text-[10px] font-bold text-center">
              Mở cổng xe vào
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Mobile Chart Tab Switcher (< lg)
  const mTabLine = container.querySelector('#m-chart-tab-line');
  const mTabDonut = container.querySelector('#m-chart-tab-donut');
  const linePanel = container.querySelector('#line-chart-panel');
  const donutPanel = container.querySelector('#donut-chart-panel');

  if (mTabLine && mTabDonut && linePanel && donutPanel) {
    mTabLine.onclick = () => {
      mTabLine.className = 'px-2.5 py-1 rounded-lg bg-[#0B2C4D] text-white shadow-xs transition';
      mTabDonut.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition';
      linePanel.classList.remove('hidden');
      donutPanel.classList.add('hidden');
    };

    mTabDonut.onclick = () => {
      mTabDonut.className = 'px-2.5 py-1 rounded-lg bg-[#0B2C4D] text-white shadow-xs transition';
      mTabLine.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition';
      linePanel.classList.add('hidden');
      donutPanel.classList.remove('hidden');
      donutPanel.classList.add('flex');
    };
  }

  // Initialize Revenue Line Chart
  let revChartInstance = initRevenueChart(container.querySelector('#revenue-chart-canvas'), '7d');

  // Initialize Timeframe UISelect
  new UISelect({
    container: container.querySelector('#chart-timeframe-select-wrap'),
    options: [
      { value: '7d', label: '7 ngày qua' },
      { value: '30d', label: '30 ngày qua' }
    ],
    value: '7d',
    onChange: (val, label) => {
      if (revChartInstance) revChartInstance.destroy();
      revChartInstance = initRevenueChart(container.querySelector('#revenue-chart-canvas'), val);
      toast.show(`Cập nhật biểu đồ doanh thu: ${label}`, 'info');
    }
  });

  // Donut Center Text Dynamic Elements
  const donutLabel = container.querySelector('#donut-center-label');
  const donutVal = container.querySelector('#donut-center-val');

  const towerInfo = [
    { label: 'THÁP A1 (45%)', val: '120.96 Tỷ' },
    { label: 'THÁP A2 (36%)', val: '96.76 Tỷ' },
    { label: 'THÁP A3 (15%)', val: '40.32 Tỷ' }
  ];

  initTowerDonutChart(container.querySelector('#tower-donut-canvas'), (idx) => {
    if (!donutLabel || !donutVal) return;
    if (idx !== null && towerInfo[idx]) {
      donutLabel.textContent = towerInfo[idx].label;
      donutVal.textContent = towerInfo[idx].val;
    } else {
      donutLabel.textContent = 'TỔNG DOANH THU';
      donutVal.textContent = '258.04 Tỷ';
    }
  });

  // Initialize UITable for Dashboard Debt Table
  const dashboardDebtData = [
    { residentName: 'Trần Văn Toàn', plateNumber: '30F-124.55', apartmentNumber: 'A1-1005', packageType: 'Xe máy - 8 tháng', dueDate: '18/05/2024', status: 'PAID' },
    { residentName: 'Nguyễn Thị Hằng', plateNumber: '378-788-10', apartmentNumber: 'A3-0000', packageType: 'Ô tô - 12 tháng', dueDate: '20/05/2024', status: 'PENDING' },
    { residentName: 'Lù Văn Nam', plateNumber: '514-222 22', apartmentNumber: 'A1-0012', packageType: 'Ô tô - 3 tháng', dueDate: '28/05/2024', status: 'EXPIRING_SOON' },
    { residentName: 'Phạm Quang Huy', plateNumber: '95C-867-89', apartmentNumber: 'A1-1006', packageType: 'Xe máy - 1 tháng', dueDate: '10/05/2024', status: 'PAID' },
    { residentName: 'Vũ Phú Hùng', plateNumber: '294-456-87', apartmentNumber: 'A1-1101', packageType: 'Ô tô - 5 tháng', dueDate: '10/05/2054', status: 'EXPIRING_SOON' },
    { residentName: 'Hoàng Kim Anh', plateNumber: '30E-991.22', apartmentNumber: 'A2-0804', packageType: 'Ô tô - 6 tháng', dueDate: '01/06/2024', status: 'PAID' },
    { residentName: 'Đỗ Tiến Đạt', plateNumber: '29A-773.19', apartmentNumber: 'A2-1502', packageType: 'Xe máy - 12 tháng', dueDate: '15/05/2024', status: 'PENDING' }
  ];

  const dashboardTable = new UITable({
    container: container.querySelector('#dashboard-debt-table-wrap'),
    pageSize: 5,
    columns: [
      { key: 'residentName', title: 'Cư dân', sortable: true, classNames: 'font-bold text-slate-900' },
      { key: 'plateNumber', title: 'Biển số', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-slate-100/90 text-[#0B2C4D] font-mono font-bold rounded-lg border border-slate-200/50">${val}</span>` },
      { key: 'apartmentNumber', title: 'Căn hộ', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">${val}</span>` },
      { key: 'packageType', title: 'Gói giữ xe', sortable: true, classNames: 'text-slate-600' },
      { key: 'dueDate', title: 'Hết hạn', sortable: true, classNames: 'text-slate-500 font-semibold' },
      {
        key: 'status', title: 'Trạng thái', sortable: true, render: (val) => {
          if (val === 'PAID') return '<span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>Đã thanh toán</span>';
          if (val === 'PENDING') return '<span class="px-3 py-1 bg-[#FEF0C7] text-[#DC6803] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#DC6803]"></span>Chờ thanh toán</span>';
          return '<span class="px-3 py-1 bg-[#FEE4E2] text-[#D92D20] rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#D92D20]"></span>Sắp hết hạn</span>';
        }
      },
      {
        key: 'actions', title: 'Thao tác', render: (_, row) => `
          <button data-action="pay" class="px-3 py-1 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition">
            Thanh toán
          </button>
        `
      }
    ],
    data: dashboardDebtData,
    onRowAction: (action, rowData) => {
      if (action === 'pay') {
        toast.show(`Mở cổng thanh toán cho ${rowData.residentName} (${rowData.plateNumber})`, 'info');
      }
    }
  });

  const searchInput = container.querySelector('#debt-table-search');
  if (searchInput) {
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = dashboardDebtData.filter(d =>
        d.residentName.toLowerCase().includes(q) ||
        d.plateNumber.toLowerCase().includes(q) ||
        d.apartmentNumber.toLowerCase().includes(q)
      );
      dashboardTable.setData(filtered);
    };
  }

  // Interactivity handlers for showcase buttons
  const showcaseSearch1 = container.querySelector('#showcase-search-1');
  const showcaseQrBox = container.querySelector('#showcase-qr-box');
  if (showcaseSearch1) {
    showcaseSearch1.onclick = () => {
      toast.show('Đã khởi tạo mã QR thanh toán giữ xe!', 'info');
      if (showcaseQrBox) {
        smoothScrollTo(showcaseQrBox, 850);
      }
    };
  }

  const payNowBtn = container.querySelector('#showcase-pay-now-btn');
  if (payNowBtn) {
    payNowBtn.onclick = () => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in duration-200">
          <img src="assets/images/animated-icon.svg" alt="Transfer Complete" class="w-20 h-20 mx-auto" />
          <div>
            <h3 class="text-base font-black text-[#0B2C4D]">Xác nhận chuyển khoản thành công!</h3>
            <p class="text-xs text-slate-400 font-medium mt-1">Hệ thống đã nhận thanh toán 30.000 đ qua VietQR</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 font-semibold text-slate-700">
            <div class="flex justify-between"><span>Biển số:</span><span class="font-mono font-bold text-slate-900">357-124.35</span></div>
            <div class="flex justify-between"><span>Mã GD:</span><span class="font-mono font-bold text-emerald-600">VQR-${Date.now().toString().slice(-6)}</span></div>
          </div>
          <button type="button" id="close-transfer-modal" class="w-full bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs transition">
            Đóng thông báo
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#close-transfer-modal').onclick = () => modal.remove();
      toast.show('Xác nhận thanh toán giữ xe thành công!', 'success');
    };
  }

  const cancelBtn = container.querySelector('#showcase-cancel-btn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      toast.show('Đã hủy yêu cầu thanh toán', 'info');
    };
  }
}
