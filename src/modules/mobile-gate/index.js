/**
 * Mobile Gate Control App Module (Station Guard App)
 */

import { toast } from '../../components/toast.js';

export function initMobileGateModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-md mx-auto bg-slate-900 min-h-[550px] sm:min-h-[600px] rounded-[28px] sm:rounded-[40px] border-4 sm:border-8 border-slate-800 p-3 sm:p-4 text-white shadow-2xl flex flex-col justify-between select-none">
      <!-- Status Header Bar -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold tracking-wide">TRẠM KIỂM SOÁT THÁP A1</span>
        </div>
        <span class="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">BẢO VỆ #02</span>
      </div>

      <!-- Action Grid -->
      <div class="space-y-4 my-auto py-6">
        <div class="text-center space-y-1 mb-6">
          <h2 class="text-lg font-black tracking-wide text-slate-100">ỨNG DỤNG BẢO VỆ KHI LỖI MÁY TRẠM</h2>
          <p class="text-xs text-slate-400">Thao tác một tay kiểm soát xe vào/ra khẩn cấp</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="guard-scan-qr-btn" class="p-6 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-2 transition">
            <svg class="w-7 h-7 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 3a5 5 0 100 10 5 5 0 000-10z"/></svg>
            <span class="text-xs font-bold">Quét mã QR</span>
          </button>

          <button type="button" id="guard-enter-plate-btn" class="p-6 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-2 transition">
            <svg class="w-7 h-7 text-teal-400 fill-current" viewBox="0 0 24 24"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zM5 8h2v2H5V8zm0 3h2v2H5v-2zm11 6H8v-2h8v2zm1-3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
            <span class="text-xs font-bold">Nhập biển số</span>
          </button>
        </div>

        <!-- Big Barrier Open Action Button -->
        <button type="button" id="guard-open-barrier-btn" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-3xl shadow-lg shadow-emerald-600/40 text-base flex items-center justify-center gap-2 transition">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          <span>BẤM MỞ BARIE CHO XE QUA</span>
        </button>

        <div id="guard-log-status" class="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 text-center text-xs text-slate-400">
          Trạng thái trạm: Hoạt động bình thường
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="text-center text-[10px] text-slate-500 py-2 border-t border-slate-800">
        PARKING Mobile Gate Control v2.4
      </div>
    </div>
  `;

  const scanBtn = container.querySelector('#guard-scan-qr-btn');
  const plateBtn = container.querySelector('#guard-enter-plate-btn');
  const openBarrierBtn = container.querySelector('#guard-open-barrier-btn');
  const logStatus = container.querySelector('#guard-log-status');

  scanBtn.onclick = () => {
    toast.show('Đang mở máy quét QR camera...', 'info');
  };

  plateBtn.onclick = () => {
    const plate = prompt('Nhập biển số xe (VD: 30F-123.45):', '30F-123.45');
    if (plate) {
      logStatus.innerHTML = `<span class="text-emerald-400 font-bold">✓ Đã kiểm tra xe ${plate.toUpperCase()} - Hợp lệ!</span>`;
      toast.show(`Xe ${plate.toUpperCase()} hợp lệ`, 'success');
    }
  };

  openBarrierBtn.onclick = () => {
    openBarrierBtn.disabled = true;
    openBarrierBtn.className = 'w-full py-5 bg-amber-600 text-white font-black rounded-3xl shadow-lg text-base flex items-center justify-center gap-3 animate-pulse';
    openBarrierBtn.innerHTML = `<span class="text-2xl">🚧</span> <span>ĐANG MỞ BARIE...</span>`;

    setTimeout(() => {
      openBarrierBtn.disabled = false;
      openBarrierBtn.className = 'w-full py-5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-3xl shadow-lg shadow-emerald-600/40 text-base flex items-center justify-center gap-3 transition';
      openBarrierBtn.innerHTML = `<span class="text-2xl">🚧</span> <span>BẤM MỞ BARIE CHO XE QUA</span>`;
      logStatus.innerHTML = `<span class="text-emerald-400 font-bold">✓ Đã mở Barie thành công (${new Date().toLocaleTimeString()})</span>`;
      toast.show('Đã gửi lệnh MỞ BARIE thành công!', 'success');
    }, 1500);
  };
}
