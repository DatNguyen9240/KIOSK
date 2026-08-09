/**
 * Toast Notification System Component (GPU-Accelerated & Mobile Jitter-Free)
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
      this.container.className = 'fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-80 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');

    const styles = {
      success: 'bg-emerald-600 text-white border-emerald-500/80 shadow-lg shadow-emerald-900/20',
      error: 'bg-rose-600 text-white border-rose-500/80 shadow-lg shadow-rose-900/20',
      warning: 'bg-amber-500 text-white border-amber-400/80 shadow-lg shadow-amber-900/20',
      info: 'bg-slate-900 text-white border-slate-700/80 shadow-lg shadow-slate-900/30'
    };

    const icons = {
      success: '<svg class="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      error: '<svg class="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 17.59 13.41 12z"/></svg>',
      warning: '<svg class="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      info: '<svg class="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };

    toast.className = `pointer-events-auto relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border text-xs sm:text-sm font-semibold overflow-hidden backdrop-blur-md transform-gpu opacity-0 -translate-y-3 scale-95 transition-all duration-300 ease-out ${styles[type] || styles.info}`;

    toast.innerHTML = `
      <span class="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">${icons[type] || icons.info}</span>
      <span class="flex-1 text-xs sm:text-sm font-semibold leading-snug truncate">${message}</span>
      <button type="button" class="shrink-0 text-white/70 hover:text-white text-base font-normal ml-1 cursor-pointer leading-none p-1" style="font-size:16px;">&times;</button>
      ${duration > 0 ? `<div class="absolute bottom-0 left-0 h-[2.5px] bg-white/40 rounded-full" style="width:100%;animation:toast-countdown ${duration}ms linear forwards"></div>` : ''}
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', '-translate-y-3', 'scale-95');
        toast.classList.add('opacity-100', 'translate-y-0', 'scale-100');
      });
    });

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  dismiss(toast) {
    if (!toast || toast.dataset.dismissed) return;
    toast.dataset.dismissed = 'true';
    toast.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    toast.classList.add('opacity-0', '-translate-y-2', 'scale-95');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

export const toast = new ToastManager();
