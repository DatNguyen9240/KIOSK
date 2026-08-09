import { smoothScrollTo } from '../utils/smooth-scroll.js';

export class Router {
  constructor(routes = {}, options = {}) {
    this.routes = routes;
    this.beforeEach = options.beforeEach || null;
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

    // Execute Auth Navigation Guard before routing
    if (this.beforeEach) {
      const allowed = this.beforeEach(cleanHash);
      if (allowed === false) return;
    }

    const handler = this.routes[cleanHash] || this.routes['#/dashboard'];

    if (handler) {
      if (this.currentView && typeof this.currentView.destroy === 'function') {
        this.currentView.destroy();
      }

      this.currentView = handler();
      smoothScrollTo(0, 750);
    }
  }
}
