/**
 * 120s Dynamic QR Payment Component
 */

import { startQrCountdownTimer, stopQrCountdownTimer, createQrPaymentTransaction } from '../services/qr-payment.service.js';
import { formatCurrency } from '../utils/currency.js';
import { formatCountdown } from '../utils/date.js';
import { toast } from './toast.js';
import { smoothScrollTo } from '../utils/smooth-scroll.js';

export class QrPaymentComponent {
  constructor(options = {}) {
    this.container = options.container;
    this.paymentData = options.paymentData || {};
    this.onSuccess = options.onSuccess || null;
    this.currentTransaction = null;
    this.element = null;
  }

  async render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center text-center">

        <!-- Pending icon: "!" vàng pulsing vô hạn trong khi chờ thanh toán -->
        <img src="assets/images/animated-icon-pending.svg" alt="Đang chờ thanh toán" class="w-16 h-16 mb-3" id="qr-status-icon" />

        <div class="text-2xl font-black text-slate-900 mb-1" id="qr-amount-display">
          ${formatCurrency(this.paymentData.finalAmount || 50000)}
        </div>
        <p class="text-xs text-amber-600 font-semibold mb-0.5">Đang chờ thanh toán</p>
        <p class="text-xs text-slate-400 mb-4">Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử</p>

        <!-- QR Box -->
        <div class="relative w-52 h-52 bg-slate-50 border-2 border-slate-200/80 rounded-2xl flex items-center justify-center p-2 mb-4 overflow-hidden" id="qr-box">
          <div class="animate-pulse text-slate-400 text-xs">Đang khởi tạo mã QR...</div>
        </div>

        <!-- Countdown Timer -->
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100/80 px-4 py-2 rounded-full mb-3" id="qr-timer-box">
          <span>Mã QR sẽ hết hạn sau:</span>
          <span class="text-rose-600 font-mono font-bold text-base" id="qr-countdown">02:00</span>
        </div>

        <button type="button" id="refresh-qr-btn" class="hidden text-xs text-blue-600 hover:text-blue-700 font-medium underline py-1">
          Tạo lại mã thanh toán mới
        </button>

        <p class="text-[11px] text-slate-400 mt-2">Mã QR tự động làm mới sau 120 giây để đảm bảo an toàn</p>
      </div>
    `;

    this.element = this.container.firstElementChild;
    const refreshBtn = this.element.querySelector('#refresh-qr-btn');
    refreshBtn.onclick = () => this.generateNewQr();

    await this.generateNewQr();
  }

  async generateNewQr() {
    const qrBox = this.element.querySelector('#qr-box');
    const refreshBtn = this.element.querySelector('#refresh-qr-btn');
    const countdownEl = this.element.querySelector('#qr-countdown');

    stopQrCountdownTimer();
    refreshBtn.classList.add('hidden');
    qrBox.innerHTML = `<div class="animate-spin w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>`;
    countdownEl.textContent = '120s';

    try {
      this.currentTransaction = await createQrPaymentTransaction(this.paymentData);

      qrBox.innerHTML = `<img src="${this.currentTransaction.qrUrl}" alt="VietQR Payment Code" class="w-full h-full object-contain rounded-xl" />`;

      // Auto smooth scroll QR card into view for optimal UX
      if (this.element) {
        smoothScrollTo(this.element, 850);
      }

      startQrCountdownTimer(
        this.currentTransaction.expiresAt,
        (remainingSeconds) => {
          if (countdownEl) {
            countdownEl.textContent = formatCountdown(remainingSeconds);
          }
        },
        () => {
          // On expired
          qrBox.innerHTML = `
            <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-white">
              <span class="text-xs font-semibold text-rose-400 mb-2">Mã QR đã hết hạn</span>
              <button id="expired-refresh-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                Tạo mã mới
              </button>
            </div>
          `;

          const expBtn = qrBox.querySelector('#expired-refresh-btn');
          if (expBtn) expBtn.onclick = () => this.generateNewQr();
          refreshBtn.classList.remove('hidden');
          toast.show('Mã QR đã hết hạn. Đang chờ tạo mã mới...', 'warning');
        }
      );
    } catch (err) {
      qrBox.innerHTML = `<div class="text-xs text-rose-500 px-3">Tạo QR thất bại. Vui lòng thử lại.</div>`;
      toast.show('Lỗi tạo mã QR thanh toán', 'error');
    }
  }

  showSuccess(message = 'Thanh toán chuyển khoản thành công!') {
    stopQrCountdownTimer();
    const txId = `VQR-${Date.now().toString().slice(-6)}`;
    // Load animated-icon.svg as a FRESH <img> element so the browser plays animation from t=0
    this.container.innerHTML = `
      <div class="bg-white p-8 rounded-3xl border border-slate-200/70 shadow-card flex flex-col items-center text-center space-y-4">
        <!-- Fresh img element = browser plays SVG animation from beginning: ! → amber→green → ✓ + ripple -->
        <img src="assets/images/animated-icon.svg" alt="Thanh toán thành công" class="w-24 h-24 mx-auto" />
        <div>
          <h3 class="text-lg font-black text-[#0B2C4D]">${message}</h3>
          <p class="text-xs text-slate-400 font-medium mt-1">Hệ thống đã nhận tiền thành công từ ứng dụng ngân hàng / VietQR</p>
        </div>
        <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1 font-semibold text-slate-700 w-full text-left">
          <div class="flex justify-between"><span class="text-slate-400">Mã GD:</span><span class="font-mono font-bold text-emerald-600">${txId}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Trạng thái:</span><span class="text-emerald-600">✓ Đã thanh toán</span></div>
        </div>
      </div>
    `;
    if (this.onSuccess) this.onSuccess(this.currentTransaction);
  }

  destroy() {
    stopQrCountdownTimer();
    this.currentTransaction = null;
  }
}
