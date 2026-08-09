/**
 * Kiosk Touch Screen Module (Visitor Parking & Entry Gate Station)
 */

import { QrPaymentComponent } from '../../components/qr-payment.js';
import { toast } from '../../components/toast.js';
import { smoothScrollTo } from '../../utils/smooth-scroll.js';
import { soundService } from '../../core/sound-effects.js';

let kioskState = {
  activePlate: '',
  qrInstance: null
};

export function initKioskTouchModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto pb-10">
      
      <!-- Kiosk Header Banner -->
      <div class="bg-gradient-to-r from-[#0B2C4D] via-[#0f3d6b] to-[#0B2C4D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="space-y-2 text-center sm:text-left z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 rounded-full border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wider uppercase">
            <span class="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            Trạm Kiosk Tự Động Trực Cổng
          </div>
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight">TRA CỨU VÉ & THANH TOÁN KIOSK</h2>
          <p class="text-xs sm:text-sm text-slate-300">Nhập biển số xe để xem số tiền đỗ xe vãng lai và quét mã VietQR tự động mở Barie.</p>
        </div>
        <img src="assets/images/pay.png" alt="Payment 3D Icon" class="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:scale-105 transition transform" />
      </div>

      <!-- Step 1: Touch Screen License Plate Entry -->
      <div id="kiosk-step-1" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-card space-y-6">
        <div class="text-center space-y-1">
          <h3 class="font-extrabold text-slate-900 text-lg">NHẬP BIỂN SỐ XE CỦA BẠN</h3>
          <p class="text-xs text-slate-500 font-medium">Chạm vào bàn phím bên dưới hoặc dùng bàn phím vật lý</p>
        </div>

        <!-- Big Touch Display Input -->
        <div class="max-w-md mx-auto relative">
          <input
            type="text"
            id="kiosk-plate-input"
            placeholder="Ví dụ: 30F-123.45"
            class="w-full text-center text-2xl sm:text-3xl font-black uppercase tracking-widest px-6 py-4 rounded-2xl border-2 border-slate-300 focus:border-[#0B2C4D] focus:ring-4 focus:ring-[#0B2C4D]/10 bg-slate-50 text-slate-900 shadow-inner outline-none transition"
          />
        </div>

        <!-- Quick Numpad Touch Buttons Grid -->
        <div class="max-w-md mx-auto grid grid-cols-3 gap-2.5 pt-2">
          ${['1','2','3','4','5','6','7','8','9','Xóa','0','OK'].map(key => `
            <button
              type="button"
              data-key="${key}"
              class="kiosk-numpad-btn h-14 rounded-2xl font-black text-lg sm:text-xl border border-slate-200 transition duration-150 active:scale-95 flex items-center justify-center ${
                key === 'OK' ? 'bg-[#0B2C4D] text-white shadow-md' : key === 'Xóa' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }"
            >
              ${key}
            </button>
          `).join('')}
        </div>

        <!-- Submit Button -->
        <div class="pt-4 max-w-md mx-auto">
          <button
            type="button"
            id="kiosk-search-btn"
            class="w-full py-4 px-6 rounded-2xl bg-[#0B2C4D] hover:bg-[#08213B] text-white font-extrabold text-base shadow-lg shadow-[#0B2C4D]/25 transition flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span>TÌM XE VÀ TÍNH PHÍ</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Payment & QR Code Display -->
      <div id="kiosk-step-2" class="hidden bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-card space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span class="text-xs font-bold text-slate-400 block uppercase tracking-wider">Thông Tin Thanh Toán Kiosk</span>
            <h3 class="text-xl font-black text-slate-900" id="kiosk-summary-plate">30F-123.45</h3>
          </div>
          <button
            type="button"
            id="kiosk-back-btn"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            ← Nhập lại biển số
          </button>
        </div>

        <div id="kiosk-qr-render-box" class="min-h-[380px] flex items-center justify-center"></div>
      </div>

    </div>
  `;

  // Attach Numpad Click Events
  const plateInput = container.querySelector('#kiosk-plate-input');
  container.querySelectorAll('.kiosk-numpad-btn').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.key;
      if (key === 'Xóa') {
        plateInput.value = plateInput.value.slice(0, -1);
      } else if (key === 'OK') {
        container.querySelector('#kiosk-search-btn').click();
      } else {
        if (plateInput.value.length < 12) {
          plateInput.value += key;
        }
      }
    };
  });

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
        paymentData: { finalAmount: 30000 },
        onPaymentSuccess: () => {
          // Play Ting-Ting chime and Vietnamese Voice Announcement!
          soundService.playPaymentSuccessSequence("Thanh toán thành công. Cảm ơn quý khách!");
          toast.show('Thanh toán thành công! Tín hiệu Mở Barie OPEN_GATE', 'success');
        }
      });

      await kioskState.qrInstance.render();

      // Trigger test sound effect demo on QR view load
      soundService.playPaymentSuccessSequence("Thanh toán thành công. Cảm ơn quý khách!");

      smoothScrollTo(qrRenderBox, 850);
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
