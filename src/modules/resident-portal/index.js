/**
 * Resident Self-Service Portal Module
 * Clean, Flat, Modern UI (Eliminated redundant nested card layers and double borders)
 */

import { MOCK_RESIDENTS, MOCK_VEHICLES } from '#core/mock-data.js';
import { formatCurrency } from '#utils/currency.js';
import { escapeHtml } from '#utils/sanitize.js';
import { toast } from '#components/toast.js';
import { validateVoucher } from '#services/voucher.service.js';
import { QrPaymentComponent } from '#components/qr-payment.js';
import { renderReceiptHtml } from '#components/receipt.js';
import { smoothScrollTo } from '#utils/smooth-scroll.js';

const VEHICLE_PHOTOS = {
  CAR: 'https://images.unsplash.com/photo-1722352108543-c22189140ef2?auto=format&fit=crop&w=900&q=80',
  MOTORBIKE: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=900&q=80'
};

const HISTORY_BY_PLATE = {
  '30F-123.45': [
    { inAt: '21/05/2024 08:15', outAt: '-', gate: 'A1 - Cổng 1', ticket: 'Thẻ tháng', fee: '-' },
    { inAt: '20/05/2024 18:22', outAt: '20/05/2024 20:15', gate: 'A1 - Cổng 1', ticket: 'Thẻ tháng', fee: '-' }
  ],
  '51K-123.45': [
    { inAt: '21/05/2024 08:15', outAt: '-', gate: 'A1 - Cổng 1', ticket: 'Thẻ tháng', fee: '-' },
    { inAt: '20/05/2024 18:22', outAt: '20/05/2024 20:15', gate: 'A1 - Cổng 1', ticket: 'Thẻ tháng', fee: '-' }
  ]
};

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getResidentVehicles(resident) {
  return MOCK_VEHICLES.filter(vehicle => (
    vehicle.tenant_id === resident.tenant_id &&
    vehicle.residentName === resident.full_name
  ));
}

function vehicleStatus(vehicle) {
  if (vehicle.status === 'EXPIRED') return { label: 'Quá hạn', tone: 'danger' };
  if (vehicle.status === 'EXPIRING_SOON') return { label: 'Sắp hết hạn', tone: 'warn' };
  return { label: 'Đang trong bãi', tone: 'success' };
}

function historyForVehicle(vehicle) {
  return HISTORY_BY_PLATE[vehicle?.plateNumber] || HISTORY_BY_PLATE['30F-123.45'] || [];
}

