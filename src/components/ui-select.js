/**
 * UISelect — Custom Tailwind dropdown replacing native <select>
 *
 * Usage:
 *   const sel = new UISelect({
 *     container: el,          // element to render into
 *     options: [{ value, label }],
 *     value: 'ALL',           // initial selected value
 *     placeholder: 'Chọn...',
 *     onChange: (value, label) => {}
 *   });
 *   sel.getValue()  → current value
 *   sel.getLabel()  → current label
 *   sel.setValue(v) → set programmatically
 */

export class UISelect {
  constructor({ container, options = [], value = null, placeholder = 'Chọn...', onChange = null } = {}) {
    this.container = container;
    this.options = options;
    this.selected = value ?? (options[0]?.value ?? null);
    this.placeholder = placeholder;
    this.onChange = onChange;
    this._open = false;
    this._uid = `uisel-${Math.random().toString(36).slice(2, 8)}`;
    this._outsideHandler = null;
    this.render();
  }

  getValue() {
    return this.selected;
  }

  getLabel() {
    return this.options.find(o => o.value === this.selected)?.label ?? this.placeholder;
  }

  setValue(value) {
    this.selected = value;
    this._updateTrigger();
    this._updateOptions();
  }

  render() {
    this.container.innerHTML = `
      <div class="relative w-full" id="${this._uid}">
        <!-- Trigger button -->
        <button
          type="button"
          id="${this._uid}-trigger"
          class="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <span id="${this._uid}-label" class="truncate">${this.getLabel()}</span>
          <svg id="${this._uid}-chevron" class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>

        <!-- Dropdown panel -->
        <div
          id="${this._uid}-panel"
          class="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden py-1 opacity-0 scale-95 pointer-events-none"
          style="transition: opacity 150ms ease, transform 150ms ease; transform-origin: top center;"
        >
          ${this.options.map(opt => `
            <button
              type="button"
              data-value="${opt.value}"
              class="uisel-option w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <span class="uisel-check w-3.5 h-3.5 shrink-0 ${this.selected === opt.value ? 'opacity-100' : 'opacity-0'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0B2C4D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span>${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const trigger = this.container.querySelector(`#${this._uid}-trigger`);
    const panel = this.container.querySelector(`#${this._uid}-panel`);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this._open ? this._close() : this._openPanel();
    });

    panel.querySelectorAll('.uisel-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.dataset.value;
        const label = btn.querySelector('span:last-child').textContent;
        this.selected = val;
        this._updateTrigger();
        this._updateOptions();
        this._close();
        if (this.onChange) this.onChange(val, label);
      });
    });

    // Close on outside click
    this._outsideHandler = (e) => {
      if (!this.container.contains(e.target)) this._close();
    };
    document.addEventListener('click', this._outsideHandler);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._open) this._close();
    });

    // Close when another dropdown opens
    this._closeAllHandler = (e) => {
      if (e.detail?.source !== this && this._open) {
        this._close();
      }
    };
    window.addEventListener('app:close-all-popups', this._closeAllHandler);
  }

  close() {
    this._close();
  }

  _openPanel() {
    window.dispatchEvent(new CustomEvent('app:close-all-popups', { detail: { source: this } }));
    const panel = this.container.querySelector(`#${this._uid}-panel`);
    const chevron = this.container.querySelector(`#${this._uid}-chevron`);
    this._open = true;
    panel.style.opacity = '1';
    panel.style.transform = 'scale(1)';
    panel.classList.remove('pointer-events-none');
    chevron.style.transform = 'rotate(180deg)';
  }

  _close() {
    const panel = this.container.querySelector(`#${this._uid}-panel`);
    const chevron = this.container.querySelector(`#${this._uid}-chevron`);
    if (!panel) return;
    this._open = false;
    panel.style.opacity = '0';
    panel.style.transform = 'scale(0.95)';
    panel.classList.add('pointer-events-none');
    chevron.style.transform = 'rotate(0deg)';
  }

  _updateTrigger() {
    const label = this.container.querySelector(`#${this._uid}-label`);
    if (label) label.textContent = this.getLabel();
  }

  _updateOptions() {
    this.container.querySelectorAll('.uisel-option').forEach(btn => {
      const check = btn.querySelector('.uisel-check');
      if (check) {
        check.style.opacity = btn.dataset.value === this.selected ? '1' : '0';
      }
    });
  }

  destroy() {
    if (this._outsideHandler) {
      document.removeEventListener('click', this._outsideHandler);
    }
    this.container.innerHTML = '';
  }
}
