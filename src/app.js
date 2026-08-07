/**
 * PARKING.GO Main Application Entry
 */

import { Router } from './core/router.js';
import { initVehicleSearchModule } from './modules/vehicle-search/index.js';
import { initMonthlyRenewalModule } from './modules/monthly-renewal/index.js';
import { initDebtReportModule } from './modules/debt-report/index.js';
import { initKioskTouchModule } from './modules/kiosk/index.js';
import { initMobileGateModule } from './modules/mobile-gate/index.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainContentContainer = document.getElementById('main-app-content');

  const router = new Router({
    '#/dashboard': () => {
      setActiveNav('#/dashboard');
      initMonthlyRenewalModule(mainContentContainer);
    },
    '#/search': () => {
      setActiveNav('#/search');
      initVehicleSearchModule(mainContentContainer);
    },
    '#/debt': () => {
      setActiveNav('#/debt');
      initDebtReportModule(mainContentContainer);
    },
    '#/kiosk': () => {
      setActiveNav('#/kiosk');
      initKioskTouchModule(mainContentContainer);
    },
    '#/mobile': () => {
      setActiveNav('#/mobile');
      initMobileGateModule(mainContentContainer);
    }
  });

  function setActiveNav(hash) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.className = 'nav-link flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/10 transition';
      } else {
        link.className = 'nav-link flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition';
      }
    });
  }
});