export function initResidentPortalModule(container) {
  if (!container) return;

  const resident = MOCK_RESIDENTS[0];
  const residentVehicles = getResidentVehicles(resident);

  let state = {
    view: 'SEARCH', // 'SEARCH' (Dashboard) or 'WIZARD' (Renewal)
    wizardStep: 2, // 1: Chọn xe, 2: Chọn thời gian, 3: Tính phí, 4: Thanh toán, 5: Hoàn tất
    query: residentVehicles[0]?.plateNumber || '30F-123.45',
    selectedVehicle: residentVehicles[0] || null,
    
    // Renewal options
    renewalType: 'MONTH',
    startMonth: '06/2024',
    endMonth: '08/2024',
    monthsCount: 3,
    
    // Voucher & Payment
    voucherCode: 'VOUCHER10',
    discountAmount: 120000,
    paymentMethod: 'VIETQR',
    transactionId: ''
  };

  let qrInstance = null;

  const pickVehicle = (queryStr) => {
    const needle = normalize(queryStr);
    if (!needle) return residentVehicles[0] || null;
    return residentVehicles.find(v => (
      normalize(v.plateNumber).includes(needle) ||
      normalize(v.residentName).includes(needle) ||
      normalize(v.apartmentNumber).includes(needle) ||
      normalize(v.cardNumber).includes(needle)
    )) || residentVehicles[0] || null;
  };

  const calculateFees = () => {
    const unitFee = state.selectedVehicle?.vehicleType === 'CAR' ? 400000 : 100000;
    const totalOriginal = unitFee * state.monthsCount;
    const totalFinal = Math.max(0, totalOriginal - state.discountAmount);
    return { unitFee, totalOriginal, totalFinal };
  };

  // ── RENDER DASHBOARD (FLAT & CLEAN UI) ────────────────────────────────────
  const renderDashboard = () => {
    const vehicle = state.selectedVehicle || residentVehicles[0];
    const history = vehicle ? historyForVehicle(vehicle) : [];

    return `
      <section class="resident-dashboard-page w-full">
        <!-- Single Clean Main Container -->
        <div class="bg-white p-4 sm:p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-card space-y-6 sm:space-y-8">
          
          <!-- Search Header -->
          <header class="space-y-4">
            <div class="border-b border-slate-100 pb-3">
              <p class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">CỔNG CƯ DÂN</p>
              <h2 class="text-lg sm:text-2xl font-black text-[#0B2C4D] tracking-tight">Tìm kiếm phương tiện & Gia hạn thẻ</h2>
            </div>

            <!-- Search input bar -->
            <div class="flex gap-2 w-full sm:max-w-2xl">
              <div class="flex-1 relative">
                <input
                  id="resident-search-input"
                  type="search"
                  value="${escapeHtml(state.query)}"
                  placeholder="Nhập biển số xe (VD: 30F-123.45)..."
                  class="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button id="resident-search-btn" type="button" class="px-4 py-2.5 sm:px-6 sm:py-3 bg-[#0B2C4D] hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md transition shrink-0">
                Tìm kiếm
              </button>
            </div>
          </header>

          ${vehicle ? `
            <!-- Vehicle Main View -->
            <article class="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center pt-2">
              
              <!-- Vehicle Visual Photo & Plate Badge -->
              <div class="md:col-span-4 flex flex-col items-center">
                <div class="w-full relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/60">
                  <img
                    src="${escapeHtml(VEHICLE_PHOTOS[vehicle.vehicleType] || VEHICLE_PHOTOS.CAR)}"
                    alt="Phương tiện"
                    class="w-full h-40 sm:h-44 object-cover"
                  />
                  <div class="absolute bottom-2 left-2 right-2 bg-[#0B2C4D]/90 backdrop-blur-xs text-white text-center py-2 rounded-xl font-mono font-black text-sm tracking-widest shadow-md">
                    ${escapeHtml(vehicle.plateNumber)}
                  </div>
                </div>
              </div>

              <!-- Vehicle Details & Quick Actions -->
              <div class="md:col-span-8 space-y-4">
                
                <!-- Plate & Status Header -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 class="font-black text-slate-900 text-lg sm:text-xl font-mono tracking-tight">${escapeHtml(vehicle.plateNumber)}</h3>
                    <p class="text-xs text-slate-400 font-semibold">${escapeHtml(vehicle.vehicleName || 'Honda CR-V')}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap ${vehicleStatus(vehicle).tone === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                    ● ${escapeHtml(vehicleStatus(vehicle).label)}
                  </span>
                </div>

                <!-- Flat 2x2 Meta Grid -->
                <dl class="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  <div class="bg-slate-50/80 p-2.5 sm:p-3 rounded-2xl">
                    <dt class="text-slate-400 font-medium text-[10px]">Chủ xe</dt>
                    <dd class="font-extrabold text-slate-900 mt-0.5 truncate">${escapeHtml(vehicle.residentName)}</dd>
                  </div>
                  <div class="bg-slate-50/80 p-2.5 sm:p-3 rounded-2xl">
                    <dt class="text-slate-400 font-medium text-[10px]">Căn hộ</dt>
                    <dd class="font-extrabold text-slate-900 mt-0.5 truncate">${escapeHtml(vehicle.apartmentNumber)}</dd>
                  </div>
                  <div class="bg-slate-50/80 p-2.5 sm:p-3 rounded-2xl">
                    <dt class="text-slate-400 font-medium text-[10px]">Loại thẻ</dt>
                    <dd class="font-extrabold text-slate-900 mt-0.5 truncate">Thẻ tháng (${escapeHtml(vehicle.cardNumber || 'CARD-8831')})</dd>
                  </div>
                  <div class="bg-slate-50/80 p-2.5 sm:p-3 rounded-2xl">
                    <dt class="text-slate-400 font-medium text-[10px]">Hạn thẻ hiện tại</dt>
                    <dd class="font-extrabold text-rose-600 mt-0.5">25/05/2024</dd>
                  </div>
                </dl>

                <!-- Actions -->
                <div class="flex items-center gap-2.5 sm:gap-3 pt-1">
                  <button id="resident-history-btn" type="button" class="flex-1 sm:flex-none px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl transition">
                    Lịch sử vào ra
                  </button>
                  <button id="resident-pay-btn" type="button" class="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                    <span>Thanh toán phí</span>
                  </button>
                </div>

              </div>
            </article>
          ` : ''}

          <!-- Recent History Section -->
          <section id="resident-history-section" class="space-y-3 pt-5 sm:pt-6 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <h3 class="font-black text-slate-900 text-sm">Lịch sử ra vào gần đây</h3>
              <span id="resident-history-link" class="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Xem tất cả</span>
            </div>
            <div class="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-100">
              <table class="w-full text-xs text-left min-w-[480px]">
                <thead class="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th class="py-2.5 px-3 whitespace-nowrap">Thời gian vào</th>
                    <th class="py-2.5 px-3 whitespace-nowrap">Thời gian ra</th>
                    <th class="py-2.5 px-3 whitespace-nowrap">Cổng</th>
                    <th class="py-2.5 px-3 whitespace-nowrap">Loại vé</th>
                    <th class="py-2.5 px-3 whitespace-nowrap">Phí</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">
                  ${history.map(row => `
                    <tr class="hover:bg-slate-50/80 transition">
                      <td class="py-2.5 px-3 whitespace-nowrap">${escapeHtml(row.inAt)}</td>
                      <td class="py-2.5 px-3 whitespace-nowrap">${escapeHtml(row.outAt)}</td>
                      <td class="py-2.5 px-3 whitespace-nowrap">${escapeHtml(row.gate)}</td>
                      <td class="py-2.5 px-3 whitespace-nowrap"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] inline-block">${escapeHtml(row.ticket)}</span></td>
                      <td class="py-2.5 px-3 whitespace-nowrap">${escapeHtml(row.fee)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Debt Summary Section -->
          <section class="space-y-3 pt-5 sm:pt-6 border-t border-slate-100">
            <h3 class="font-black text-slate-900 text-sm">Công nợ của chủ xe</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div class="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center">
                <span class="text-[11px] text-slate-400 font-semibold">Tổng công nợ</span>
                <strong class="text-sm sm:text-base font-black text-slate-900 mt-0 sm:mt-1 whitespace-nowrap">${formatCurrency(2100000)}</strong>
              </div>
              <div class="bg-amber-50/60 p-3.5 sm:p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center">
                <span class="text-[11px] text-amber-600 font-semibold">Sắp đến hạn</span>
                <strong class="text-sm sm:text-base font-black text-amber-700 mt-0 sm:mt-1 whitespace-nowrap">${formatCurrency(700000)}</strong>
              </div>
              <div class="bg-rose-50/60 p-3.5 sm:p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center">
                <span class="text-[11px] text-rose-600 font-semibold">Quá hạn</span>
                <strong class="text-sm sm:text-base font-black text-rose-700 mt-0 sm:mt-1 whitespace-nowrap">${formatCurrency(1400000)}</strong>
              </div>
            </div>
          </section>

        </div>
      </section>
    `;
  };

  // ── RENDER STEPPER HEADER ──────────────────────────────────────────────────
  const renderStepper = () => {
    const steps = [
      { num: 1, label: 'Chọn xe' },
      { num: 2, label: 'Chọn thời gian' },
      { num: 3, label: 'Tính phí' },
      { num: 4, label: 'Thanh toán' },
      { num: 5, label: 'Hoàn tất' }
    ];

    return `
      <div class="flex items-center justify-between w-full max-w-3xl mx-auto py-2">
        ${steps.map((s, idx) => {
          const isActive = state.wizardStep === s.num;
          const isDone = state.wizardStep > s.num;
          return `
            <div class="flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}">
              <div class="flex items-center gap-1.5 shrink-0 cursor-pointer" data-step="${s.num}">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }">
                  ${isDone ? '✓' : s.num}
                </span>
                <span class="text-xs font-bold transition-all ${
                  isActive ? 'text-blue-600 font-extrabold' : isDone ? 'text-slate-700' : 'text-slate-400'
                }">
                  ${s.label}
                </span>
              </div>
              ${idx < steps.length - 1 ? `
                <div class="flex-1 h-0.5 mx-2 ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}"></div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  // ── RENDER STEP 2: CHỌN THỜI GIAN (FLAT & CLEAN) ─────────────────────────
  const renderStep2View = () => {
    const vehicle = state.selectedVehicle || residentVehicles[0];
    const { totalOriginal } = calculateFees();

    return `
      <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-card space-y-6 w-full">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-xl font-black text-slate-900">Gia hạn thẻ tháng</h2>
            <p class="text-xs text-slate-400 font-semibold mt-0.5">Chọn khoảng thời gian và số tháng cần gia hạn</p>
          </div>
          <button id="wizard-cancel-btn" type="button" class="text-xs text-slate-400 hover:text-slate-600 font-bold underline">
            Quay lại Dashboard
          </button>
        </div>

        <!-- Stepper Bar -->
        ${renderStepper()}

        <!-- Main Content (Flat layout) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          
          <!-- Left Column: Vehicle Card -->
          <div class="md:col-span-5 space-y-3">
            <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Thẻ được chọn</span>
            <div class="rounded-2xl overflow-hidden border border-slate-200/60 shadow-xs text-center space-y-2 pb-3">
              <img src="${escapeHtml(VEHICLE_PHOTOS[vehicle.vehicleType] || VEHICLE_PHOTOS.CAR)}" alt="Vehicle" class="w-full h-36 object-cover" />
              <div class="font-mono font-black text-lg text-slate-900 tracking-wider">${escapeHtml(vehicle.plateNumber)}</div>
              <div class="text-xs text-slate-500 font-semibold">${vehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'} • CARD-8831</div>
            </div>
          </div>

          <!-- Right Column: Time Selection -->
          <div class="md:col-span-7 space-y-5">
            <h3 class="font-black text-slate-900 text-sm">Chọn thời gian gia hạn</h3>

            <!-- Radio Mode Group -->
            <div class="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="renewal-mode" value="MONTH" checked class="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span>Theo tháng</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="radio" name="renewal-mode" value="DAY" class="w-4 h-4 text-blue-600" />
                <span>Theo ngày</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="radio" name="renewal-mode" value="CUSTOM" class="w-4 h-4 text-blue-600" />
                <span>Từ ngày đến ngày</span>
              </label>
            </div>

            <!-- Month Dropdowns Block -->
            <div class="bg-slate-50/80 p-4 rounded-2xl space-y-3">
              <div class="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Từ tháng</label>
                  <select id="start-month-select" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none">
                    <option value="06/2024" selected>06/2024</option>
                    <option value="07/2024">07/2024</option>
                    <option value="08/2024">08/2024</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Đến tháng</label>
                  <select id="end-month-select" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none">
                    <option value="06/2024">06/2024 (1 tháng)</option>
                    <option value="07/2024">07/2024 (2 tháng)</option>
                    <option value="08/2024" selected>08/2024 (3 tháng)</option>
                    <option value="11/2024">11/2024 (6 tháng)</option>
                  </select>
                </div>
              </div>
              <div class="text-right text-xs font-bold text-blue-600">
                Gói chọn: <span id="months-count-label" class="font-extrabold text-slate-900">${state.monthsCount} tháng</span>
              </div>
            </div>

            <!-- Quick Duration Pills -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase block">Chọn nhanh số tháng</label>
              <div class="grid grid-cols-4 gap-2 text-xs font-bold">
                ${[1, 3, 6, 12].map(m => `
                  <button type="button" data-month-pill="${m}"
                    class="py-2.5 rounded-xl border transition ${state.monthsCount === m ? 'border-blue-600 bg-blue-50 text-blue-700 font-black' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                    ${m} Tháng
                  </button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Bar with Total Fee & Next Button -->
        <div class="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span class="text-xs text-slate-400 font-bold">Tổng phí: </span>
            <strong class="text-xl font-black text-blue-600 ml-1" id="step2-total-fee">${formatCurrency(totalOriginal)}</strong>
          </div>
          <button id="step2-continue-btn" type="button" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-lg transition">
            Tiếp tục
          </button>
        </div>

      </div>
    `;
  };

  // ── RENDER STEP 4: THANH TOÁN (FLAT & CLEAN) ──────────────────────────────
  const renderStep4View = () => {
    const vehicle = state.selectedVehicle || residentVehicles[0];
    const { totalOriginal, totalFinal } = calculateFees();

    return `
      <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-card space-y-6 w-full">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-xl font-black text-slate-900">Thanh toán</h2>
            <p class="text-xs text-slate-400 font-semibold mt-0.5">Xác nhận thông tin & Quét mã QR thanh toán</p>
          </div>
          <button id="step4-back-btn" type="button" class="text-xs text-slate-400 hover:text-slate-600 font-bold underline">
            ← Quay lại bước 2
          </button>
        </div>

        <!-- Stepper Bar -->
        ${renderStepper()}

        <!-- Grid: Left Invoice & Payment Method + Right QR Code -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          
          <!-- Left Column: Payment Info & Voucher & Method Selection -->
          <div class="md:col-span-6 space-y-5">
            <h3 class="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">Thông tin thanh toán</h3>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-400">Biển số:</span>
                <strong class="font-mono text-slate-900 text-sm font-black">${escapeHtml(vehicle.plateNumber)}</strong>
              </div>
              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-400">Loại vé:</span>
                <span class="font-bold text-slate-700">Thẻ tháng</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-400">Thời gian:</span>
                <span class="font-bold text-slate-700">01/06/2024 - 31/08/2024 (${state.monthsCount} tháng)</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-400">Phí giữ xe:</span>
                <span class="font-bold text-slate-900">${formatCurrency(totalOriginal)}</span>
              </div>

              <!-- Voucher Discount Line -->
              ${state.discountAmount > 0 ? `
                <div class="flex justify-between py-1.5 border-b border-slate-100 text-rose-600 font-bold">
                  <span>Giảm giá (${escapeHtml(state.voucherCode)}):</span>
                  <span>-${formatCurrency(state.discountAmount)}</span>
                </div>
              ` : ''}

              <!-- Total Payable Amount -->
              <div class="flex justify-between items-center pt-2">
                <span class="font-bold text-slate-700">Phí phải thanh toán:</span>
                <strong class="text-xl font-black text-blue-600 font-mono">${formatCurrency(totalFinal)}</strong>
              </div>
            </div>

            <!-- Voucher Input Box -->
            <div class="bg-slate-50/80 p-3 rounded-2xl space-y-2">
              <label class="text-[10px] font-extrabold uppercase text-slate-400 block">Mã giảm giá (Voucher)</label>
              <div class="flex gap-2">
                <input
                  id="step4-voucher-input"
                  type="text"
                  value="${escapeHtml(state.voucherCode)}"
                  placeholder="Nhập mã voucher (VD: VOUCHER10)..."
                  class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold text-slate-900 focus:outline-none"
                />
                <button id="step4-voucher-btn" type="button" class="px-4 py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition">
                  Áp dụng
                </button>
              </div>
              <div id="voucher-msg-area" class="text-[11px] font-bold text-emerald-600">
                ${state.discountAmount > 0 ? `✓ Áp dụng thành công voucher ${escapeHtml(state.voucherCode)}` : ''}
              </div>
            </div>

            <!-- Payment Type Selector (Kiểu thanh toán) -->
            <div class="space-y-2">
              <label class="text-[10px] font-extrabold uppercase text-slate-400 block">Kiểu / Phương thức thanh toán</label>
              <div class="space-y-2">
                ${[
                  { id: 'VIETQR', title: 'VietQR Chuyển khoản (Nhanh nhất)', icon: `<svg class="w-4 h-4 fill-current text-blue-600 shrink-0" viewBox="0 0 24 24"><path d="M11.5 1L2 6v2h19V6L11.5 1zM16 10v7h3v-7h-3zM5 10v7h3v-7H5zm5.5 0v7h3v-7h-3zM2 19v2h19v-2H2z"/></svg>` },
                  { id: 'MOMO', title: 'Ví điện tử (MoMo / SePay)', icon: `<svg class="w-4 h-4 fill-current text-rose-600 shrink-0" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>` },
                  { id: 'CARD', title: 'Thẻ ATM / Thẻ ngân hàng', icon: `<svg class="w-4 h-4 fill-current text-indigo-600 shrink-0" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>` },
                  { id: 'CASH', title: 'Tiền mặt tại Kiosk', icon: `<svg class="w-4 h-4 fill-current text-emerald-600 shrink-0" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-1c-1.28-.1-2.37-.8-2.73-2h1.86c.25.43.83.7 1.4.7.79 0 1.47-.48 1.47-1.18 0-.74-.53-1.07-1.63-1.37-1.66-.45-2.77-.98-2.77-2.6 0-1.29.98-2.29 2.4-2.47V7h2v1c1.12.1 2.02.77 2.37 1.83h-1.85c-.24-.38-.72-.63-1.3-.63-.74 0-1.3.43-1.3 1.05 0 .66.52.96 1.7 1.3 1.73.5 2.7 1.09 2.7 2.62 0 1.45-1.12 2.46-2.5 2.63V16z"/></svg>` }
                ].map(method => `
                  <label class="flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                    state.paymentMethod === method.id
                      ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-black'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }">
                    <div class="flex items-center gap-2.5 text-xs">
                      <span>${method.icon}</span>
                      <span>${method.title}</span>
                    </div>
                    <input type="radio" name="pay-method" value="${method.id}" ${state.paymentMethod === method.id ? 'checked' : ''} class="w-4 h-4 text-blue-600" />
                  </label>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- Right Column: QR Code Display Card -->
          <div class="md:col-span-6 space-y-4 flex flex-col justify-between text-center">
            
            <div class="w-full">
              <h3 class="font-black text-slate-900 text-sm mb-1">Quét mã QR để thanh toán</h3>
              <p class="text-xs text-slate-400 font-semibold">Sử dụng App Ngân hàng hoặc Ví điện tử quét mã bên dưới</p>
            </div>

            <!-- QR Container -->
            <div id="step4-qr-mount" class="w-full flex justify-center min-h-[260px]"></div>

            <!-- Payment App Logos -->
            <div class="w-full pt-3 border-t border-slate-100 space-y-2">
              <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Hoặc thanh toán qua</span>
              <div class="flex items-center justify-center gap-3">
                <span class="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-lg text-xs font-black">MoMo</span>
                <span class="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg text-xs font-black">SePay</span>
                <span class="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-black">VietQR</span>
                <span class="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-black">Napas</span>
              </div>
            </div>

            <button id="step4-simulate-pay-btn" type="button" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition">
              Xác nhận đã thanh toán xong
            </button>

          </div>

        </div>

      </div>
    `;
  };

  // ── RENDER STEP 5: HOÀN TẤT ────────────────────────────────────────────────
  const renderStep5View = () => {
    const vehicle = state.selectedVehicle || residentVehicles[0];
    const { totalOriginal, totalFinal } = calculateFees();

    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card max-w-2xl mx-auto space-y-6">
        <div id="step5-receipt-container">
          ${renderReceiptHtml({
            transactionId: state.transactionId || `TX-${Math.floor(Math.random() * 1000000000)}`,
            paidAt: new Date(),
            vehiclePlate: vehicle.plateNumber,
            vehicleType: vehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy',
            residentName: resident.full_name,
            apartmentNumber: vehicle.apartmentNumber,
            duration: `${state.monthsCount} tháng`,
            originalAmount: totalOriginal,
            discountAmount: state.discountAmount,
            finalAmount: totalFinal,
            paymentMethod: state.paymentMethod
          })}
        </div>

        <button id="step5-finish-btn" type="button" class="w-full py-3.5 bg-[#0B2C4D] hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-lg transition">
          Hoàn tất & Quay lại Cổng Cư dân
        </button>
      </div>
    `;
  };

  // ── MAIN RENDER CONTROLLER ─────────────────────────────────────────────────
  const render = () => {
    if (state.view === 'SEARCH') {
      container.innerHTML = renderDashboard();
      bindDashboardEvents();
    } else if (state.view === 'WIZARD') {
      if (state.wizardStep === 2) {
        container.innerHTML = renderStep2View();
        bindStep2Events();
      } else if (state.wizardStep === 4) {
        container.innerHTML = renderStep4View();
        bindStep4Events();
      } else if (state.wizardStep === 5) {
        container.innerHTML = renderStep5View();
        bindStep5Events();
      } else {
        state.wizardStep = 2;
        container.innerHTML = renderStep2View();
        bindStep2Events();
      }
    }
  };

  // ── BIND DASHBOARD EVENTS ──────────────────────────────────────────────────
  const bindDashboardEvents = () => {
    const input = container.querySelector('#resident-search-input');
    const searchBtn = container.querySelector('#resident-search-btn');

    const runSearch = () => {
      state.query = input ? input.value.trim() : '';
      state.selectedVehicle = pickVehicle(state.query);
      if (!state.selectedVehicle) {
        toast.show('Không tìm thấy xe phù hợp', 'warning');
      }
      render();
    };

    input?.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
    searchBtn?.addEventListener('click', runSearch);

    container.querySelector('#resident-pay-btn')?.addEventListener('click', () => {
      if (!state.selectedVehicle) return;
      state.view = 'WIZARD';
      state.wizardStep = 2;
      render();
    });

    container.querySelector('#resident-history-btn')?.addEventListener('click', () => {
      smoothScrollTo('#resident-history-section');
    });

    container.querySelector('#resident-history-link')?.addEventListener('click', () => {
      smoothScrollTo('#resident-history-section');
      toast.show('Hiển thị lịch sử ra vào gần đây', 'info');
    });
  };

  // ── BIND STEP 2 EVENTS ────────────────────────────────────────────────────
  const bindStep2Events = () => {
    container.querySelector('#wizard-cancel-btn')?.addEventListener('click', () => {
      state.view = 'SEARCH';
      render();
    });

    container.querySelectorAll('[data-month-pill]').forEach(pill => {
      pill.addEventListener('click', () => {
        const count = parseInt(pill.dataset.monthPill, 10);
        state.monthsCount = count;
        if (count === 1) state.endMonth = '06/2024';
        else if (count === 3) state.endMonth = '08/2024';
        else if (count === 6) state.endMonth = '11/2024';
        else if (count === 12) state.endMonth = '05/2025';
        render();
      });
    });

    container.querySelector('#end-month-select')?.addEventListener('change', e => {
      const val = e.target.value;
      if (val === '06/2024') state.monthsCount = 1;
      else if (val === '07/2024') state.monthsCount = 2;
      else if (val === '08/2024') state.monthsCount = 3;
      else if (val === '11/2024') state.monthsCount = 6;
      render();
    });

    container.querySelectorAll('[data-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stepNum = parseInt(btn.dataset.step, 10);
        if (stepNum === 4) {
          state.wizardStep = 4;
          render();
        }
      });
    });

    container.querySelector('#step2-continue-btn')?.addEventListener('click', () => {
      state.wizardStep = 4;
      render();
    });
  };

  // ── BIND STEP 4 EVENTS ────────────────────────────────────────────────────
  const bindStep4Events = () => {
    container.querySelector('#step4-back-btn')?.addEventListener('click', () => {
      state.wizardStep = 2;
      render();
    });

    const voucherBtn = container.querySelector('#step4-voucher-btn');
    const voucherInput = container.querySelector('#step4-voucher-input');
    voucherBtn?.addEventListener('click', async () => {
      const code = voucherInput ? voucherInput.value.trim() : '';
      if (!code) {
        toast.show('Vui lòng nhập mã voucher', 'warning');
        return;
      }
      try {
        const { totalOriginal } = calculateFees();
        const res = await validateVoucher(code, totalOriginal);
        if (res.valid) {
          state.voucherCode = res.voucherCode;
          state.discountAmount = res.discountAmount;
          toast.show(`Áp dụng voucher ${res.voucherCode} thành công!`, 'success');
        } else {
          toast.show(res.message || 'Mã voucher không hợp lệ', 'error');
        }
      } catch (err) {
        toast.show('Lỗi kiểm tra voucher', 'error');
      }
      render();
    });

    container.querySelectorAll('input[name="pay-method"]').forEach(radio => {
      radio.addEventListener('change', e => {
        state.paymentMethod = e.target.value;
        render();
      });
    });

    const qrMount = container.querySelector('#step4-qr-mount');
    if (qrMount) {
      const { totalFinal } = calculateFees();
      qrInstance = new QrPaymentComponent({
        container: qrMount,
        paymentData: {
          finalAmount: totalFinal,
          plateNumber: state.selectedVehicle?.plateNumber,
          months: state.monthsCount
        },
        onSuccess: () => {
          state.transactionId = `TX-${Math.floor(Math.random() * 1000000000)}`;
          state.wizardStep = 5;
          render();
        }
      });
      qrInstance.render();
    }

    container.querySelector('#step4-simulate-pay-btn')?.addEventListener('click', () => {
      state.transactionId = `TX-${Math.floor(Math.random() * 1000000000)}`;
      state.wizardStep = 5;
      toast.show('Thanh toán thành công!', 'success');
      render();
    });
  };

  // ── BIND STEP 5 EVENTS ────────────────────────────────────────────────────
  const bindStep5Events = () => {
    container.querySelector('#step5-finish-btn')?.addEventListener('click', () => {
      state.view = 'SEARCH';
      state.wizardStep = 2;
      render();
    });
  };

  render();
}
