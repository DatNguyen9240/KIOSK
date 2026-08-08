/**
 * PARKING.GO Main Application Entry
 */

import { Router } from './core/router.js';
import { initVehicleSearchModule } from './modules/vehicle-search/index.js';
import { initMonthlyRenewalModule } from './modules/monthly-renewal/index.js';
import { initDebtReportModule } from './modules/debt-report/index.js';
import { initKioskTouchModule } from './modules/kiosk/index.js';
import { initMobileGateModule } from './modules/mobile-gate/index.js';
import { toast } from './components/toast.js';
import { UISelect } from './components/ui-select.js';
import { UIDatepicker } from './components/ui-datepicker.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainContentContainer = document.getElementById('main-app-content');

  // Header Datepicker & Tower Select initialization
  const headerDateContainer = document.getElementById('header-date-picker');
  if (headerDateContainer) {
    new UIDatepicker({
      container: headerDateContainer,
      mode: 'range',
      defaultDate: ['2024-05-01', '2024-05-08'],
      onChange: (dates, str) => {
        toast.show(`Lọc dữ liệu từ ${str}`, 'info');
      }
    });
  }

  const headerTowerContainer = document.getElementById('header-tower-select');
  if (headerTowerContainer) {
    new UISelect({
      container: headerTowerContainer,
      options: [
        { value: 'ALL', label: 'Tất cả tháp' },
        { value: 'A1', label: 'Tháp A1' },
        { value: 'A2', label: 'Tháp A2' },
        { value: 'A3', label: 'Tháp A3' }
      ],
      value: 'ALL',
      onChange: (val, label) => {
        toast.show(`Đã chọn: ${label}`, 'info');
      }
    });
  }

  // Sidebar navigation active state handler
  function setActiveNav(hash) {
    const navItems = document.querySelectorAll('#sidebar-nav .nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href === hash || (hash === '' && href === '#/dashboard')) {
        item.className = 'nav-item active flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0B2C4D] text-white font-bold text-xs shadow-md shadow-[#0B2C4D]/20 transition duration-150';
      } else {
        item.className = 'nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition duration-150';
      }
    });
  }

  // Render Full Integrated Dashboard (Overview route #/dashboard)
  function renderDashboardShowcase(container) {
    container.innerHTML = `
      <!-- 4 STAT CARDS ROW (Unified Single Card Panel with Trimmed Inset Dividers) -->
      <div class="bg-white rounded-3xl border border-slate-200/70 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
        
        <!-- Stat Item 1 -->
        <div class="p-5 flex items-center justify-between relative">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 block">Doanh thu hôm nay</span>
            <div class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">52.850.000 đ</div>
            <span class="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
              <span>▲ 7.8%</span> <span class="text-slate-400 font-normal">so với hôm qua</span>
            </span>
          </div>
          <img src="assets/images/money.png" alt="Money Wallet 3D Icon" class="w-14 h-14 object-contain shrink-0" />
          <div class="hidden sm:block absolute right-0 top-4 bottom-4 w-[1px] bg-slate-200/80"></div>
        </div>

        <!-- Stat Item 2 -->
        <div class="p-5 flex items-center justify-between relative">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 block">Công nợ cần thu</span>
            <div class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">128.450.000 đ</div>
            <span class="text-[11px] font-medium text-slate-400 block">248 khoản nợ</span>
          </div>
          <img src="assets/images/report (1).png" alt="Debt 3D Icon" class="w-14 h-14 object-contain shrink-0" />
          <div class="hidden sm:block absolute right-0 top-4 bottom-4 w-[1px] bg-slate-200/80"></div>
        </div>

        <!-- Stat Item 3 -->
        <div class="p-5 flex items-center justify-between relative">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 block">Thẻ sắp hết hạn</span>
            <div class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">86 thẻ</div>
            <span class="text-[11px] font-medium text-slate-400 block">Trong 7 ngày tới</span>
          </div>
          <img src="assets/images/report (2).png" alt="Cards Expiring 3D Icon" class="w-14 h-14 object-contain shrink-0" />
          <div class="hidden sm:block absolute right-0 top-4 bottom-4 w-[1px] bg-slate-200/80"></div>
        </div>

        <!-- Stat Item 4 -->
        <div class="p-5 flex items-center justify-between relative">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 block">Giao dịch online</span>
            <div class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">68 giao dịch</div>
            <span class="text-[11px] font-medium text-slate-400 block">Tổng 24.550.000 đ</span>
          </div>
          <img src="assets/images/report (3).png" alt="Online Transactions 3D Icon" class="w-14 h-14 object-contain shrink-0" />
        </div>

      </div>

      <!-- MIDDLE ROW: CHARTS SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- LINE CHART CARD (Col 8) -->
        <div class="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-slate-900 text-sm md:text-base">Doanh thu theo ngày</h3>
            <select class="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 focus:outline-none">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>

          <!-- SVG Revenue Line Chart with Gradient Fill & Active Node Tooltip -->
          <div class="relative h-[220px] w-full pt-4">
            <svg class="w-full h-full overflow-visible" viewBox="0 0 600 180">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00A8CC" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#00A8CC" stop-opacity="0.0"/>
                </linearGradient>
              </defs>

              <!-- Grid Lines -->
              <line x1="40" y1="20" x2="580" y2="20" stroke="#F1F5F9" stroke-width="1.5" />
              <text x="30" y="24" text-anchor="end" class="text-[10px] fill-slate-400 font-semibold">60M</text>

              <line x1="40" y1="55" x2="580" y2="55" stroke="#F1F5F9" stroke-width="1.5" />
              <text x="30" y="59" text-anchor="end" class="text-[10px] fill-slate-400 font-semibold">45M</text>

              <line x1="40" y1="90" x2="580" y2="90" stroke="#F1F5F9" stroke-width="1.5" />
              <text x="30" y="94" text-anchor="end" class="text-[10px] fill-slate-400 font-semibold">30M</text>

              <line x1="40" y1="125" x2="580" y2="125" stroke="#F1F5F9" stroke-width="1.5" />
              <text x="30" y="129" text-anchor="end" class="text-[10px] fill-slate-400 font-semibold">10M</text>

              <line x1="40" y1="160" x2="580" y2="160" stroke="#E2E8F0" stroke-width="1.5" />
              <text x="30" y="164" text-anchor="end" class="text-[10px] fill-slate-400 font-semibold">0</text>

              <!-- Gradient Fill Area -->
              <polygon points="
                60,140
                140,115
                220,125
                300,85
                380,105
                460,70
                540,32
                540,160
                60,160" 
                fill="url(#chartGradient)" />

              <!-- Polyline Smooth Curve -->
              <polyline fill="none" stroke="#00A8CC" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
                points="
                  60,140
                  140,115
                  220,125
                  300,85
                  380,105
                  460,70
                  540,32" />

              <!-- Data Dots -->
              <circle cx="60" cy="140" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="140" cy="115" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="220" cy="125" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="300" cy="85" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="380" cy="105" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="460" cy="70" r="4" fill="#FFFFFF" stroke="#00A8CC" stroke-width="2.5" />
              <circle cx="540" cy="32" r="5" fill="#00A8CC" stroke="#FFFFFF" stroke-width="2.5" />

              <!-- Active Tooltip Pill on 08/05 (Matching demo-ui.png) -->
              <g transform="translate(475, 8)">
                <rect width="95" height="24" rx="12" fill="#00A8CC" />
                <text x="47.5" y="16" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="800">52.850.000 đ</text>
              </g>

              <!-- X-Axis Labels -->
              <text x="60" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">02/05</text>
              <text x="140" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">03/05</text>
              <text x="220" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">04/05</text>
              <text x="300" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">05/05</text>
              <text x="380" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">06/05</text>
              <text x="460" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">07/05</text>
              <text x="540" y="176" text-anchor="middle" class="text-[10px] fill-slate-500 font-semibold">08/05</text>
            </svg>
          </div>
        </div>

        <!-- DONUT CHART CARD (Col 4 - Tower Breakdown) -->
        <div class="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card flex flex-col justify-between space-y-4">
          <h3 class="font-extrabold text-slate-900 text-sm md:text-base">Tower Breakdown</h3>

          <!-- SVG Donut Chart with Center Text -->
          <div class="relative flex items-center justify-center my-2">
            <svg class="w-40 h-40" viewBox="0 0 100 100">
              <!-- Segment 1: Tháp A1 (45%) -> Navy -->
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0B2C4D" stroke-width="14" stroke-dasharray="107.4 131.3" stroke-dashoffset="0" />
              <!-- Segment 2: Tháp A2 (36%) -> Teal -->
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#00A8CC" stroke-width="14" stroke-dasharray="85.9 152.8" stroke-dashoffset="-107.4" />
              <!-- Segment 3: Tháp A3 (15%) -> Light Green -->
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#7CB342" stroke-width="14" stroke-dasharray="35.8 202.9" stroke-dashoffset="-193.3" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span class="text-xs text-slate-400 font-bold">Tổng</span>
              <span class="text-lg font-black text-slate-900 leading-tight">268.8 Tỷ</span>
            </div>
          </div>

          <!-- Legends Breakdown List -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between text-xs font-semibold">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0B2C4D]"></span>
                <span class="text-slate-700">Tháp A1</span>
              </div>
              <span class="font-bold text-slate-900">45%</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00A8CC]"></span>
                <span class="text-slate-700">Tháp A2</span>
              </div>
              <span class="font-bold text-slate-900">36%</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7CB342]"></span>
                <span class="text-slate-700">Tháp A3</span>
              </div>
              <span class="font-bold text-slate-900">15%</span>
            </div>
          </div>
        </div>

      </div>

      <!-- DEBT REPORT TABLE CARD (Báo cáo công nợ - Exact matching demo-ui.png) -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card space-y-4">
        
        <!-- Header & Action Row -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 class="font-extrabold text-slate-900 text-sm md:text-base">Báo cáo công nợ</h3>
          <button id="excel-export-top" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            <span>Xuất Excel</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative">
          <input type="text" id="debt-table-search" placeholder="Tìm tên cư dân, biển số..." class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>

        <!-- Data Table (Exact 5 rows matching demo-ui.png) -->
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th class="py-3 px-4 rounded-l-2xl">Cư dân</th>
                <th class="py-3 px-4">Biển số</th>
                <th class="py-3 px-4">Căn hộ</th>
                <th class="py-3 px-4">Gói giữ xe</th>
                <th class="py-3 px-4">Hết hạn</th>
                <th class="py-3 px-4 rounded-r-2xl">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-semibold text-slate-800" id="debt-table-body">
              
              <!-- Row 1 -->
              <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">Trần Văn Toàn</td>
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800">30F-124.55</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">A1-1005</span></td>
                <td class="py-3.5 px-4 text-slate-600">Xe máy - 8 tháng</td>
                <td class="py-3.5 px-4 text-slate-500">18/05/2024</td>
                <td class="py-3.5 px-4">
                  <span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-block">Đã thanh toán</span>
                </td>
              </tr>

              <!-- Row 2 -->
              <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">Nguyễn Thị Hằng</td>
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800">378-788-10</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">A3-0000</span></td>
                <td class="py-3.5 px-4 text-slate-600">Ô tô - 12 tháng</td>
                <td class="py-3.5 px-4 text-slate-500">20/05/2024</td>
                <td class="py-3.5 px-4">
                  <span class="px-3 py-1 bg-[#FEF0C7] text-[#DC6803] rounded-full font-extrabold text-[11px] inline-block">Chờ thanh toán</span>
                </td>
              </tr>

              <!-- Row 3 -->
              <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">Lù Văn Nam</td>
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800">514-222 22</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">A1-0012</span></td>
                <td class="py-3.5 px-4 text-slate-600">Ô tô - 3 tháng</td>
                <td class="py-3.5 px-4 text-slate-500">38/05/2024</td>
                <td class="py-3.5 px-4">
                  <span class="px-3 py-1 bg-[#FEE4E2] text-[#D92D20] rounded-full font-extrabold text-[11px] inline-block">Quá hạn</span>
                </td>
              </tr>

              <!-- Row 4 -->
              <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">Phạm Quang Huy</td>
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800">95C-867-89</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">A1-1006</span></td>
                <td class="py-3.5 px-4 text-slate-600">Xe máy - 1 tháng</td>
                <td class="py-3.5 px-4 text-slate-500">10/05/2024</td>
                <td class="py-3.5 px-4">
                  <span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-block">Đã thanh toán</span>
                </td>
              </tr>

              <!-- Row 5 -->
              <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">Vũ Phú Hùng</td>
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800">294-456-87</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">A1-1101</span></td>
                <td class="py-3.5 px-4 text-slate-600">Ô tô - 5 tháng</td>
                <td class="py-3.5 px-4 text-slate-500">10/05/2054</td>
                <td class="py-3.5 px-4">
                  <span class="px-3 py-1 bg-[#FEE4E2] text-[#912018] rounded-full font-extrabold text-[11px] inline-block">Nợ xấu</span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        <!-- Table Pagination Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
          <div>1 - 5 / 348</div>
          <div class="flex items-center gap-1.5">
            <button class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">‹</button>
            <button class="w-8 h-8 rounded-xl bg-[#0B2C4D] text-white font-bold flex items-center justify-center shadow-sm">1</button>
            <button class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">2</button>
            <button class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">3</button>
            <span class="px-1 text-slate-400">...</span>
            <button class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">30</button>
            <button class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">›</button>
          </div>
        </div>

      </div>

      <!-- SHOWCASE MODULE PANELS (3 COLUMNS) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- CARD 1: Check-in / Check-out QR Payment (Col 4) -->
        <div class="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
            <h4 class="font-extrabold text-slate-900 text-xs">Thanh toán giữ xe online (Check-in/out)</h4>
          </div>

          <!-- Input plate & search (Harmonized design system) -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input type="text" id="showcase-plate-1" value="357-124.35" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </div>
            <button id="showcase-search-1" class="px-4 py-2.5 bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition">Tra cứu</button>
          </div>

          <!-- Fee Calculation Box -->
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

          <!-- QR Code Preview -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=PARKING_GO_30000" alt="QR Code Payment" class="w-28 h-28 mx-auto rounded-xl border border-slate-200 p-1 bg-white" />
            <p class="text-[10px] text-slate-400 font-medium leading-tight">Quét mã QR để thanh toán khẩn cấp qua các ngân hàng & ví điện tử</p>
            
            <!-- Bank Logos Badges -->
            <div class="flex items-center justify-center gap-1.5 pt-1">
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[9px]">Vietcombank</span>
              <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-black rounded text-[9px]">BIDV</span>
              <span class="px-2 py-0.5 bg-pink-100 text-pink-800 font-black rounded text-[9px]">MoMo</span>
              <span class="px-2 py-0.5 bg-sky-100 text-sky-800 font-black rounded text-[9px]">ZaloPay</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <button id="showcase-pay-now-btn" class="py-2.5 bg-[#7CB342] hover:bg-[#689F38] text-white font-extrabold text-xs rounded-2xl shadow-md transition">Thanh toán ngay</button>
            <button id="showcase-cancel-btn" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition">Hủy yêu cầu</button>
          </div>
        </div>

        <!-- CARD 2: Tra cứu phương tiện (Nhân viên quản lý) (Col 4) -->
        <div class="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h4 class="font-extrabold text-slate-900 text-xs">Tra cứu phương tiện (Nhân viên quản lý)</h4>
          </div>

          <!-- Search input (Harmonized design system) -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input type="text" id="showcase-plate-2" value="307-123.45" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </div>
            <button id="showcase-search-2" class="px-4 py-2.5 bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition">Tìm kiếm</button>
          </div>

          <!-- Resident Info Header -->
          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              TH
            </div>
            <div>
              <div class="font-bold text-slate-900 text-xs">Trần Minh Hiền</div>
              <div class="text-[10px] text-slate-400 font-medium">SĐT: 0927.354.387 • Tháp A1-1005</div>
            </div>
          </div>

          <!-- Vehicle Table -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Danh sách xe đã đăng ký</span>
            
            <div class="space-y-1.5 text-xs">
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span>🛵</span>
                  <span class="font-mono font-bold text-slate-900">30F-121.46</span>
                </div>
                <span class="text-[10px] text-slate-500">Xe máy - 1 tầng</span>
                <span class="px-2 py-0.5 bg-[#D1FADF] text-[#027A48] font-bold text-[10px] rounded-md">Còn hiệu lực</span>
              </div>

              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                  <span class="font-mono font-bold text-slate-900">20G-476.49</span>
                </div>
                <span class="text-[10px] text-slate-500">Ô tô - 13 tháng</span>
                <span class="px-2 py-0.5 bg-[#D1FADF] text-[#027A48] font-bold text-[10px] rounded-md">Còn hiệu lực</span>
              </div>

              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-500 fill-current" viewBox="0 0 24 24"><path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  <span class="font-mono font-bold text-slate-900">29A.478.78</span>
                </div>
                <span class="text-[10px] text-slate-500">Xe máy - 1 tháng</span>
                <span class="px-2 py-0.5 bg-[#FEE4E2] text-[#D92D20] font-bold text-[10px] rounded-md">Quá hạn</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 3: Ứng dụng bảo vệ (Nhân viên kiểm soát) (Col 4) -->
        <div class="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            <h4 class="font-extrabold text-slate-900 text-xs">Ứng dụng bảo vệ (Nhân viên kiểm soát)</h4>
          </div>

          <!-- Two Smartphone App Screens Side-by-Side (Exact visual matching demo-ui.png) -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            
            <!-- Mobile Phone 1 -->
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

            <!-- Mobile Phone 2 -->
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

    // Add interactivity to showcase buttons
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

  // Setup client-side router
  const router = new Router({
    '#/dashboard': () => {
      setActiveNav('#/dashboard');
      renderDashboardShowcase(mainContentContainer);
    },
    '#/search': () => {
      setActiveNav('#/search');
      initVehicleSearchModule(mainContentContainer);
    },
    '#/revenue': () => {
      setActiveNav('#/revenue');
      initMonthlyRenewalModule(mainContentContainer);
    },
    '#/transactions': () => {
      setActiveNav('#/transactions');
      initMonthlyRenewalModule(mainContentContainer);
    },
    '#/debt': () => {
      setActiveNav('#/debt');
      initDebtReportModule(mainContentContainer);
    },
    '#/cards': () => {
      setActiveNav('#/cards');
      initMonthlyRenewalModule(mainContentContainer);
    },
    '#/residents': () => {
      setActiveNav('#/residents');
      initVehicleSearchModule(mainContentContainer);
    },
    '#/vehicle-access': () => {
      setActiveNav('#/vehicle-access');
      initVehicleSearchModule(mainContentContainer);
    },
    '#/reports': () => {
      setActiveNav('#/reports');
      initDebtReportModule(mainContentContainer);
    },
    '#/kiosk': () => {
      setActiveNav('#/kiosk');
      initKioskTouchModule(mainContentContainer);
    },
    '#/mobile': () => {
      setActiveNav('#/mobile');
      initMobileGateModule(mainContentContainer);
    },
    '#/settings': () => {
      setActiveNav('#/settings');
      initKioskTouchModule(mainContentContainer);
    }
  });

  // Default initial render on load
  renderDashboardShowcase(mainContentContainer);

  // Sidebar payment button event
  const sidebarPayBtn = document.getElementById('sidebar-pay-btn');
  if (sidebarPayBtn) {
    sidebarPayBtn.onclick = () => {
      toast.show('Đang mở cổng thanh toán cho thẻ 30F-122.45...', 'info');
    };
  }

  // Top excel export button
  const topExcelBtn = document.getElementById('excel-export-top');
  if (topExcelBtn) {
    topExcelBtn.onclick = () => {
      toast.show('Đã xuất file báo cáo công nợ Excel thành công!', 'success');
    };
  }
});

