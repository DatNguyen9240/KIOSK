/**
 * Resident Monthly Card Renewal Module
 */

import { calculateRenewalFee } from '../../services/renewal.service.js';
import { validateVoucher } from '../../services/voucher.service.js';
import { QrPaymentComponent } from '../../components/qr-payment.js';
import { renderReceiptHtml } from '../../components/receipt.js';
import { formatCurrency } from '../../utils/currency.js';
import { toast } from '../../components/toast.js';
import { smoothScrollTo } from '../../utils/smooth-scroll.js';

export function initMonthlyRenewalModule(container) {
  if (!container) return;

  let currentFeeState = {
    vehicleType: 'CAR',
    months: 1,
    originalAmount: 1200000,
    discountAmount: 0,
    finalAmount: 1200000,
    voucherCode: ''
  };

  let qrComponentInstance = null;

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Form Column -->
      <div class="lg:col-span-7 bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
        <div class="border-b border-slate-100 pb-3 sm:pb-4">
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Gia hạn thẻ tháng Online (Cư dân)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Gia hạn thẻ giữ xe nhanh chóng, nhận mã QR thanh toán 120s</p>
        </div>

        <!-- Vehicle Type Selection -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Chọn loại xe</label>
          <div class="grid grid-cols-2 gap-2.5 sm:gap-3" id="vehicle-type-options">
            <button type="button" data-type="CAR" class="type-btn p-3 sm:p-3.5 rounded-2xl border-2 border-[#0B2C4D] bg-blue-50/50 text-[#0B2C4D] font-bold text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 transition min-w-0 cursor-pointer">
              <span class="flex items-center gap-2 min-w-0">
                <svg class="w-4 h-4 fill-current text-[#0B2C4D] shrink-0" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                <span class="text-xs sm:text-sm font-extrabold truncate">Ô tô</span>
              </span>
              <span class="text-[10px] sm:text-xs text-[#0B2C4D] font-black whitespace-nowrap">1.200.000đ/tháng</span>
            </button>
            <button type="button" data-type="MOTORBIKE" class="type-btn p-3 sm:p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 hover:bg-slate-100 transition min-w-0 cursor-pointer">
              <span class="flex items-center gap-2 min-w-0">
                <svg class="w-4 h-4 fill-current text-slate-500 shrink-0" viewBox="0 0 24 24"><path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span class="text-xs sm:text-sm font-extrabold truncate">Xe máy</span>
              </span>
              <span class="text-[10px] sm:text-xs text-slate-500 font-bold whitespace-nowrap">100.000đ/tháng</span>
            </button>
          </div>
        </div>

        <!-- License Plate Input -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Biển số xe cần gia hạn</label>
          <input type="text" id="renewal-plate" value="30F-123.45" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <!-- Duration Selection -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Thời gian gia hạn</label>
          <div class="grid grid-cols-4 gap-2" id="duration-options">
            <button type="button" data-months="1" class="dur-btn py-2.5 rounded-xl border-2 border-[#0B2C4D] bg-blue-50 text-[#0B2C4D] font-extrabold text-xs">1 Tháng</button>
            <button type="button" data-months="3" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">3 Tháng</button>
            <button type="button" data-months="6" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">6 Tháng</button>
            <button type="button" data-months="12" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">12 Tháng</button>
          </div>
        </div>

        <!-- Voucher Input -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">4. Mã giảm giá (Voucher)</label>
          <div class="flex gap-2">
            <input type="text" id="voucher-code-input" placeholder="Nhập mã (VD: GIAM10K)" class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs uppercase font-semibold focus:outline-none" />
            <button type="button" id="apply-voucher-btn" class="bg-[#0B2C4D] hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition">
              Áp dụng
            </button>
          </div>
          <div id="voucher-message" class="text-xs font-medium"></div>
        </div>

        <!-- Submit Button -->
        <button type="button" id="start-renewal-btn" class="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-extrabold py-3.5 rounded-2xl shadow-md transition text-xs flex items-center justify-center gap-2">
          <span>Tạo mã QR thanh toán</span>
        </button>
      </div>

      <!-- Payment / QR Output Column -->
      <div class="lg:col-span-5" id="renewal-qr-container">
        <div class="bg-slate-50 border border-slate-200/70 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
          <svg class="w-10 h-10 text-slate-400 mb-3 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
          <h3 class="text-sm font-extrabold text-slate-800">Sẵn sàng thanh toán</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-xs">Chọn gói gia hạn và bấm "Tạo mã QR thanh toán" để tiến hành quét mã</p>
        </div>
      </div>
    </div>
  `;

  const typeBtns = container.querySelectorAll('.type-btn');
  const durBtns = container.querySelectorAll('.dur-btn');
  const applyVoucherBtn = container.querySelector('#apply-voucher-btn');
  const startBtn = container.querySelector('#start-renewal-btn');
  const qrContainer = container.querySelector('#renewal-qr-container');

  // Type selection handler
  typeBtns.forEach(btn => {
    btn.onclick = () => {
      typeBtns.forEach(b => b.className = 'type-btn p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold text-left flex items-center justify-between hover:bg-slate-100 transition');
      btn.className = 'type-btn p-3.5 rounded-2xl border-2 border-blue-600 bg-blue-50/50 text-blue-900 font-bold text-left flex items-center justify-between transition';
      currentFeeState.vehicleType = btn.dataset.type;
      recalculateFee();
    };
  });

  // Duration selection handler
  durBtns.forEach(btn => {
    btn.onclick = () => {
      durBtns.forEach(b => b.className = 'dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100');
      btn.className = 'dur-btn py-2.5 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold text-xs';
      currentFeeState.months = parseInt(btn.dataset.months, 10);
      recalculateFee();
    };
  });

  const recalculateFee = async () => {
    const feeRes = await calculateRenewalFee(currentFeeState);
    currentFeeState.originalAmount = feeRes.baseFee;
    currentFeeState.finalAmount = Math.max(0, feeRes.baseFee - currentFeeState.discountAmount);
  };

  // Voucher handler
  applyVoucherBtn.onclick = async () => {
    const codeInput = container.querySelector('#voucher-code-input');
    const msgEl = container.querySelector('#voucher-message');
    const code = codeInput.value.trim();

    if (!code) {
      toast.show('Vui lòng nhập mã voucher', 'warning');
      return;
    }

    applyVoucherBtn.disabled = true;
    applyVoucherBtn.textContent = 'Đang kiểm tra...';

    try {
      const res = await validateVoucher(code, currentFeeState.originalAmount);
      if (res.valid) {
        currentFeeState.discountAmount = res.discountAmount;
        currentFeeState.finalAmount = res.finalAmount;
        currentFeeState.voucherCode = res.voucherCode;
        msgEl.className = 'text-xs font-semibold text-emerald-600';
        msgEl.textContent = `✓ ${res.message} (-${formatCurrency(res.discountAmount)})`;
        toast.show('Áp dụng voucher thành công!', 'success');
      } else {
        msgEl.className = 'text-xs font-semibold text-rose-500';
        msgEl.textContent = `✕ ${res.message}`;
        toast.show(res.message, 'error');
      }
    } catch (err) {
      toast.show('Lỗi xác thực voucher', 'error');
    } finally {
      applyVoucherBtn.disabled = false;
      applyVoucherBtn.textContent = 'Áp dụng';
    }
  };

  // Start QR Payment (Anti-double submit)
  startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.innerHTML = `<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Đang tạo mã QR...`;

    try {
      if (qrComponentInstance) qrComponentInstance.destroy();

      qrComponentInstance = new QrPaymentComponent({
        container: qrContainer,
        paymentData: currentFeeState
      });

      await qrComponentInstance.render();

      // Gentle smooth scroll down to QR code section for optimal UX
      smoothScrollTo(qrContainer, 850);

      toast.show('Mã QR 120s đã tạo thành công', 'info');
    } catch (err) {
      toast.show('Lỗi tạo thanh toán QR', 'error');
    } finally {
      startBtn.disabled = false;
      startBtn.innerHTML = `<span>Tạo mã QR thanh toán</span>`;
    }
  };
}
