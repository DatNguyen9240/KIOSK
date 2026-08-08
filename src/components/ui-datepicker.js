/**
 * UIDatepicker — Flatpickr wrapper với custom trigger button
 *
 * Requires Flatpickr to be loaded on the page (via CDN in index.html).
 *
 * Usage:
 *   const dp = new UIDatepicker({
 *     container: el,
 *     mode: 'range' | 'single',
 *     defaultDate: ['2024-05-01', '2024-05-08'],
 *     dateFormat: 'd/m/Y',
 *     onChange: (dates, dateStr) => {}
 *   });
 *   dp.getDateStr() → current displayed string
 *   dp.destroy()
 */

export class UIDatepicker {
  constructor({
    container,
    mode = 'range',
    defaultDate = null,
    dateFormat = 'd/m/Y',
    placeholder = 'Chọn ngày...',
    onChange = null
  } = {}) {
    this.container = container;
    this.mode = mode;
    this.defaultDate = defaultDate;
    this.dateFormat = dateFormat;
    this.placeholder = placeholder;
    this.onChange = onChange;
    this._fp = null;
    this._dateStr = '';
    this.render();
  }

  render() {
    const uid = `uidp-${Math.random().toString(36).slice(2, 8)}`;
    const calSvg = `<svg class="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>`;
    const chevronSvg = `<svg class="w-3.5 h-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>`;

    // Format default dates for display
    let initLabel = this.placeholder;
    if (this.defaultDate) {
      if (Array.isArray(this.defaultDate) && this.defaultDate.length === 2) {
        initLabel = this._fmtRange(new Date(this.defaultDate[0]), new Date(this.defaultDate[1]));
      } else if (typeof this.defaultDate === 'string') {
        initLabel = this._fmt(this.defaultDate);
      }
    }
    this._dateStr = initLabel;

    this.container.innerHTML = `
      <div class="relative" id="${uid}-wrap">
        <!-- Hidden input that Flatpickr attaches to -->
        <input type="text" id="${uid}-input" class="sr-only" readonly />

        <!-- Custom trigger button -->
        <button
          type="button"
          id="${uid}-trigger"
          class="flex items-center justify-between gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl text-[11px] sm:text-xs font-bold text-slate-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full min-w-0"
        >
          ${calSvg}
          <span id="${uid}-label" class="flex-1 text-left truncate min-w-0">${initLabel}</span>
          ${chevronSvg}
        </button>
      </div>
    `;

    // Wait for Flatpickr to be available (it's loaded via CDN)
    const initFP = () => {
      if (typeof flatpickr === 'undefined') {
        setTimeout(initFP, 100);
        return;
      }

      const input = this.container.querySelector(`#${uid}-input`);
      const trigger = this.container.querySelector(`#${uid}-trigger`);
      const label = this.container.querySelector(`#${uid}-label`);

      let justClosedTime = 0;

      this._fp = flatpickr(input, {
        positionElement: trigger,
        position: 'auto right',
        mode: this.mode,
        dateFormat: this.dateFormat,
        defaultDate: this.defaultDate,
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            longhand: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
          },
          months: {
            shorthand: ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'],
            longhand: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
          },
          rangeSeparator: ' – '
        },
        closeOnSelect: true,
        onOpen: () => {
          window.dispatchEvent(new CustomEvent('app:close-all-popups', { detail: { source: this } }));
        },
        onClose: () => {
          justClosedTime = Date.now();
        },
        onReady: (_, __, fp) => {
          // Style the Flatpickr calendar
          fp.calendarContainer.classList.add('ui-datepicker-calendar');
        },
        onChange: (dates, dateStr) => {
          if (this.mode === 'range' && dates.length === 2) {
            const str = this._fmtRange(dates[0], dates[1]);
            label.textContent = str;
            this._dateStr = str;
            if (this.onChange) this.onChange(dates, dateStr);
            setTimeout(() => this._fp && this._fp.close(), 100);
          } else if (this.mode === 'single' && dates.length === 1) {
            const str = this._fpFmt(dates[0]);
            label.textContent = str;
            this._dateStr = str;
            if (this.onChange) this.onChange(dates, dateStr);
            setTimeout(() => this._fp && this._fp.close(), 100);
          }
        }
      });

      // Toggle calendar on trigger click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this._fp) return;
        const now = Date.now();
        if (this._fp.isOpen) {
          this._fp.close();
        } else if (now - justClosedTime > 250) {
          this._fp.open();
        }
      });

      // Close when another dropdown opens
      this._closeAllHandler = (e) => {
        if (e.detail?.source !== this && this._fp && this._fp.isOpen) {
          this._fp.close();
        }
      };
      window.addEventListener('app:close-all-popups', this._closeAllHandler);
    };

    initFP();
  }

  // Format a date string YYYY-MM-DD → DD/MM/YYYY
  _fmt(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  // Format a Date object → DD/MM/YYYY
  _fpFmt(date) {
    if (!date) return '';
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
  }

  // Format date range compactly: DD/MM – DD/MM/YYYY
  _fmtRange(d1, d2) {
    if (!d1 || !d2) return '';
    const day1 = String(d1.getDate()).padStart(2,'0');
    const m1 = String(d1.getMonth()+1).padStart(2,'0');
    const y1 = d1.getFullYear();
    const day2 = String(d2.getDate()).padStart(2,'0');
    const m2 = String(d2.getMonth()+1).padStart(2,'0');
    const y2 = d2.getFullYear();
    if (y1 === y2) {
      return `${day1}/${m1} – ${day2}/${m2}/${y1}`;
    }
    return `${day1}/${m1}/${y1} – ${day2}/${m2}/${y2}`;
  }

  getDateStr() {
    return this._dateStr;
  }

  destroy() {
    if (this._fp) this._fp.destroy();
    this.container.innerHTML = '';
  }
}
