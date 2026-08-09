/**
 * Toast Notification System Component (GPU-Accelerated & Mobile Jitter-Free)
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;
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
    if (typeof document === 'undefined') {
      console.log(`[Toast ${type.toUpperCase()}] ${message}`);
      return;
    }
    const toast = document.createElement('div');

    const styles = {
      success: 'bg-emerald-600 text-white border-emerald-500/80 shadow-lg shadow-emerald-900/20',
      error: 'bg-rose-600 text-white border-rose-500/80 shadow-lg shadow-rose-900/20',
      warning: 'bg-amber-500 text-white border-amber-400/80 shadow-lg shadow-amber-900/20',
      info: 'bg-slate-900 text-white border-slate-700/80 shadow-lg shadow-slate-900/30'
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.className = `transform translate-y-[-10px] opacity-0 transition-all duration-300 pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold ${styles[type] || styles.info}`;

    toast.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 pr-2">
        <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">${icons[type] || 'ℹ'}</span>
        <span class="truncate">${message}</span>
      </div>
      <button type="button" class="text-white/60 hover:text-white shrink-0 text-sm font-bold px-1">✕</button>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-[-10px]', 'opacity-0');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    if (closeBtn) closeBtn.onclick = dismiss;

    if (this.container) {
      this.container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-10px]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      setTimeout(dismiss, duration);
    }
  }
}

export const toast = new ToastManager();
