/**
 * Reusable Accessible Modal Component
 */

export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.onClose = options.onClose || null;
    this.element = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200';

    this.element.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 transform transition-transform duration-200 scale-95">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800">${this.title}</h3>
          <button type="button" class="close-btn text-slate-400 hover:text-slate-600 text-2xl font-bold p-1">&times;</button>
        </div>
        <div class="p-6 modal-body text-slate-600">
          ${typeof this.content === 'string' ? this.content : ''}
        </div>
      </div>
    `;

    if (typeof this.content !== 'string' && this.content instanceof HTMLElement) {
      this.element.querySelector('.modal-body').appendChild(this.content);
    }

    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn.onclick = () => this.close();

    this.element.onclick = (e) => {
      if (e.target === this.element) this.close();
    };

    document.body.appendChild(this.element);

    requestAnimationFrame(() => {
      this.element.querySelector('.scale-95').classList.replace('scale-95', 'scale-100');
    });
  }

  close() {
    if (!this.element) return;
    const dialog = this.element.querySelector('.scale-100');
    if (dialog) dialog.classList.replace('scale-100', 'scale-95');
    this.element.classList.add('opacity-0');

    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      if (typeof this.onClose === 'function') this.onClose();
    }, 200);
  }
}
