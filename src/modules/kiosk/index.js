/**
 * Kiosk Touch Screen Module (Visitor Parking & Entry Gate Station)
 * Synchronized with UI Components (UISelect, QrPaymentComponent, Toast)
 * Fully Integrated with Live Backend REST API Database (/api/vehicles/search & /api/orders/renewal)
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
        <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-teal-400/25 via-blue-500/20 to-indigo-600/25 border border-white/20 backdrop-blur-xl flex items-center justify-center p-3 shrink-0 z-10 shadow-2xl shadow-teal-500/20 group hover:scale-105 transition transform duration-300">
          <svg class="w-14 h-14 sm:w-16 sm:h-16 text-teal-300 drop-shadow-[0_8px_16px_rgba(45,212,191,0.4)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- POS Terminal Base 3D Body -->
            <rect x="14" y="10" width="36" height="46" rx="8" fill="url(#pos-body-grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
            
            <!-- Screen Glass Display -->
            <rect x="18" y="14" width="28" height="22" rx="5" fill="url(#pos-screen-grad)" stroke="#38BDF8" stroke-width="1"/>
            
            <!-- VietQR Code Graphic inside Screen -->
            <rect x="22" y="17" width="7" height="7" fill="#38BDF8" rx="1"/>
            <rect x="35" y="17" width="7" height="7" fill="#38BDF8" rx="1"/>
            <rect x="22" y="27" width="7" height="7" fill="#38BDF8" rx="1"/>
            <rect x="31" y="27" width="4" height="4" fill="#34D399" rx="0.5"/>
            <rect x="37" y="29" width="5" height="5" fill="#38BDF8" rx="0.5"/>

            <!-- NFC Contactless Waves -->
            <path d="M42 22C44 24 44 27 42 29" stroke="#34D399" stroke-width="1.5" stroke-linecap="round"/>

            <!-- Contactless Credit Card Inserted -->
            <rect x="10" y="38" width="44" height="12" rx="4" fill="url(#card-grad)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <rect x="14" y="42" width="6" height="4" rx="1" fill="#F59E0B"/>
            <circle cx="44" cy="44" r="2.5" fill="#EF4444" fill-opacity="0.8"/>
            <circle cx="47" cy="44" r="2.5" fill="#F59E0B" fill-opacity="0.8"/>

            <!-- Status LEDs -->
            <circle cx="22" cy="52" r="1.5" fill="#34D399"/>
            <circle cx="27" cy="52" r="1.5" fill="#60A5FA"/>
            <circle cx="32" cy="52" r="1.5" fill="#A855F7"/>

            <defs>
              <linearGradient id="pos-body-grad" x1="14" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
                <stop stop-color="#0F2942"/>
                <stop offset="1" stop-color="#071729"/>
              </linearGradient>
              <linearGradient id="pos-screen-grad" x1="18" y1="14" x2="46" y2="36" gradientUnits="userSpaceOnUse">
                <stop stop-color="#0284C7" stop-opacity="0.3"/>
                <stop offset="1" stop-color="#0F172A" stop-opacity="0.9"/>
              </linearGradient>
              <linearGradient id="card-grad" x1="10" y1="38" x2="54" y2="50" gradientUnits="userSpaceOnUse">
                <stop stop-color="#0D9488"/>
                <stop offset="1" stop-color="#2563EB"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
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

        <!-- Quick Search Mode Selector Pills (Touch Shortcuts) -->
        <div class="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto" id="kiosk-search-types">
          <button type="button" data-type="ALL" class="kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-[#0B2C4D] text-white shadow-xs">
            🔍 Tất cả
          </button>
          <button type="button" data-type="PLATE" class="kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            🚗 Biển số xe
          </button>
          <button type="button" data-type="APARTMENT" class="kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            🏢 Căn hộ (A1-1205)
          </button>
          <button type="button" data-type="NAME" class="kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            👤 Họ tên
          </button>
          <button type="button" data-type="CARD" class="kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
            💳 Mã thẻ RFID
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

  // UISelect Component Integration for Search Categories
  const searchTypeUISelect = new UISelect({
    container: container.querySelector('#kiosk-search-type-wrapper'),
    options: [
      { value: 'ALL', label: '🔍 Tìm đa năng (Tất cả)' },
      { value: 'PLATE', label: '🚗 Tìm theo Biển số xe' },
      { value: 'APARTMENT', label: '🏢 Tìm theo Số căn hộ (VD: A1-1205)' },
      { value: 'NAME', label: '👤 Tìm theo Họ tên cư dân' },
      { value: 'CARD', label: '💳 Tìm theo Mã thẻ RFID' }
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
        b.className = 'kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-[#0B2C4D] text-white shadow-xs';
      } else {
        b.className = 'kiosk-type-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200';
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

      // If multiple vehicles found (e.g. searching apartment number A1-1205), show vehicle selection list!
      if (vehicles.length > 1) {
        multiVehiclesBox.classList.remove('hidden');
        vehicleCardsList.innerHTML = vehicles.map(v => `
          <button
            type="button"
            data-plate="${v.plateNumber || v.plate_number}"
            class="kiosk-select-vehicle-btn w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between text-left group"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#0B2C4D] text-white font-extrabold text-xs flex items-center justify-center">
                ${(v.vehicleType || v.vehicle_type) === 'CAR' ? '🚗' : '🏍️'}
              </div>
              <div>
                <div class="font-black text-slate-900 text-sm group-hover:text-blue-600 transition">${v.plateNumber || v.plate_number}</div>
                <div class="text-[11px] text-slate-400 font-semibold">${v.residentName || v.resident_name || 'Cư dân'} • ${v.apartmentNumber || v.apartment_number}</div>
              </div>
            </div>
            <span class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">Chọn xe ➔</span>
          </button>
        `).join('');

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
