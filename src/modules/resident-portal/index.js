/**
 * Resident Self-Service Portal Module with 4-Step Wizard Flow
 */

import { MOCK_RESIDENTS, MOCK_VEHICLES } from '#core/mock-data.js';
import { toast } from '#components/toast.js';
import { formatCurrency } from '#utils/currency.js';
import { QrPaymentComponent } from '#components/qr-payment.js';
import { renderReceiptHtml } from '#components/receipt.js';

export function initResidentPortalModule(container) {
  if (!container) return;

  const resident = MOCK_RESIDENTS[0];
  const residentVehicles = MOCK_VEHICLES.filter(v => v.tenant_id === resident.tenant_id && v.residentName === resident.full_name);

  let state = {
    step: 1, // 1: Chọn xe, 2: Chọn thời gian, 3: Thanh toán, 4: Hoàn tất
    selectedVehicle: residentVehicles[0] || null,
    months: 1,
    voucherCode: '',
    discount: 0,
    baseFee: residentVehicles[0] ? (residentVehicles[0].vehicleType === 'CAR' ? 1250000 : 120000) : 120000,
    transactionId: ''
  };

  const render = () => {
    const finalAmount = Math.max(0, (state.baseFee * state.months) - state.discount);

    container.innerHTML = `
      <div class="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col pb-8 shadow-2xl relative">
        <!-- Header -->
        <header class="bg-[#0B2C4D] text-white px-5 py-4 shrink-0 flex items-center justify-between shadow-md">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center font-bold text-sm">
              ${resident.full_name.charAt(0)}
            </span>
            <div>
              <div class="font-extrabold text-sm">${resident.full_name}</div>
              <div class="text-[10px] text-slate-300 font-semibold">Căn hộ: A1-1205</div>
            </div>
          </div>
          <button id="res-logout-btn" class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[10px] transition">
            Thoát
          </button>
        </header>

        <!-- Wizard Progress Bar -->
        <div class="px-4 py-3 bg-white border-b border-slate-200/60 flex justify-between text-[9px] font-black text-slate-400 select-none shrink-0">
          <span class="${state.step === 1 ? 'text-[#0B2C4D]' : state.step > 1 ? 'text-[#7CB342]' : ''}">1. CHỌN XE</span>
          <span>➔</span>
          <span class="${state.step === 2 ? 'text-[#0B2C4D]' : state.step > 2 ? 'text-[#7CB342]' : ''}">2. THỜI GIAN</span>
          <span>➔</span>
          <span class="${state.step === 3 ? 'text-[#0B2C4D]' : state.step > 3 ? 'text-[#7CB342]' : ''}">3. THANH TOÁN</span>
          <span>➔</span>
          <span class="${state.step === 4 ? 'text-[#7CB342]' : ''}">4. HOÀN TẤT</span>
        </div>

        <!-- Main Body Content -->
        <main class="flex-1 p-4 space-y-4">

          <!-- STEP 1: CHỌN XE -->
          ${state.step === 1 ? `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1">
              <h3 class="font-black text-slate-800 text-sm">Cổng cư dân (Self-Service)</h3>
              <p class="text-xs text-slate-400 font-medium">Gia hạn vé xe tháng trực tuyến và nhận biên lai tức thời</p>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Chọn phương tiện cần gia hạn</h4>
              <div class="grid grid-cols-1 gap-2">
                ${residentVehicles.map(v => {
                  const isSelected = state.selectedVehicle && state.selectedVehicle.id === v.id;
                  const statusClass = v.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700';
                  const statusText = v.status === 'EXPIRED' ? 'Hết hạn' : 'Còn hạn';
                  return `
                    <button data-id="${v.id}" class="w-full text-left p-3 rounded-2xl border bg-white transition flex items-center justify-between ${isSelected ? 'border-[#0B2C4D] ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}">
                      <div class="flex items-center gap-3">
                        <span class="w-7 h-7 rounded-xl ${v.vehicleType === 'CAR' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'} flex items-center justify-center">
                          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            ${v.vehicleType === 'CAR' ? '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM5 11l1.5-4.5h11L19 11H5z"/>' : '<path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>'}
                          </svg>
                        </span>
                        <div>
                          <div class="font-bold text-slate-800 text-xs">${v.plateNumber}</div>
                          <div class="text-[10px] text-slate-400 font-semibold">${v.vehicleName}</div>
                        </div>
                      </div>
                      <span class="px-2.5 py-0.5 rounded-full font-bold text-[9px] ${statusClass}">${statusText}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <button id="step1-next-btn" class="w-full py-3.5 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
              <span>Tiếp tục chọn gói</span>
            </button>
          ` : ''}

          <!-- STEP 2: CHỌN THỜI GIAN & VOUCHER -->
          ${state.step === 2 ? `
            <div class="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
              <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 class="text-xs font-black text-[#0B2C4D]">Gói gia hạn: ${state.selectedVehicle.plateNumber}</h4>
                <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg">${state.selectedVehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</span>
              </div>
              
              <!-- Month selector -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-400 font-bold uppercase block">Chọn thời hạn giữ xe</label>
                <div class="grid grid-cols-4 gap-2">
                  ${[1, 3, 6, 12].map(m => `
                    <button data-months="${m}" class="py-2.5 text-xs font-bold rounded-xl border text-center transition ${state.months === m ? 'bg-[#0B2C4D] border-[#0B2C4D] text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}">
                      ${m} Tháng
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Voucher code -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-400 font-bold uppercase block">Mã giảm giá (Voucher)</label>
                <div class="flex gap-2">
                  <input type="text" id="res-voucher-input" value="${state.voucherCode}" placeholder="Nhập mã (VD: HE2024)..." class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase focus:outline-none" />
                  <button id="res-voucher-apply" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B2C4D] font-bold rounded-xl text-xs transition">Áp dụng</button>
                </div>
              </div>

              <!-- Invoice details -->
              <div class="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div class="flex justify-between font-medium text-slate-500">
                  <span>Cước gốc (${state.months} tháng)</span>
                  <span>${formatCurrency(state.baseFee * state.months)}</span>
                </div>
                ${state.discount > 0 ? `
                  <div class="flex justify-between font-medium text-rose-500">
                    <span>Mã giảm giá áp dụng</span>
                    <span>-${formatCurrency(state.discount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between font-black text-slate-900 border-t border-dashed border-slate-100 pt-2 text-sm">
                  <span>Tổng tiền thanh toán</span>
                  <span class="text-[#0B2C4D]">${formatCurrency(finalAmount)}</span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="grid grid-cols-2 gap-2 pt-2">
                <button id="step2-back-btn" class="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition">
                  Quay lại
                </button>
                <button id="step2-next-btn" class="py-3 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition">
                  Tạo mã QR
                </button>
              </div>
            </div>
          ` : ''}

          <!-- STEP 3: THANH TOÁN QR -->
          ${state.step === 3 ? `
            <div class="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
              <h4 class="text-xs font-black text-[#0B2C4D] border-b border-slate-100 pb-2">Phương thức thanh toán</h4>
              
              <!-- Payment Summary Box -->
              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div class="flex justify-between"><span class="text-slate-400">Biển số:</span><span class="font-bold text-slate-800">${state.selectedVehicle.plateNumber}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Số tiền:</span><span class="font-black text-rose-600">${formatCurrency(finalAmount)}</span></div>
              </div>

              <!-- QR Embed Container -->
              <div id="res-qr-container" class="min-h-[220px]"></div>

              <button id="step3-back-btn" class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition">
                Quay lại thay đổi gói
              </button>
            </div>
          ` : ''}

          <!-- STEP 4: HOÀN TẤT & IN BIÊN LAI -->
          ${state.step === 4 ? `
            <div id="res-receipt-container" class="space-y-4"></div>
            <button id="step4-restart-btn" class="w-full py-3 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition">
              Quay lại Trang chủ
            </button>
          ` : ''}

        </main>
      </div>
    `;

    // Logout
    const logoutBtn = container.querySelector('#res-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        window.location.hash = '#/login';
      };
    }

    // Step 1 logic
    if (state.step === 1) {
      container.querySelectorAll('button[data-id]').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const v = residentVehicles.find(item => item.id === id);
          if (v) {
            state.selectedVehicle = v;
            state.baseFee = v.vehicleType === 'CAR' ? 1250000 : 120000;
            state.months = 1;
            state.voucherCode = '';
            state.discount = 0;
            render();
          }
        };
      });

      const step1Next = container.querySelector('#step1-next-btn');
      if (step1Next) {
        step1Next.onclick = () => {
          if (!state.selectedVehicle) {
            toast.show('Vui lòng chọn một phương tiện', 'warning');
            return;
          }
          state.step = 2;
          render();
        };
      }
    }

    // Step 2 logic
    if (state.step === 2) {
      container.querySelectorAll('button[data-months]').forEach(btn => {
        btn.onclick = () => {
          state.months = parseInt(btn.getAttribute('data-months'), 10);
          state.discount = state.voucherCode === 'HE2024' ? (state.baseFee * state.months) * 0.1 : 0;
          render();
        };
      });

      const applyBtn = container.querySelector('#res-voucher-apply');
      const voucherInput = container.querySelector('#res-voucher-input');
      if (applyBtn && voucherInput) {
        applyBtn.onclick = () => {
          const val = voucherInput.value.trim().toUpperCase();
          if (val === 'HE2024') {
            state.voucherCode = 'HE2024';
            state.discount = (state.baseFee * state.months) * 0.1; // 10% discount
            toast.show('Áp dụng Voucher HE2024 thành công! Giảm 10%', 'success');
          } else {
            toast.show('Mã giảm giá không tồn tại hoặc đã hết hạn', 'error');
            state.voucherCode = '';
            state.discount = 0;
          }
          render();
        };
      }

      const step2Back = container.querySelector('#step2-back-btn');
      if (step2Back) {
        step2Back.onclick = () => {
          state.step = 1;
          render();
        };
      }

      const step2Next = container.querySelector('#step2-next-btn');
      if (step2Next) {
        step2Next.onclick = () => {
          state.step = 3;
          render();
          setTimeout(() => initializeQrPayment(), 50);
        };
      }
    }

    // Step 3 logic
    const initializeQrPayment = () => {
      const qrBox = container.querySelector('#res-qr-container');
      if (!qrBox) return;

      const qrComp = new QrPaymentComponent({
        container: qrBox,
        paymentData: {
          finalAmount: finalAmount,
          vehicleType: state.selectedVehicle.vehicleType,
          months: state.months
        },
        onSuccess: () => {
          state.transactionId = `TX-${Math.floor(Math.random() * 1000000000)}`;
          state.step = 4;
          render();
          setTimeout(() => renderReceiptScreen(), 50);
        }
      });
      qrComp.render();
    };

    const step3Back = container.querySelector('#step3-back-btn');
    if (step3Back) {
      step3Back.onclick = () => {
        state.step = 2;
        render();
      };
    }

    // Step 4 logic
    const renderReceiptScreen = () => {
      const receiptBox = container.querySelector('#res-receipt-container');
      if (!receiptBox) return;

      receiptBox.innerHTML = renderReceiptHtml({
        transactionId: state.transactionId || `TX-${Math.floor(Math.random() * 1000000000)}`,
        paidAt: new Date(),
        vehiclePlate: state.selectedVehicle.plateNumber,
        vehicleType: state.selectedVehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy',
        residentName: resident.full_name,
        apartmentNumber: resident.apartment_id.includes('1205') ? 'A1-1205' : 'A2-0806',
        duration: `${state.months} tháng`,
        originalAmount: state.baseFee * state.months,
        discountAmount: state.discount,
        finalAmount: finalAmount,
        paymentMethod: 'VietQR Chuyển khoản'
      });
    };

    const step4Restart = container.querySelector('#step4-restart-btn');
    if (step4Restart) {
      step4Restart.onclick = () => {
        state.step = 1;
        state.months = 1;
        state.voucherCode = '';
        state.discount = 0;
        render();
      };
    }

  };

  render();
}
