/**
 * Lightweight Hash & View Router
 */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentView = null;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  addRoute(hash, handler) {
    this.routes[hash] = handler;
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  handleRoute() {
    const rawHash = window.location.hash || '#/dashboard';
    const cleanHash = rawHash.split('?')[0];

    const handler = this.routes[cleanHash] || this.routes['#/dashboard'];

    if (handler) {
      if (this.currentView && typeof this.currentView.destroy === 'function') {
        this.currentView.destroy();
      }

      this.currentView = handler();
    }
  }
}
