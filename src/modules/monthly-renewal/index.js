/**
 * Resident Monthly Card Renewal Module
 */

import { calculateRenewalFee } from '../../services/renewal.service.js';
import { validateVoucher } from '../../services/voucher.service.js';
import { QrPaymentComponent } from '../../components/qr-payment.js';
import { renderReceiptHtml } from '../../components/receipt.js';
import { formatCurrency } from '../../utils/currency.js';
import { toast } from '../../components/toast.js';

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
      <div class="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
        <div class="border-b border-slate-100 pb-4">
          <h2 class="text-xl font-bold text-slate-900">Gia hạn thẻ tháng Online (Cư dân)</h2>
          <p class="text-xs text-slate-500">Gia hạn thẻ giữ xe nhanh chóng, nhận mã QR thanh toán 120s</p>
        </div>

        <!-- Vehicle Type Selection -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Chọn loại xe</label>
          <div class="grid grid-cols-2 gap-3" id="vehicle-type-options">
            <button type="button" data-type="CAR" class="type-btn p-3.5 rounded-2xl border-2 border-blue-600 bg-blue-50/50 text-blue-900 font-bold text-left flex items-center justify-between transition">
              <span class="flex items-center gap-2"><span>🚗</span> Ô tô</span>
              <span class="text-xs text-blue-600">1.200.000đ/tháng</span>
            </button>
            <button type="button" data-type="MOTORBIKE" class="type-btn p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold text-left flex items-center justify-between hover:bg-slate-100 transition">
              <span class="flex items-center gap-2"><span>🛵</span> Xe máy</span>
              <span class="text-xs text-slate-500">100.000đ/tháng</span>
            </button>
          </div>
        </div>

        <!-- License Plate Input -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Biển số xe cần gia hạn</label>
          <input type="text" id="renewal-plate" value="30F-123.45" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <!-- Duration Selection -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Thời gian gia hạn</label>
          <div class="grid grid-cols-4 gap-2" id="duration-options">
            <button type="button" data-months="1" class="dur-btn py-2.5 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold text-xs">1 Tháng</button>
            <button type="button" data-months="3" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">3 Tháng</button>
            <button type="button" data-months="6" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">6 Tháng</button>
            <button type="button" data-months="12" class="dur-btn py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100">12 Tháng</button>
          </div>
        </div>

        <!-- Voucher Input -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">4. Mã giảm giá (Voucher)</label>
          <div class="flex gap-2">
            <input type="text" id="voucher-code-input" placeholder="Nhập mã (VD: GIAM10K)" class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-semibold focus:outline-none" />
            <button type="button" id="apply-voucher-btn" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition">
              Áp dụng
            </button>
          </div>
          <div id="voucher-message" class="text-xs font-medium"></div>
        </div>

        <!-- Submit Button (Anti-double submit) -->
        <button type="button" id="start-renewal-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2">
          <span>Tạo mã QR thanh toán</span>
        </button>
      </div>

      <!-- Payment / QR Output Column -->
      <div class="lg:col-span-5" id="renewal-qr-container">
        <div class="bg-slate-50 border border-slate-200/70 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
          <span class="text-4xl mb-3">💳</span>
          <h3 class="text-base font-bold text-slate-800">Sẵn sàng thanh toán</h3>
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
      toast.show('Mã QR 120s đã tạo thành công', 'info');
    } catch (err) {
      toast.show('Lỗi tạo thanh toán QR', 'error');
    } finally {
      startBtn.disabled = false;
      startBtn.innerHTML = `<span>Tạo mã QR thanh toán</span>`;
    }
  };
}
