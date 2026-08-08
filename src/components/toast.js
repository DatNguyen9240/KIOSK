/**
 * Toast Notification System Component
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-50 flex flex-col gap-2.5 max-w-[calc(100vw-32px)] sm:max-w-sm w-full pointer-events-none';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');

    const styles = {
      success: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20',
      error: 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20',
      warning: 'bg-amber-500 text-white border-amber-400 shadow-amber-900/20',
      info: 'bg-slate-900 text-white border-slate-700 shadow-slate-900/30'
    };

    const icons = {
      success: '<svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      error: '<svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 17.59 13.41 12z"/></svg>',
      warning: '<svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      info: '<svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };

    toast.className = `pointer-events-auto relative flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 transform translate-y-2 opacity-0 text-sm font-medium overflow-hidden ${styles[type] || styles.info}`;

    toast.innerHTML = `
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">${icons[type] || icons.info}</span>
      <span class="flex-1 text-sm">${message}</span>
      <button type="button" class="self-center flex-shrink-0 text-white/60 hover:text-white text-base font-normal ml-1 transition" style="font-size:18px;line-height:1;padding:0;background:none;border:none;cursor:pointer;display:flex;align-items:center;position:relative;top:-1px;">&times;</button>
      ${duration > 0 ? `<div class="absolute bottom-0 left-0 h-[3px] bg-white/30 rounded-full" style="width:100%;animation:toast-countdown ${duration}ms linear forwards"></div>` : ''}
    `;

    if (!document.getElementById('toast-countdown-style')) {
      const style = document.createElement('style');
      style.id = 'toast-countdown-style';
      style.textContent = `@keyframes toast-countdown { from { width: 100% } to { width: 0% } }`;
      document.head.appendChild(style);
    }

    const closeBtn = toast.querySelector('button');
    closeBtn.onclick = () => this.dismiss(toast);

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  dismiss(toast) {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

export const toast = new ToastManager();
