/**
 * Vehicle Search Module
 */

import { searchVehicle, getVehiclesByApartment } from '../../services/vehicle.service.js';
import { debounce } from '../../utils/debounce.js';
import { toast } from '../../components/toast.js';

export function initVehicleSearchModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Tra cứu phương tiện (Quản lý)</h2>
          <p class="text-xs text-slate-500">Tìm kiếm theo Biển số, Họ tên, Số căn hộ (ra toàn bộ xe), hoặc Số thẻ xe</p>
        </div>
      </div>

      <!-- Search Bar & Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="sm:col-span-3 relative">
          <input
            type="text"
            id="vehicle-search-input"
            placeholder="Nhập biển số xe (VD: 30F-123.45), Tên cư dân, hoặc Số căn hộ (A1-1205)..."
            class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <span class="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
        </div>
        <div>
          <select id="vehicle-search-type" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-700 focus:outline-none">
            <option value="ALL">Tất cả loại tìm kiếm</option>
            <option value="PLATE">Theo Biển số xe</option>
            <option value="NAME">Theo Họ tên</option>
            <option value="APARTMENT">Theo Số căn hộ</option>
            <option value="CARD">Theo Số thẻ xe</option>
          </select>
        </div>
      </div>

      <!-- Results Grid / Table -->
      <div id="vehicle-results-container" class="min-h-[200px]">
        <div class="text-center py-12 text-slate-400 text-sm">Đang tải danh sách xe...</div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#vehicle-search-input');
  const searchTypeSelect = container.querySelector('#vehicle-search-type');
  const resultsContainer = container.querySelector('#vehicle-results-container');

  const executeSearch = async () => {
    const query = searchInput.value.trim();
    const type = searchTypeSelect.value;

    resultsContainer.innerHTML = `<div class="flex items-center justify-center py-12 text-blue-600 font-medium text-sm gap-2"><div class="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div> Đang tìm kiếm...</div>`;

    try {
      const results = await searchVehicle(query, type);
      renderVehicleResults(results, resultsContainer);
    } catch (err) {
      resultsContainer.innerHTML = `<div class="text-center py-8 text-rose-500 text-sm">Lỗi tìm kiếm dữ liệu. Vui lòng thử lại.</div>`;
      toast.show('Không thể tải dữ liệu xe', 'error');
    }
  };

  const debouncedSearch = debounce(executeSearch, 300);

  searchInput.addEventListener('input', debouncedSearch);
  searchTypeSelect.addEventListener('change', executeSearch);

  // Initial load
  executeSearch();
}

function renderVehicleResults(vehicles, container) {
  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <span class="text-3xl block mb-2">🚗</span>
        <p class="text-sm font-semibold text-slate-700">Không tìm thấy phương tiện phù hợp</p>
        <p class="text-xs text-slate-400 mt-1">Vui lòng kiểm tra lại từ khóa tìm kiếm</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
          <tr>
            <th class="p-3.5 rounded-l-2xl">Loại xe</th>
            <th class="p-3.5">Biển số</th>
            <th class="p-3.5">Cư dân</th>
            <th class="p-3.5">Căn hộ</th>
            <th class="p-3.5">Số thẻ</th>
            <th class="p-3.5">Hạn giữ xe</th>
            <th class="p-3.5 rounded-r-2xl">Trạng thái</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${vehicles.map(v => `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="p-3.5 flex items-center gap-2">
                <span>${v.vehicleType === 'CAR' ? '🚗' : '🛵'}</span>
                <span>${v.vehicleName}</span>
              </td>
              <td class="p-3.5 font-bold text-blue-600 font-mono">${v.plateNumber}</td>
              <td class="p-3.5 text-slate-900">${v.residentName}</td>
              <td class="p-3.5"><span class="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">${v.apartmentNumber}</span></td>
              <td class="p-3.5 font-mono text-xs text-slate-500">${v.cardNumber}</td>
              <td class="p-3.5 text-xs text-slate-600">${v.expireDate}</td>
              <td class="p-3.5">
                ${v.status === 'ACTIVE' ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Còn hiệu lực</span>' : ''}
                ${v.status === 'EXPIRING_SOON' ? '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Sắp hết hạn</span>' : ''}
                ${v.status === 'EXPIRED' ? '<span class="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Quá hạn</span>' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
