/**
 * Top Navigation Multi-Tenant Selector Pill Component
 */

import { tenantContext, DEFAULT_TENANTS } from '../core/tenant-context.js';
import { toast } from './toast.js';

export class TenantSelectorComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.isOpen = false;
    this._outsideHandler = null;
    this._keyHandler = null;
    this._closeAllHandler = null;
    this._unsubscribeContext = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this._unsubscribeContext = tenantContext.subscribe((tenant) => {
      this.updateDisplay(tenant);
    });
  }

  render() {
    const activeTenant = tenantContext.getActiveTenant();

    this.container.innerHTML = `
      <div class="relative inline-block text-left max-w-full">
        <button id="tenant-selector-btn" type="button" class="inline-flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm text-[11px] sm:text-sm font-semibold text-slate-800 transition-all duration-200 hover:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 max-w-full cursor-pointer min-w-0">
          <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span id="active-tenant-name" class="truncate max-w-[65px] min-[360px]:max-w-[100px] min-[420px]:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] font-bold text-slate-800">${activeTenant.name}</span>
          <span id="active-tenant-code" class="px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 hidden min-[400px]:inline-block">${activeTenant.code}</span>
          <svg id="tenant-selector-chevron" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform duration-200 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div id="tenant-selector-dropdown" class="absolute left-0 top-full mt-2 w-[calc(100vw-24px)] max-w-[280px] sm:w-72 rounded-2xl bg-white shadow-2xl border border-slate-100/90 py-2 z-50 origin-top-left transition-all duration-200 ease-out opacity-0 scale-95 pointer-events-none">
          <div class="px-3 py-2 sm:px-4 border-b border-slate-100">
            <div class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Chọn Khu vực / Tenant</div>
            <div class="text-[11px] sm:text-[12px] text-slate-500 font-medium">Multi-Tenant Context Scoping</div>
          </div>
          <div class="py-1 max-h-60 overflow-y-auto custom-scrollbar" id="tenant-options-list">
            ${this.renderOptions(activeTenant)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderOptions(activeTenant) {
    return DEFAULT_TENANTS.map(tenant => `
      <button data-tenant-id="${tenant.id}" class="tenant-option-btn w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer ${tenant.id === activeTenant.id ? 'bg-slate-50/80' : ''}">
        <div class="min-w-0 pr-2">
          <div class="text-xs sm:text-sm font-bold ${tenant.id === activeTenant.id ? 'text-brand-teal' : 'text-slate-800 group-hover:text-slate-900'} truncate">${tenant.name}</div>
          <div class="text-[10px] sm:text-[11px] text-slate-400 font-mono tracking-tight">${tenant.code}</div>
        </div>
        ${tenant.id === activeTenant.id ? `
          <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        ` : ''}
      </button>
    `).join('');
  }

  bindEvents() {
    const btn = this.container.querySelector('#tenant-selector-btn');
    const dropdown = this.container.querySelector('#tenant-selector-dropdown');

    if (btn && dropdown) {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.toggle();
      };

      this.bindOptionEvents();

      if (this._outsideHandler) document.removeEventListener('click', this._outsideHandler);
      this._outsideHandler = (e) => {
        if (this.isOpen && !this.container.contains(e.target)) {
          this.close();
        }
      };
      document.addEventListener('click', this._outsideHandler);

      if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this._keyHandler);

      if (this._closeAllHandler) window.removeEventListener('app:close-all-popups', this._closeAllHandler);
      this._closeAllHandler = (e) => {
        if (e.detail?.source !== this && this.isOpen) {
          this.close();
        }
      };
      window.addEventListener('app:close-all-popups', this._closeAllHandler);
    }
  }

  bindOptionEvents() {
    this.container.querySelectorAll('.tenant-option-btn').forEach(optionBtn => {
      optionBtn.onclick = (e) => {
        e.stopPropagation();
        const tenantId = optionBtn.getAttribute('data-tenant-id');
        const selectedTenant = DEFAULT_TENANTS.find(t => t.id === tenantId);
        if (selectedTenant) {
          tenantContext.setActiveTenant(selectedTenant);
          toast.show(`Đã chuyển Tenant: ${selectedTenant.name}`, 'success');
          this.close();
          window.dispatchEvent(new CustomEvent('tenant:changed', { detail: selectedTenant }));
        }
      };
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    window.dispatchEvent(new CustomEvent('app:close-all-popups', { detail: { source: this } }));

    const btn = this.container.querySelector('#tenant-selector-btn');
    const dropdown = this.container.querySelector('#tenant-selector-dropdown');
    const chevron = this.container.querySelector('#tenant-selector-chevron');

    if (!dropdown) return;
    this.isOpen = true;

    // Smart positioning calculation for ultra-small screens (320px+)
    if (btn) {
      const btnRect = btn.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = Math.min(280, viewportWidth - 24);

      if (btnRect.left + dropdownWidth > viewportWidth - 12) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
        dropdown.style.transformOrigin = 'top right';
      } else {
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
        dropdown.style.transformOrigin = 'top left';
      }
    }

    dropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    dropdown.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');

    if (chevron) {
      chevron.style.transform = 'rotate(180deg)';
    }

    if (btn) {
      btn.classList.add('border-brand-teal', 'ring-2', 'ring-brand-teal/20', 'bg-white');
    }
  }

  close() {
    const btn = this.container.querySelector('#tenant-selector-btn');
    const dropdown = this.container.querySelector('#tenant-selector-dropdown');
    const chevron = this.container.querySelector('#tenant-selector-chevron');

    if (!dropdown) return;
    this.isOpen = false;

    dropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
    dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');

    if (chevron) {
      chevron.style.transform = 'rotate(0deg)';
    }

    if (btn) {
      btn.classList.remove('border-brand-teal', 'ring-2', 'ring-brand-teal/20', 'bg-white');
    }
  }

  updateDisplay(tenant) {
    const nameEl = this.container.querySelector('#active-tenant-name');
    const codeEl = this.container.querySelector('#active-tenant-code');
    const optionsList = this.container.querySelector('#tenant-options-list');

    if (nameEl) nameEl.textContent = tenant.name;
    if (codeEl) codeEl.textContent = tenant.code;
    if (optionsList) {
      optionsList.innerHTML = this.renderOptions(tenant);
      this.bindOptionEvents();
    }
  }

  destroy() {
    if (this._outsideHandler) document.removeEventListener('click', this._outsideHandler);
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    if (this._closeAllHandler) window.removeEventListener('app:close-all-popups', this._closeAllHandler);
    if (this._unsubscribeContext) this._unsubscribeContext();
  }
}
