/**
 * PARKING.GO Main Application Entry (Modular Architecture)
 */

import { Router } from '#core/router.js';
import { initHeaderControls } from '#components/layout/header.js';
import { initMobileNavigation, setActiveNav } from '#components/layout/mobile-nav.js';
import { initDashboardModule } from '#modules/dashboard/index.js';
import { initVehicleSearchModule } from '#modules/vehicle-search/index.js';
import { initRevenueModule } from '#modules/revenue/index.js';
import { initTransactionsModule } from '#modules/transactions/index.js';
import { initDebtReportModule } from '#modules/debt-report/index.js';
import { initCardsModule } from '#modules/cards/index.js';
import { initResidentsModule } from '#modules/residents/index.js';
import { initVehicleAccessModule } from '#modules/vehicle-access/index.js';
import { initReportsModule } from '#modules/reports/index.js';
import { initKioskTouchModule } from '#modules/kiosk/index.js';
import { initMobileGateModule } from '#modules/mobile-gate/index.js';
import { initSettingsModule } from '#modules/settings/index.js';
import { initLoginModule } from '#modules/login/index.js';
import { isAuthenticated, logout } from '#services/auth.service.js';
import { toast } from '#components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Layout Controls (Header & Mobile Navigation)
  initHeaderControls();
  initMobileNavigation();

  function switchShell(targetHash) {
    if (typeof document === 'undefined') return document.getElementById('main-app-content');
    const authShell = document.getElementById('auth-shell');
    const appShell = document.getElementById('app-shell');
    const mainContent = document.getElementById('main-app-content');

    if (targetHash === '#/login') {
      if (appShell) appShell.classList.add('hidden');
      if (authShell) authShell.classList.remove('hidden');
      return authShell || mainContent;
    } else {
      if (authShell) authShell.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');
      return mainContent;
    }
  }

  // Setup Client-Side Router with Strict Auth Navigation Guard
  const router = new Router({
    '#/login': () => {
      setActiveNav('#/login');
      initLoginModule(switchShell('#/login'));
    },
    '#/dashboard': () => {
      setActiveNav('#/dashboard');
      initDashboardModule(switchShell('#/dashboard'));
    },
    '#/search': () => {
      setActiveNav('#/search');
      initVehicleSearchModule(switchShell('#/search'));
    },
    '#/revenue': () => {
      setActiveNav('#/revenue');
      initRevenueModule(switchShell('#/revenue'));
    },
    '#/transactions': () => {
      setActiveNav('#/transactions');
      initTransactionsModule(switchShell('#/transactions'));
    },
    '#/debt': () => {
      setActiveNav('#/debt');
      initDebtReportModule(switchShell('#/debt'));
    },
    '#/cards': () => {
      setActiveNav('#/cards');
      initCardsModule(switchShell('#/cards'));
    },
    '#/residents': () => {
      setActiveNav('#/residents');
      initResidentsModule(switchShell('#/residents'));
    },
    '#/vehicle-access': () => {
      setActiveNav('#/vehicle-access');
      initVehicleAccessModule(switchShell('#/vehicle-access'));
    },
    '#/reports': () => {
      setActiveNav('#/reports');
      initReportsModule(switchShell('#/reports'));
    },
    '#/kiosk': () => {
      setActiveNav('#/kiosk');
      initKioskTouchModule(switchShell('#/kiosk'));
    },
    '#/mobile': () => {
      setActiveNav('#/mobile');
      initMobileGateModule(switchShell('#/mobile'));
    },
    '#/settings': () => {
      setActiveNav('#/settings');
      initSettingsModule(switchShell('#/settings'));
    }
  }, {
    beforeEach: (targetHash) => {
      const publicRoutes = ['#/login', '#/kiosk', '#/mobile'];
      switchShell(targetHash);

      if (!publicRoutes.includes(targetHash) && !isAuthenticated()) {
        toast.show('Vui lòng đăng nhập để truy cập hệ thống', 'warning');
        window.location.hash = '#/login';
        return false;
      }
      return true;
    }
  });

  // Initial Auth Check on App Boot
  const currentHash = window.location.hash || '#/dashboard';
  const publicRoutes = ['#/login', '#/kiosk', '#/mobile'];
  if (!publicRoutes.includes(currentHash) && !isAuthenticated()) {
    window.location.hash = '#/login';
  }

  // Shell action listeners
  const sidebarPayBtn = document.getElementById('sidebar-pay-btn');
  if (sidebarPayBtn) {
    sidebarPayBtn.onclick = () => {
      toast.show('Đang mở cổng thanh toán cho thẻ 30F-122.45...', 'info');
    };
  }

  const topExcelBtn = document.getElementById('excel-export-top');
  if (topExcelBtn) {
    topExcelBtn.onclick = () => {
      toast.show('Đã xuất file báo cáo công nợ Excel thành công!', 'success');
    };
  }
});
