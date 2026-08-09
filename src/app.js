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
import { ensureAuthenticated } from '#services/auth.service.js';
import { toast } from '#components/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  const mainContentContainer = document.getElementById('main-app-content');

  // Automatically initialize JWT auth session
  await ensureAuthenticated();

  // Initialize Layout Controls (Header & Mobile Navigation)
  initHeaderControls();
  initMobileNavigation();

  // Setup Client-Side Router
  new Router({
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
  });

  // Render initial dashboard view
  initDashboardModule(mainContentContainer);

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
