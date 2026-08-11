/**
 * Building & Parking Infrastructure Module
 */

import { toast } from '#components/toast.js';

export function initParkingInfrastructureModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Sơ đồ hạ tầng & Vị trí đỗ (Infrastructure Map)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Giám sát trạng thái realtime ô đỗ xe tại các tầng hầm tòa nhà</p>
        </div>
        <div class="flex gap-2">
          <select id="floor-select" class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <option value="B1">Tầng hầm B1</option>
            <option value="B2">Tầng hầm B2</option>
            <option value="B3">Tầng hầm B3</option>
          </select>
        </div>
      </div>

      <!-- Legends -->
      <div class="flex flex-wrap gap-4 text-xs font-bold items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <span class="text-slate-400">Trạng thái ô đỗ:</span>
        <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-md bg-emerald-500"></span>Trống (GREEN)</span>
        <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-md bg-rose-500"></span>Đang đỗ (RED)</span>
        <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-md bg-amber-400"></span>Đặt trước (YELLOW)</span>
        <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-md bg-slate-300"></span>Bảo trì (GRAY)</span>
      </div>

      <!-- Realtime Map Layout Grid -->
      <div class="p-4 bg-slate-100 rounded-2xl border border-slate-200/50">
        <div class="text-center font-black text-slate-500 text-[10px] tracking-wider uppercase mb-4">LỐI VÀO CHÍNH / MAIN ENTRY GATE</div>
        
        <div class="grid grid-cols-5 sm:grid-cols-10 gap-3" id="slots-map-grid"></div>

        <div class="text-center font-black text-slate-500 text-[10px] tracking-wider uppercase mt-4">LỐI RA KHU VỰC / MAIN EXIT GATE</div>
      </div>
    </div>
  `;

  const slotsGrid = container.querySelector('#slots-map-grid');
  const floorSelect = container.querySelector('#floor-select');

  const renderSlotsMap = (floor) => {
    slotsGrid.innerHTML = '';
    
    // Generate 40 mock parking slots with different statuses
    for (let i = 1; i <= 40; i++) {
      const slotCode = `${floor}-A${String(i).padStart(2, '0')}`;
      let status = 'VACANT'; // default green
      let statusColor = 'bg-emerald-500 text-white';
      
      if (i % 3 === 0) {
        status = 'OCCUPIED'; // red
        statusColor = 'bg-rose-500 text-white';
      } else if (i % 7 === 0) {
        status = 'RESERVED'; // yellow
        statusColor = 'bg-amber-400 text-slate-900';
      } else if (i % 13 === 0) {
        status = 'MAINTENANCE'; // gray
        statusColor = 'bg-slate-300 text-slate-600';
      }

      const slotBtn = document.createElement('button');
      slotBtn.className = `p-2.5 rounded-xl font-mono font-bold text-[10px] sm:text-xs transition hover:scale-105 active:scale-95 shadow-xs flex flex-col items-center justify-center gap-1 ${statusColor}`;
      slotBtn.innerHTML = `
        <span>${slotCode}</span>
        <span class="text-[8px] opacity-80 font-sans">${status === 'VACANT' ? 'Trống' : status === 'OCCUPIED' ? 'Có xe' : status === 'RESERVED' ? 'Vip' : 'Lỗi'}</span>
      `;

      slotBtn.onclick = () => {
        toast.show(`Chi tiết ô đỗ ${slotCode} - Trạng thái: ${status}`, 'info');
      };

      slotsGrid.appendChild(slotBtn);
    }
  };

  floorSelect.onchange = (e) => {
    renderSlotsMap(e.target.value);
  };

  // Initial map generation
  renderSlotsMap('B1');
}
