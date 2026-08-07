/**
 * Printable Payment Receipt Component
 */

import { formatCurrency } from '../utils/currency.js';
import { formatDateTime } from '../utils/date.js';

export function renderReceiptHtml(transactionData = {}) {
  const {
    transactionId = 'TXN-998812',
    paidAt = new Date(),
    vehiclePlate = '30F-123.45',
    vehicleType = 'Xe máy',
    residentName = 'Trần Minh Tuấn',
    apartmentNumber = 'A1-1205',
    duration = '1 tháng',
    originalAmount = 100000,
    discountAmount = 10000,
    finalAmount = 90000,
    paymentMethod = 'Ví MoMo'
  } = transactionData;

  return `
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full mx-auto text-slate-800" id="printable-receipt">
      <div class="text-center pb-4 border-b border-slate-100 mb-4">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-2">✓</div>
        <h2 class="text-xl font-black text-slate-900">THANH TOÁN THÀNH CÔNG</h2>
        <p class="text-xs text-slate-400 mt-1">Cảm ơn bạn đã sử dụng dịch vụ PARKING.GO</p>
      </div>

      <div class="space-y-2 text-xs mb-4">
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Mã giao dịch:</span>
          <span class="font-mono font-bold text-slate-800">${transactionId}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Thời gian:</span>
          <span class="font-medium">${formatDateTime(paidAt)}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Biển số xe:</span>
          <span class="font-bold text-blue-600">${vehiclePlate}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Loại xe:</span>
          <span class="font-medium">${vehicleType}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Thời gian giữ xe:</span>
          <span class="font-medium">${duration}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-50">
          <span class="text-slate-500">Phương thức:</span>
          <span class="font-medium text-emerald-600">${paymentMethod}</span>
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs mb-6">
        <div class="flex justify-between">
          <span class="text-slate-500">Thành tiền:</span>
          <span>${formatCurrency(originalAmount)}</span>
        </div>
        ${discountAmount > 0 ? `
          <div class="flex justify-between text-emerald-600">
            <span>Giảm giá (Voucher):</span>
            <span>-${formatCurrency(discountAmount)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
          <span>Tổng thanh toán:</span>
          <span class="text-emerald-600">${formatCurrency(finalAmount)}</span>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="button" onclick="window.print()" class="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition">
          🖨️ In phiếu thu
        </button>
      </div>
    </div>
  `;
}
