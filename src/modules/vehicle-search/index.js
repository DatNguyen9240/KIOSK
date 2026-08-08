/**
 * Vehicle Search Module
 */

import { searchVehicle } from '../../services/vehicle.service.js';
import { debounce } from '../../utils/debounce.js';
import { toast } from '../../components/toast.js';
import { UISelect } from '../../components/ui-select.js';

export function initVehicleSearchModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card space-y-6">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-xl font-black text-[#0B2C4D] tracking-tight">Tra cứu phương tiện (Quản lý)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Tìm kiếm theo Biển số, Họ tên, Số căn hộ, hoặc Số thẻ xe</p>
        </div>
      </div>

      <!-- Search Bar & Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="sm:col-span-3 relative">
          <input
            type="text"
            id="vehicle-search-input"
            placeholder="Nhập biển số xe (VD: 30F-123.45), Tên cư dân, hoặc Số căn hộ (A1-1205)..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>
        <div id="vehicle-search-type-wrap"></div>
      </div>

      <!-- Results Grid / Table -->
      <div id="vehicle-results-container" class="min-h-[200px]">
        <div class="text-center py-12 text-slate-400 text-xs">Đang tải danh sách xe...</div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#vehicle-search-input');
  const resultsContainer = container.querySelector('#vehicle-results-container');

  const searchTypeUISelect = new UISelect({
    container: container.querySelector('#vehicle-search-type-wrap'),
    options: [
      { value: 'ALL', label: 'Tất cả loại tìm kiếm' },
      { value: 'PLATE', label: 'Theo Biển số xe' },
      { value: 'NAME', label: 'Theo Họ tên' },
      { value: 'APARTMENT', label: 'Theo Số căn hộ' },
      { value: 'CARD', label: 'Theo Số thẻ xe' }
    ],
    value: 'ALL',
    onChange: () => executeSearch()
  });

  const executeSearch = async () => {
    const query = searchInput.value.trim();
    const type = searchTypeUISelect.getValue();

    resultsContainer.innerHTML = `<div class="flex items-center justify-center py-12 text-[#0B2C4D] font-bold text-xs gap-2"><div class="animate-spin w-4 h-4 border-2 border-[#0B2C4D] border-t-transparent rounded-full"></div> Đang tìm kiếm...</div>`;

    try {
      const results = await searchVehicle(query, type);
      renderVehicleResults(results, resultsContainer);
    } catch (err) {
      resultsContainer.innerHTML = `<div class="text-center py-8 text-rose-500 text-xs">Lỗi tìm kiếm dữ liệu. Vui lòng thử lại.</div>`;
      toast.show('Không thể tải dữ liệu xe', 'error');
    }
  };

  const debouncedSearch = debounce(executeSearch, 300);

  searchInput.addEventListener('input', debouncedSearch);

  // Initial load
  executeSearch();
}

function renderVehicleResults(vehicles, container) {
  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <svg class="w-8 h-8 text-slate-300 mx-auto mb-2 fill-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
        <p class="text-xs font-bold text-slate-700">Không tìm thấy phương tiện phù hợp</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Vui lòng kiểm tra lại từ khóa tìm kiếm</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th class="py-3 px-4 rounded-l-2xl">Loại xe</th>
            <th class="py-3 px-4">Biển số</th>
            <th class="py-3 px-4">Cư dân</th>
            <th class="py-3 px-4">Căn hộ</th>
            <th class="py-3 px-4">Số thẻ</th>
            <th class="py-3 px-4">Hạn giữ xe</th>
            <th class="py-3 px-4 rounded-r-2xl">Trạng thái</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-semibold text-slate-800">
          ${vehicles.map(v => `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="py-3.5 px-4 flex items-center gap-2">
                ${v.vehicleType === 'CAR' ? `
                  <span class="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                  </span>
                ` : `
                  <span class="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 7h-8v2h8v10H5V9h3V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  </span>
                `}
                <span class="font-bold text-slate-900">${v.vehicleName}</span>
              </td>
              <td class="py-3.5 px-4 font-bold text-[#0B2C4D] font-mono">${v.plateNumber}</td>
              <td class="py-3.5 px-4 text-slate-900 font-bold">${v.residentName}</td>
              <td class="py-3.5 px-4"><span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">${v.apartmentNumber}</span></td>
              <td class="py-3.5 px-4 font-mono text-slate-500">${v.cardNumber}</td>
              <td class="py-3.5 px-4 text-slate-500">${v.expireDate}</td>
              <td class="py-3.5 px-4">
                ${v.status === 'ACTIVE' ? '<span class="px-3 py-1 bg-[#D1FADF] text-[#027A48] rounded-full font-extrabold text-[11px] inline-block">Còn hiệu lực</span>' : ''}
                ${v.status === 'EXPIRING_SOON' ? '<span class="px-3 py-1 bg-[#FEF0C7] text-[#DC6803] rounded-full font-extrabold text-[11px] inline-block">Sắp hết hạn</span>' : ''}
                ${v.status === 'EXPIRED' ? '<span class="px-3 py-1 bg-[#FEE4E2] text-[#D92D20] rounded-full font-extrabold text-[11px] inline-block">Quá hạn</span>' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

