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
  const mainContentContainer = document.getElementById('main-app-content');

  // Initialize Layout Controls (Header & Mobile Navigation)
  initHeaderControls();
  initMobileNavigation();

  function toggleAppShellLayout(isStandalone = false) {
    const sidebar = document.getElementById('main-sidebar');
    const header = document.getElementById('main-header');
    const mainContent = document.getElementById('main-app-content');

    if (isStandalone) {
      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = 'none';
      if (mainContent) {
        mainContent.className = 'w-full min-h-screen p-0 m-0 bg-[#071729]';
      }
    } else {
      if (sidebar) sidebar.style.display = '';
      if (header) header.style.display = '';
      if (mainContent) {
        mainContent.className = 'flex-1 p-3 sm:p-6 space-y-6';
      }
    }
  }

  // Setup Client-Side Router with Strict Auth Navigation Guard
  const router = new Router({
    '#/login': () => {
      setActiveNav('#/login');
      initLoginModule(mainContentContainer);
    },
    '#/dashboard': () => {
      setActiveNav('#/dashboard');
      initDashboardModule(mainContentContainer);
    },
    '#/search': () => {
      setActiveNav('#/search');
      initVehicleSearchModule(mainContentContainer);
    },
    '#/revenue': () => {
      setActiveNav('#/revenue');
      initRevenueModule(mainContentContainer);
    },
    '#/transactions': () => {
      setActiveNav('#/transactions');
      initTransactionsModule(mainContentContainer);
    },
    '#/debt': () => {
      setActiveNav('#/debt');
      initDebtReportModule(mainContentContainer);
    },
    '#/cards': () => {
      setActiveNav('#/cards');
      initCardsModule(mainContentContainer);
    },
    '#/residents': () => {
      setActiveNav('#/residents');
      initResidentsModule(mainContentContainer);
    },
    '#/vehicle-access': () => {
      setActiveNav('#/vehicle-access');
      initVehicleAccessModule(mainContentContainer);
    },
    '#/reports': () => {
      setActiveNav('#/reports');
      initReportsModule(mainContentContainer);
    },
    '#/kiosk': () => {
      setActiveNav('#/kiosk');
      initKioskTouchModule(mainContentContainer);
    },
    '#/mobile': () => {
      setActiveNav('#/mobile');
      initMobileGateModule(mainContentContainer);
    },
    '#/settings': () => {
      setActiveNav('#/settings');
      initSettingsModule(mainContentContainer);
    }
  }, {
    beforeEach: (targetHash) => {
      const publicRoutes = ['#/login', '#/kiosk', '#/mobile'];
      const isStandalone = targetHash === '#/login';
      toggleAppShellLayout(isStandalone);

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
