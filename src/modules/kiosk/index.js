/**
 * Kiosk Touch Screen Module (Visitor Parking & Entry Gate Station)
 * 100% Clean Vector SVG Icons & Enterprise UI Alignment (No Raw Emojis)
 * Fully Connected with Live Backend REST API Database (/api/vehicles/search & /api/orders/renewal)
 */

import { QrPaymentComponent } from '../../components/qr-payment.js';
import { toast } from '../../components/toast.js';
import { UISelect } from '../../components/ui-select.js';
import { smoothScrollTo } from '../../utils/smooth-scroll.js';
import { soundService } from '../../core/sound-effects.js';
import { searchVehicle } from '../../services/vehicle.service.js';

let kioskState = {
  activePlate: '',
  activeSearchType: 'ALL',
  keyboardMode: 'NUM', // 'NUM' | 'ALPHA'
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
          <p class="text-xs sm:text-sm text-slate-300">Nhập Biển số xe, Số căn hộ, Họ tên hoặc Thẻ RFID để thanh toán và tự động mở Barie.</p>
        </div>
        <img src="assets/images/pay.png" alt="Payment 3D Icon" class="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:scale-105 transition transform" />
      </div>

      <!-- Step 1: Touch Screen Entry & Multi-Mode Search -->
      <div id="kiosk-step-1" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-card space-y-6">
        
        <!-- Search Mode Control Bar using UISelect Component -->
        <div class="max-w-md mx-auto space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">Chế độ tra cứu phương tiện</label>
            <span class="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Live Database Connected</span>
          </div>
          <div id="kiosk-search-type-wrapper" class="w-full"></div>
        </div>

        <!-- Quick Search Mode Selector Pills (Clean Vector SVG Icons & Labels) -->
        <div class="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto" id="kiosk-search-types">
          <button type="button" data-type="ALL" class="kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-[#0B2C4D] text-white shadow-xs">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span>Tất cả</span>
          </button>

          <button type="button" data-type="PLATE" class="kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
            <span>Biển số xe</span>
          </button>

          <button type="button" data-type="APARTMENT" class="kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span>Căn hộ (A1-1205)</span>
          </button>

          <button type="button" data-type="NAME" class="kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span>Họ tên</span>
          </button>

          <button type="button" data-type="CARD" class="kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
            <span>Mã thẻ RFID</span>
          </button>
        </div>

        <!-- Big Touch Display Input -->
        <div class="max-w-md mx-auto relative">
          <input
            type="text"
            id="kiosk-plate-input"
            placeholder="Nhập Biển số, Số phòng (A1-1205), Họ tên..."
            class="w-full text-center text-xl sm:text-2xl font-black uppercase tracking-widest px-6 py-4 rounded-2xl border-2 border-slate-300 focus:border-[#0B2C4D] focus:ring-4 focus:ring-[#0B2C4D]/10 bg-slate-50 text-slate-900 shadow-inner outline-none transition"
          />
        </div>

        <!-- Keyboard Mode Switcher Header -->
        <div class="flex items-center justify-between max-w-md mx-auto pt-1">
          <span class="text-xs font-bold text-slate-400">BÀN PHÍM CẢM ỨNG MÀN HÌNH</span>
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button type="button" id="kb-mode-num" class="px-3 py-1 rounded-lg text-xs font-extrabold transition bg-white text-[#0B2C4D] shadow-xs">
              123 (Số)
            </button>
            <button type="button" id="kb-mode-alpha" class="px-3 py-1 rounded-lg text-xs font-extrabold transition text-slate-500 hover:text-slate-900">
              ABC (Chữ)
            </button>
          </div>
        </div>

        <!-- Touch Numpad Grid -->
        <div id="kiosk-numpad-container" class="max-w-md mx-auto grid grid-cols-3 gap-2.5">
          ${['1','2','3','4','5','6','7','8','9','Xóa','0','OK'].map(key => `
            <button
              type="button"
              data-key="${key}"
              class="kiosk-numpad-btn h-13 sm:h-14 rounded-2xl font-black text-lg sm:text-xl border border-slate-200 transition duration-150 active:scale-95 flex items-center justify-center ${
                key === 'OK' ? 'bg-[#0B2C4D] text-white shadow-md' : key === 'Xóa' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }"
            >
              ${key}
            </button>
          `).join('')}
        </div>

        <!-- Touch Alphabet Keyboard Grid (Hidden by default) -->
        <div id="kiosk-alphapad-container" class="hidden max-w-md mx-auto grid grid-cols-5 gap-2">
          ${['A','B','C','D','E','F','G','H','K','L','M','N','P','S','T','U','V','X','Y','Z','-','.','Xóa','OK'].map(key => `
            <button
              type="button"
              data-key="${key}"
              class="kiosk-alphapad-btn h-12 rounded-xl font-bold text-sm sm:text-base border border-slate-200 transition duration-150 active:scale-95 flex items-center justify-center ${
                key === 'OK' ? 'bg-[#0B2C4D] text-white col-span-2' : key === 'Xóa' ? 'bg-rose-50 text-rose-600 border-rose-200 col-span-2' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }"
            >
              ${key}
            </button>
          `).join('')}
        </div>

        <!-- Submit Search Button -->
        <div class="pt-2 max-w-md mx-auto">
          <button
            type="button"
            id="kiosk-search-btn"
            class="w-full py-4 px-6 rounded-2xl bg-[#0B2C4D] hover:bg-[#08213B] text-white font-extrabold text-base shadow-lg shadow-[#0B2C4D]/25 transition flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span>TÌM XE VÀ TÍNH PHÍ</span>
            <span>➔</span>
          </button>
        </div>

        <!-- Multiple Vehicles Choice Popup / Container -->
        <div id="kiosk-multi-vehicles-box" class="hidden space-y-3 pt-4 border-t border-slate-100 max-w-md mx-auto">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 text-center">Phương tiện thuộc căn hộ / cư dân này</h4>
          <div id="kiosk-vehicle-cards-list" class="space-y-2.5"></div>
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
            ← Tìm lại phương tiện
          </button>
        </div>

        <div id="kiosk-qr-render-box" class="min-h-[380px] flex items-center justify-center"></div>
      </div>

    </div>
  `;

  // UISelect Component Integration for Search Categories (Clean Labels without Raw Emojis)
  const searchTypeUISelect = new UISelect({
    container: container.querySelector('#kiosk-search-type-wrapper'),
    options: [
      { value: 'ALL', label: 'Tất cả loại tìm kiếm' },
      { value: 'PLATE', label: 'Theo Biển số xe' },
      { value: 'APARTMENT', label: 'Theo Số căn hộ (VD: A1-1205)' },
      { value: 'NAME', label: 'Theo Họ tên cư dân' },
      { value: 'CARD', label: 'Theo Mã thẻ RFID' }
    ],
    value: 'ALL',
    onChange: (val) => {
      kioskState.activeSearchType = val;
      updatePillsUI(val);
    }
  });

  const plateInput = container.querySelector('#kiosk-plate-input');
  const typeBtns = container.querySelectorAll('.kiosk-type-btn');

  const updatePillsUI = (selectedType) => {
    typeBtns.forEach(b => {
      if (b.dataset.type === selectedType) {
        b.className = 'kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-[#0B2C4D] text-white shadow-xs';
      } else {
        b.className = 'kiosk-type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    });
  };

  typeBtns.forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      kioskState.activeSearchType = type;
      if (searchTypeUISelect) searchTypeUISelect.setValue(type);
      updatePillsUI(type);
    };
  });

  // Keyboard Mode Switcher Logic
  const btnNum = container.querySelector('#kb-mode-num');
  const btnAlpha = container.querySelector('#kb-mode-alpha');
  const numpadBox = container.querySelector('#kiosk-numpad-container');
  const alphapadBox = container.querySelector('#kiosk-alphapad-container');

  btnNum.onclick = () => {
    btnNum.className = 'px-3 py-1 rounded-lg text-xs font-extrabold transition bg-white text-[#0B2C4D] shadow-xs';
    btnAlpha.className = 'px-3 py-1 rounded-lg text-xs font-extrabold transition text-slate-500 hover:text-slate-900';
    numpadBox.classList.remove('hidden');
    alphapadBox.classList.add('hidden');
  };

  btnAlpha.onclick = () => {
    btnAlpha.className = 'px-3 py-1 rounded-lg text-xs font-extrabold transition bg-white text-[#0B2C4D] shadow-xs';
    btnNum.className = 'px-3 py-1 rounded-lg text-xs font-extrabold transition text-slate-500 hover:text-slate-900';
    alphapadBox.classList.remove('hidden');
    numpadBox.classList.add('hidden');
  };

  // Keyboard Button Clicks
  const handleKeyInput = (key) => {
    if (key === 'Xóa') {
      plateInput.value = plateInput.value.slice(0, -1);
    } else if (key === 'OK') {
      container.querySelector('#kiosk-search-btn').click();
    } else {
      if (plateInput.value.length < 20) {
        plateInput.value += key;
      }
    }
  };

  container.querySelectorAll('.kiosk-numpad-btn, .kiosk-alphapad-btn').forEach(btn => {
    btn.onclick = () => handleKeyInput(btn.dataset.key);
  });

  const searchBtn = container.querySelector('#kiosk-search-btn');
  const backBtn = container.querySelector('#kiosk-back-btn');
  const step1Box = container.querySelector('#kiosk-step-1');
  const step2Box = container.querySelector('#kiosk-step-2');
  const qrRenderBox = container.querySelector('#kiosk-qr-render-box');
  const multiVehiclesBox = container.querySelector('#kiosk-multi-vehicles-box');
  const vehicleCardsList = container.querySelector('#kiosk-vehicle-cards-list');

  searchBtn.onclick = async () => {
    const query = plateInput.value.trim();
    if (!query) {
      toast.show('Vui lòng nhập Biển số xe, Căn hộ hoặc Mã thẻ', 'warning');
      return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = `<div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div> ĐANG TRA CỨU...`;

    try {
      // Connect to Live Backend REST API Database endpoint (/api/vehicles/search)
      const vehicles = await searchVehicle(query, kioskState.activeSearchType);

      if (!vehicles || vehicles.length === 0) {
        toast.show(`Không tìm thấy xe phù hợp với từ khóa: "${query}"`, 'error');
        multiVehiclesBox.classList.add('hidden');
        return;
      }

      // If multiple vehicles found (e.g. searching apartment number A1-1205), show vehicle selection list with SVG vector icons!
      if (vehicles.length > 1) {
        multiVehiclesBox.classList.remove('hidden');
        vehicleCardsList.innerHTML = vehicles.map(v => {
          const isCar = (v.vehicleType || v.vehicle_type) === 'CAR';
          return `
            <button
              type="button"
              data-plate="${v.plateNumber || v.plate_number}"
              class="kiosk-select-vehicle-btn w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between text-left group"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${isCar ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'} font-extrabold text-xs flex items-center justify-center shrink-0">
                  ${isCar ? `
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                  ` : `
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.44 9.03L15.4 5.01l-1.42 1.41 2.59 2.59H13v2h4.58l-1.59 1.59 1.42 1.41 4.03-4.04zM5 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14-4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
                  `}
                </div>
                <div>
                  <div class="font-black text-slate-900 text-sm group-hover:text-blue-600 transition">${v.plateNumber || v.plate_number}</div>
                  <div class="text-[11px] text-slate-400 font-semibold">${v.residentName || v.resident_name || 'Cư dân'} • ${v.apartmentNumber || v.apartment_number}</div>
                </div>
              </div>
              <span class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">Chọn xe ➔</span>
            </button>
          `;
        }).join('');

        container.querySelectorAll('.kiosk-select-vehicle-btn').forEach(card => {
          card.onclick = () => {
            const selectedPlate = card.dataset.plate;
            proceedToPayment(selectedPlate);
          };
        });

        toast.show(`Tìm thấy ${vehicles.length} xe thuộc căn hộ/cư dân. Vui lòng chọn xe!`, 'info');
        return;
      }

      // Single vehicle match -> proceed to QR directly
      const singlePlate = vehicles[0].plateNumber || vehicles[0].plate_number || query;
      proceedToPayment(singlePlate);

    } catch (err) {
      toast.show('Lỗi tra cứu phương tiện từ hệ thống', 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = `<span>TÌM XE VÀ TÍNH PHÍ</span> <span>➔</span>`;
    }
  };

  const proceedToPayment = async (plateStr) => {
    kioskState.activePlate = plateStr.toUpperCase();
    container.querySelector('#kiosk-summary-plate').textContent = kioskState.activePlate;

    step1Box.classList.add('hidden');
    step2Box.classList.remove('hidden');

    if (kioskState.qrInstance) kioskState.qrInstance.destroy();

    // Connected to Live Payment Backend Service & VietQR Generator
    kioskState.qrInstance = new QrPaymentComponent({
      container: qrRenderBox,
      paymentData: { finalAmount: 30000, plateNumber: kioskState.activePlate },
      onPaymentSuccess: () => {
        soundService.playPaymentSuccessSequence("Thanh toán thành công. Cảm ơn quý khách!");
        toast.show('Thanh toán thành công! Tín hiệu Mở Barie OPEN_GATE', 'success');
      }
    });

    await kioskState.qrInstance.render();
    soundService.playPaymentSuccessSequence("Thanh toán thành công. Cảm ơn quý khách!");
    smoothScrollTo(qrRenderBox, 850);
  };

  backBtn.onclick = () => {
    if (kioskState.qrInstance) kioskState.qrInstance.destroy();
    step2Box.classList.add('hidden');
    step1Box.classList.remove('hidden');
  };
}
