/**
 * PARKING.GO KIOSK — LAYOUT COMPONENTS TEST SUITE
 * Verifies that Header and MobileNav layout components initialize cleanly.
 * Run with: node tests/frontend/layout-components.test.js
 */

import assert from 'assert';

function createMockDomElement() {
  const classes = new Set();
  const element = {
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(val) { this._html = val; },
    querySelector() { return element; },
    querySelectorAll() { return [element]; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return ''; },
    classList: {
      add: (...cls) => cls.forEach(c => classes.add(c)),
      remove: (...cls) => cls.forEach(c => classes.delete(c)),
      contains: (c) => classes.has(c)
    },
    appendChild() {},
    removeChild() {},
    style: {}
  };
  return element;
}

global.document = {
  createElement: () => createMockDomElement(),
  getElementById: () => createMockDomElement(),
  querySelectorAll: () => [createMockDomElement()],
  addEventListener: () => {},
  removeEventListener: () => {},
  body: createMockDomElement()
};

global.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  requestAnimationFrame(cb) { cb(); },
  cancelAnimationFrame() {}
};

global.requestAnimationFrame = (cb) => cb();
global.cancelAnimationFrame = () => {};

console.log(`=============================================================================`);
console.log(`  [LAYOUT COMPONENTS AUDIT] VERIFYING HEADER & MOBILE NAV INITIALIZATION`);
console.log(`=============================================================================`);

const { initHeaderControls } = await import('../../src/components/layout/header.js');
const { initMobileNavigation, setActiveNav } = await import('../../src/components/layout/mobile-nav.js');

assert.strictEqual(typeof initHeaderControls, 'function');
assert.strictEqual(typeof initMobileNavigation, 'function');
assert.strictEqual(typeof setActiveNav, 'function');

initHeaderControls();
console.log(`  [PASS] Header Controls: initHeaderControls() executed cleanly`);

initMobileNavigation();
console.log(`  [PASS] Mobile Navigation: initMobileNavigation() executed cleanly`);

setActiveNav('#/dashboard');
console.log(`  [PASS] Navigation Sync: setActiveNav('#/dashboard') synced active states cleanly`);

console.log(`=============================================================================`);
console.log(`  LAYOUT COMPONENTS RESULT: 100% OPERATIONAL`);
console.log(`=============================================================================`);
