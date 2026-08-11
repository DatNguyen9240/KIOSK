import { Router } from '#core/router.js';
import { initHeaderControls } from '#components/layout/header.js';
import { initMobileNavigation, setActiveNav } from '#components/layout/mobile-nav.js';
import { initDashboardModule } from '#modules/dashboard/index.js';
import { initVehicleManagementModule } from '#modules/vehicle-management/index.js';
import { initRevenueModule } from '#modules/revenue/index.js';
import { initTransactionsModule } from '#modules/transactions/index.js';
import { initDebtManagementModule } from '#modules/debt-management/index.js';
import { initCardsModule } from '#modules/cards/index.js';
import { initResidentsModule } from '#modules/residents/index.js';
import { initVehicleAccessModule } from '#modules/vehicle-access/index.js';
import { initReportCenterModule } from '#modules/report-center/index.js';
import { initKioskTouchModule } from '#modules/kiosk/index.js';
import { initMobileGateModule } from '#modules/mobile-gate/index.js';
import { initSettingsModule } from '#modules/settings/index.js';
import { initLoginModule } from '#modules/login/index.js';
import { initTenantManagementModule } from '#modules/tenant-management/index.js';
import { initRbacManagementModule } from '#modules/rbac-management/index.js';
import { initParkingInfrastructureModule } from '#modules/parking-infrastructure/index.js';
import { initVoucherManagementModule } from '#modules/voucher-management/index.js';
import { initNotificationManagementModule } from '#modules/notification-management/index.js';
import { initAuditManagementModule } from '#modules/audit-management/index.js';
import { initResidentPortalModule } from '#modules/resident-portal/index.js';
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
    const residentShell = document.getElementById('resident-shell');
    const mainContent = document.getElementById('main-app-content');
    const mobileBottomTab = document.getElementById('mobile-bottom-tab-wrap');

    const isStandalone = ['#/login', '#/kiosk', '#/mobile'].includes(targetHash);
    const isResident = targetHash.startsWith('#/resident/');

    if (isStandalone) {
      if (appShell) appShell.classList.add('hidden');
      if (residentShell) residentShell.classList.add('hidden');
      if (mobileBottomTab) mobileBottomTab.classList.add('hidden');
      if (authShell) authShell.classList.remove('hidden');
      return authShell || mainContent;
    } else if (isResident) {
      if (appShell) appShell.classList.add('hidden');
      if (authShell) authShell.classList.add('hidden');
      if (mobileBottomTab) mobileBottomTab.classList.add('hidden');
      if (residentShell) residentShell.classList.remove('hidden');
      return residentShell || mainContent;
    } else {
      if (authShell) authShell.classList.add('hidden');
      if (residentShell) residentShell.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');
      if (mobileBottomTab) mobileBottomTab.classList.remove('hidden');
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
      initVehicleManagementModule(switchShell('#/search'));
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
      initDebtManagementModule(switchShell('#/debt'));
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
      initReportCenterModule(switchShell('#/reports'));
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
    },
    '#/tenants': () => {
      setActiveNav('#/tenants');
      initTenantManagementModule(switchShell('#/tenants'));
    },
    '#/rbac': () => {
      setActiveNav('#/rbac');
      initRbacManagementModule(switchShell('#/rbac'));
    },
    '#/infrastructure': () => {
      setActiveNav('#/infrastructure');
      initParkingInfrastructureModule(switchShell('#/infrastructure'));
    },
    '#/vouchers': () => {
      setActiveNav('#/vouchers');
      initVoucherManagementModule(switchShell('#/vouchers'));
    },
    '#/notifications': () => {
      setActiveNav('#/notifications');
      initNotificationManagementModule(switchShell('#/notifications'));
    },
    '#/audit': () => {
      setActiveNav('#/audit');
      initAuditManagementModule(switchShell('#/audit'));
    },
    '#/resident/dashboard': () => {
      initResidentPortalModule(switchShell('#/resident/dashboard'));
    }
  }, {
    beforeEach: (targetHash) => {
      const publicRoutes = ['#/login', '#/kiosk', '#/mobile', '#/resident/dashboard'];
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
  const publicRoutes = ['#/login', '#/kiosk', '#/mobile', '#/resident/dashboard'];
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
