/**
 * Dedicated High-Performance Kiosk Touch Screen Module
 */

import { searchVehicle } from '../../services/vehicle.service.js';
import { QrPaymentComponent } from '../../components/qr-payment.js';
import { formatCurrency } from '../../utils/currency.js';
import { toast } from '../../components/toast.js';

export function initKioskTouchModule(container) {
  if (!container) return;

  let kioskState = {
    step: 1, // 1: Search, 2: Confirm & Calculate, 3: QR Payment
    selectedVehicle: null,
    parkingFee: 30000,
    qrInstance: null
  };

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6 select-none">
      <!-- Top Kiosk Header -->
      <div class="flex items-center justify-between gap-2 bg-slate-900 text-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-base sm:text-lg shrink-0">P</div>
          <div class="min-w-0">
            <h1 class="text-xs sm:text-xl font-black tracking-wide truncate">PARKING.GO KIOSK</h1>
            <p class="text-[9px] sm:text-xs text-slate-400 truncate">Trạm thanh toán tự động giữ xe vãng lai & gia hạn</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2.5 py-1 sm:px-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">● Sẵn sàng</span>
        </div>
      </div>

      <!-- Main Kiosk Body -->
      <div id="kiosk-body-step" class="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl min-h-[380px] flex flex-col justify-center">
        <!-- Step 1: Big Plate Input -->
        <div id="kiosk-step-1" class="space-y-6 text-center max-w-lg mx-auto w-full">
          <h2 class="text-2xl font-black text-slate-900">VUI LÒNG NHẬP BIỂN SỐ XE</h2>
          <p class="text-sm text-slate-500">Nhập đầy đủ biển số để tìm thông tin xe và tính phí thanh toán</p>

          <div class="relative">
            <input
              type="text"
              id="kiosk-plate-input"
              placeholder="VD: 51H-222.22"
              value="51H-222.22"
              class="w-full text-center text-3xl font-black font-mono tracking-widest uppercase py-5 bg-slate-50 border-3 border-blue-600 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-900 shadow-inner"
            />
          </div>

          <button type="button" id="kiosk-search-btn" class="w-full bg-[#0B2C4D] hover:bg-slate-800 active:scale-[0.98] text-white font-black text-lg py-4 rounded-2xl shadow-xl transition duration-150 flex items-center justify-center gap-3">
            <span>TÌM XE VÀ TÍNH PHÍ</span>
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
        </div>

        <!-- Step 2: Payment Details & QR Code (Hidden initially) -->
        <div id="kiosk-step-2" class="hidden space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <button type="button" id="kiosk-back-btn" class="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 bg-slate-100 rounded-full">
              ← Nhập lại biển số
            </button>
            <span class="text-xs font-bold text-slate-400">Bước 2 / 2: Thanh toán QR</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <!-- Vehicle Info Summary -->
            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Biển số xe:</span>
                <span class="text-xl font-black font-mono text-blue-600" id="kiosk-summary-plate">51H-222.22</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Thời gian vào bãi:</span>
                <span class="font-bold text-slate-800">08/05/2026 07:45</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Thời gian gửi:</span>
                <span class="font-bold text-slate-800">2 giờ 30 phút</span>
              </div>
              <div class="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-700">Tổng phí thanh toán:</span>
                <span class="text-2xl font-black text-emerald-600" id="kiosk-summary-fee">30.000 đ</span>
              </div>
            </div>

            <!-- QR Payment Container -->
            <div id="kiosk-qr-render-box"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const plateInput = container.querySelector('#kiosk-plate-input');
  const searchBtn = container.querySelector('#kiosk-search-btn');
  const backBtn = container.querySelector('#kiosk-back-btn');
  const step1Box = container.querySelector('#kiosk-step-1');
  const step2Box = container.querySelector('#kiosk-step-2');
  const qrRenderBox = container.querySelector('#kiosk-qr-render-box');

  searchBtn.onclick = async () => {
    const plate = plateInput.value.trim();
    if (!plate) {
      toast.show('Vui lòng nhập biển số xe', 'warning');
      return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = `<div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div> ĐANG TÌM XE...`;

    try {
      await new Promise(res => setTimeout(res, 300));
      container.querySelector('#kiosk-summary-plate').textContent = plate.toUpperCase();

      step1Box.classList.add('hidden');
      step2Box.classList.remove('hidden');

      if (kioskState.qrInstance) kioskState.qrInstance.destroy();

      kioskState.qrInstance = new QrPaymentComponent({
        container: qrRenderBox,
        paymentData: { finalAmount: 30000 }
      });

      await kioskState.qrInstance.render();
    } catch (err) {
      toast.show('Lỗi tìm thông tin xe', 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = `<span>TÌM XE VÀ TÍNH PHÍ</span> <span>➔</span>`;
    }
  };

  backBtn.onclick = () => {
    if (kioskState.qrInstance) kioskState.qrInstance.destroy();
    step2Box.classList.add('hidden');
    step1Box.classList.remove('hidden');
  };
}
