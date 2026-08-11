/**
 * Resident Self-Service Portal Module
 */

import { MOCK_RESIDENTS, MOCK_VEHICLES } from '#core/mock-data.js';
import { toast } from '#components/toast.js';
import { formatCurrency } from '#utils/currency.js';
import { QrPaymentComponent } from '#components/qr-payment.js';
import { renderReceiptHtml } from '#components/receipt.js';

export function initResidentPortalModule(container) {
  if (!container) return;

  // Let's mock a logged-in resident (Trần Văn Tuấn)
  const resident = MOCK_RESIDENTS[0];
  const residentVehicles = MOCK_VEHICLES.filter(v => v.tenant_id === resident.tenant_id && v.residentName === resident.full_name);

  let state = {
    selectedVehicle: residentVehicles[0] || null,
    months: 1,
    voucherCode: '',
    discount: 0,
    baseFee: 1250000 // Vinhomes Ocean Park car fee
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
              <div class="text-[10px] text-slate-300 font-semibold">Căn hộ: ${resident.apartment_id.includes('1205') ? 'A1-1205' : 'A2-0806'}</div>
            </div>
          </div>
          <button id="res-logout-btn" class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[10px] transition">
            Thoát
          </button>
        </header>

        <!-- Main Body -->
        <main class="flex-1 p-4 space-y-4">
          <!-- Welcome Message -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1">
            <h3 class="font-black text-slate-800 text-sm">Cổng cư dân (Self-Service)</h3>
            <p class="text-xs text-slate-400 font-medium">Gia hạn vé xe tháng trực tuyến và nhận biên lai tức thời</p>
          </div>

          <!-- Vehicle List -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Phương tiện của bạn</h4>
            <div class="grid grid-cols-1 gap-2">
              ${residentVehicles.map(v => {
                const isSelected = state.selectedVehicle && state.selectedVehicle.id === v.id;
                let statusClass = 'bg-emerald-50 text-emerald-700';
                let statusText = 'Còn hạn';
                if (v.status === 'EXPIRED') {
                  statusClass = 'bg-rose-50 text-rose-700';
                  statusText = 'Hết hạn';
                }
                return `
                  <button data-id="${v.id}" class="w-full text-left p-3 rounded-2xl border bg-white transition flex items-center justify-between ${isSelected ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-xl ${v.vehicleType === 'CAR' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'} flex items-center justify-center">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          ${v.vehicleType === 'CAR' ? '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM5 11l1.5-4.5h11L19 11H5z"/>' : '<path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>'}
                        </svg>
                      </span>
                      <div>
                        <div class="font-bold text-slate-800 text-xs">${v.plateNumber}</div>
                        <div class="text-[10px] text-slate-400 font-semibold">${v.vehicleName || (v.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy')}</div>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[9px] ${statusClass}">${statusText}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Renewal Details -->
          ${state.selectedVehicle ? `
            <div class="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
              <h4 class="text-xs font-black text-[#0B2C4D] border-b border-slate-100 pb-2">Thông tin gia hạn</h4>
              
              <!-- Month selector -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-400 font-bold uppercase block">Chọn thời hạn giữ xe</label>
                <div class="grid grid-cols-4 gap-2">
                  ${[1, 3, 6, 12].map(m => `
                    <button data-months="${m}" class="py-2 text-xs font-bold rounded-xl border text-center transition ${state.months === m ? 'bg-[#0B2C4D] border-[#0B2C4D] text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}">
                      ${m} Tháng
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Voucher code -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-400 font-bold uppercase block">Mã giảm giá (Voucher)</label>
                <div class="flex gap-2">
                  <input type="text" id="res-voucher-input" value="${state.voucherCode}" placeholder="Nhập mã (VD: HE2024)..." class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <button id="res-voucher-apply" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B2C4D] font-bold rounded-xl text-xs transition">Ap dụng</button>
                </div>
              </div>

              <!-- Invoice details -->
              <div class="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div class="flex justify-between font-medium text-slate-500">
                  <span>Cước cước gốc (${state.months} tháng)</span>
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

              <!-- Action button -->
              <button id="res-pay-btn" class="w-full py-3 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition">
                Tiến hành thanh toán
              </button>
            </div>
          ` : ''}

          <!-- QR code container for payment integration -->
          <div id="res-qr-container" class="hidden"></div>
        </main>
      </div>
    `;

    // Bind event handlers
    const logoutBtn = container.querySelector('#res-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        window.location.hash = '#/login';
      };
    }

    // Vehicle select clicks
    container.querySelectorAll('button[data-id]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const v = residentVehicles.find(item => item.id === id);
        if (v) {
          state.selectedVehicle = v;
          state.baseFee = v.vehicleType === 'CAR' ? 1250000 : 120000;
          render();
        }
      };
    });

    // Month select clicks
    container.querySelectorAll('button[data-months]').forEach(btn => {
      btn.onclick = () => {
        state.months = parseInt(btn.getAttribute('data-months'), 10);
        render();
      };
    });

    // Apply voucher
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
        }
        render();
      };
    }

    // Show QR Payment modal/embed
    const payBtn = container.querySelector('#res-pay-btn');
    const qrContainer = container.querySelector('#res-qr-container');
    if (payBtn && qrContainer) {
      payBtn.onclick = () => {
        qrContainer.innerHTML = '';
        qrContainer.classList.remove('hidden');
        
        // Render dynamic VietQR image with QR payment countdown
        const qrComp = new QrPaymentComponent({
          container: qrContainer,
          paymentData: {
            finalAmount: finalAmount,
            vehicleType: state.selectedVehicle.vehicleType,
            months: state.months
          },
          onSuccess: () => {
            qrContainer.classList.add('hidden');
            toast.show('Thanh toán phí giữ xe tháng thành công!', 'success');
            
            // Render receipt details modal popup
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4';
            modalOverlay.innerHTML = `
              <div class="relative w-full max-w-md animate-in zoom-in-95 duration-150">
                <button id="close-receipt-modal" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full z-10 font-bold text-xs w-6 h-6 flex items-center justify-center">✕</button>
                ${renderReceiptHtml({
                  transactionId: `TX-${Math.floor(Math.random() * 1000000000)}`,
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
                })}
              </div>
            `;
            document.body.appendChild(modalOverlay);
            modalOverlay.querySelector('#close-receipt-modal').onclick = () => {
              modalOverlay.remove();
            };
          }
        });
        qrComp.render();
        
        // Auto scroll to QR payment component
        qrContainer.scrollIntoView({ behavior: 'smooth' });
      };
    }
  };

  render();
}
