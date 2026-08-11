/**
 * Quick Search Drawer Utility Manager
 */

import { searchVehicle } from '#services/vehicle.service.js';
import { toast } from '#components/toast.js';

export function initQuickSearchDrawer() {
  if (typeof document === 'undefined') return;

  const drawer = document.getElementById('quick-search-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const closeBtn = document.getElementById('close-drawer-btn');
  const searchInput = document.getElementById('drawer-search-input');
  const searchBtn = document.getElementById('drawer-search-btn');
  const resultsBox = document.getElementById('drawer-results-box');

  if (!drawer || !backdrop) return;

  const openDrawer = (initialQuery = '') => {
    drawer.classList.remove('translate-x-full');
    drawer.classList.add('translate-x-0');
    backdrop.classList.remove('hidden');

    if (initialQuery) {
      searchInput.value = initialQuery;
      performSearch(initialQuery);
    }
  };

  const closeDrawer = () => {
    drawer.classList.remove('translate-x-0');
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  };

  const performSearch = async (query) => {
    const term = query.trim();
    if (!term) {
      toast.show('Vui lòng nhập từ khóa tìm kiếm', 'warning');
      return;
    }

    resultsBox.innerHTML = `
      <div class="text-center py-16 text-slate-400 space-y-2">
        <div class="animate-spin w-5 h-5 border-2 border-[#0B2C4D] border-t-transparent rounded-full mx-auto"></div>
        <div class="text-xs">Đang truy vấn dữ liệu...</div>
      </div>
    `;

    try {
      const vehicles = await searchVehicle(term);
      if (vehicles && vehicles.length > 0) {
        const vehicle = vehicles[0]; // Display top hit details
        resultsBox.innerHTML = renderVehicleDetailsHtml(vehicle);
      } else {
        resultsBox.innerHTML = `
          <div class="text-center py-16 text-slate-400 space-y-1">
            <svg class="w-10 h-10 mx-auto text-slate-300 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <div class="text-xs font-bold">Không tìm thấy xe phù hợp</div>
            <div class="text-[10px] text-slate-400">Vui lòng thử lại với biển số khác</div>
          </div>
        `;
      }
    } catch (err) {
      resultsBox.innerHTML = `
        <div class="text-center py-16 text-rose-500 text-xs font-bold">
          Lỗi truy vấn thông tin: ${err.message}
        </div>
      `;
    }
  };

  if (closeBtn) closeBtn.onclick = closeDrawer;
  if (backdrop) backdrop.onclick = closeDrawer;
  if (searchBtn) {
    searchBtn.onclick = () => performSearch(searchInput.value);
  }
  if (searchInput) {
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') performSearch(searchInput.value);
    };
  }

  // Bind to global window object for easy call from other modules
  window.parkingGoQuickSearch = {
    open: openDrawer,
    close: closeDrawer
  };
}

function renderVehicleDetailsHtml(vehicle) {
  const isCar = vehicle.vehicleType === 'CAR' || (vehicle.vehicleName || '').toLowerCase().includes('car') || (vehicle.vehicleName || '').toLowerCase().includes('camry') || (vehicle.vehicleName || '').toLowerCase().includes('honda cr-v');
  const imgUrl = isCar 
    ? 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=300'
    : 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=300';

  const statusColor = vehicle.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
  const statusText = vehicle.status === 'EXPIRED' ? 'Quá hạn' : 'Đang trong bãi';

  return `
    <!-- Vehicle Photo Card -->
    <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
      <!-- Status Badge -->
      <span class="absolute top-3 right-3 px-2 py-0.5 ${statusColor} text-[9px] font-extrabold rounded-full border">
        ${statusText}
      </span>
      <img src="${imgUrl}" alt="Xe thực tế" class="w-full h-32 object-cover rounded-xl border border-slate-100 shadow-xs" />
      <div class="text-sm font-black text-slate-900 font-mono tracking-wider">${vehicle.plateNumber}</div>
    </div>

    <!-- Basic Information List -->
    <div class="space-y-2.5">
      <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thông tin chi tiết</h5>
      <div class="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs shadow-xs">
        <div class="flex justify-between"><span class="text-slate-500 font-medium">Chủ xe:</span><span class="font-bold text-slate-800">${vehicle.residentName || 'Trần Văn Tuấn'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500 font-medium">Căn hộ:</span><span class="font-bold text-slate-800">${vehicle.apartmentNumber || 'A1-12.05'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500 font-medium">Mã thẻ:</span><span class="font-mono font-bold text-slate-800">${vehicle.cardNumber || 'CARD-8831'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500 font-medium">Thời gian vào:</span><span class="font-bold text-slate-800">21/05/2024 08:15</span></div>
        <div class="flex justify-between"><span class="text-slate-500 font-medium">Cổng vào:</span><span class="font-bold text-[#0B2C4D]">A1 - Cổng 1</span></div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-2 shrink-0">
      <button class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-[11px] border border-slate-200/50">Lịch sử ra vào</button>
      <button class="py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white font-extrabold rounded-xl transition shadow-sm text-[11px]">Thanh toán phí</button>
    </div>

    <!-- Access Log Mini Table -->
    <div class="space-y-2">
      <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lịch sử ra vào gần đây</h5>
      <div class="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-white divide-y divide-slate-100">
        <div class="p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-50 transition">
          <div>
            <div class="font-bold text-slate-800">21/05/2024 08:15</div>
            <div class="text-[9px] text-slate-400">Cổng vào: A1 - Cổng 1</div>
          </div>
          <span class="text-slate-500 font-medium">${vehicle.vehicleType === 'CAR' ? 'Thẻ Ô tô' : 'Thẻ Xe máy'}</span>
        </div>
        <div class="p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-50 transition">
          <div>
            <div class="font-bold text-slate-800">20/05/2024 18:22</div>
            <div class="text-[9px] text-slate-400">Cổng ra: A1 - Cổng 1</div>
          </div>
          <span class="text-slate-500 font-medium">${vehicle.vehicleType === 'CAR' ? 'Thẻ Ô tô' : 'Thẻ Xe máy'}</span>
        </div>
      </div>
    </div>

    <!-- Owner's Debt Summary -->
    <div class="space-y-2">
      <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Công nợ chủ hộ</h5>
      <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <div class="text-slate-400 font-bold mb-0.5">Tổng nợ</div>
          <div class="font-black text-slate-900">2,100k</div>
        </div>
        <div class="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
          <div class="text-blue-500 font-bold mb-0.5">Sắp tới hạn</div>
          <div class="font-black text-blue-700">700k</div>
        </div>
        <div class="bg-rose-50 p-2 rounded-xl border border-rose-100">
          <div class="text-rose-500 font-bold mb-0.5">Quá hạn</div>
          <div class="font-black text-rose-700">1,400k</div>
        </div>
      </div>
    </div>
  `;
}
