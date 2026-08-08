/**
 * Top Navigation Multi-Tenant Selector Pill Component
 */

import { tenantContext, DEFAULT_TENANTS } from '../core/tenant-context.js';
import { toast } from './toast.js';

export class TenantSelectorComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    tenantContext.subscribe((tenant) => {
      this.updateDisplay(tenant);
    });
  }

  render() {
    const activeTenant = tenantContext.getActiveTenant();

    this.container.innerHTML = `
      <div class="relative inline-block text-left">
        <button id="tenant-selector-btn" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm text-sm font-semibold text-slate-800 transition-all hover:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <svg class="w-4 h-4 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span id="active-tenant-name">${activeTenant.name}</span>
          <span class="px-1.5 py-0.5 text-[11px] font-bold tracking-wider rounded bg-slate-100 text-slate-600 border border-slate-200">${activeTenant.code}</span>
          <svg class="w-4 h-4 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div id="tenant-selector-dropdown" class="hidden absolute left-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-100 py-2 z-50 animate-popIn">
          <div class="px-4 py-2 border-b border-slate-100">
            <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Chọn Khu vực / Tenant</div>
            <div class="text-[12px] text-slate-500 font-medium">Multi-Tenant Context Scoping</div>
          </div>
          <div class="py-1">
            ${DEFAULT_TENANTS.map(tenant => `
              <button data-tenant-id="${tenant.id}" class="tenant-option-btn w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                <div>
                  <div class="text-sm font-semibold text-slate-800">${tenant.name}</div>
                  <div class="text-xs text-slate-400 font-mono">${tenant.code}</div>
                </div>
                ${tenant.id === activeTenant.id ? `
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ` : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btn = this.container.querySelector('#tenant-selector-btn');
    const dropdown = this.container.querySelector('#tenant-selector-dropdown');

    if (btn && dropdown) {
      btn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      };

      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });

      this.container.querySelectorAll('.tenant-option-btn').forEach(optionBtn => {
        optionBtn.onclick = () => {
          const tenantId = optionBtn.getAttribute('data-tenant-id');
          const selectedTenant = DEFAULT_TENANTS.find(t => t.id === tenantId);
          if (selectedTenant) {
            tenantContext.setActiveTenant(selectedTenant);
            toast.show(`Đã chuyển Tenant: ${selectedTenant.name}`, 'success');
            dropdown.classList.add('hidden');
            this.render();
            // Trigger app-wide refresh event
            window.dispatchEvent(new CustomEvent('tenant:changed', { detail: selectedTenant }));
          }
        };
      });
    }
  }

  updateDisplay(tenant) {
    const nameEl = this.container.querySelector('#active-tenant-name');
    if (nameEl) nameEl.textContent = tenant.name;
  }
}
