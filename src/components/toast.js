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

    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 transform translate-y-2 opacity-0 text-sm font-medium ${styles[type] || styles.info}`;

    toast.innerHTML = `
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">${icons[type] || 'ℹ'}</span>
      <span class="flex-1">${message}</span>
      <button type="button" class="text-white/70 hover:text-white text-lg font-bold px-1 ml-2">&times;</button>
    `;

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
