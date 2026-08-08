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
      this.container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none';
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
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.className = `pointer-events-auto relative flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 transform translate-y-2 opacity-0 text-sm font-medium overflow-hidden ${styles[type] || styles.info}`;

    toast.innerHTML = `
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">${icons[type] || 'ℹ'}</span>
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
