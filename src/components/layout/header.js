/**
 * Header Controls Component (Tenant Selector, Datepicker, Tower Selector, Notification Dropdown)
 */

import { TenantSelectorComponent } from '#components/tenant-selector.js';
import { UIDatepicker } from '#components/ui-datepicker.js';
import { UISelect } from '#components/ui-select.js';
import { toast } from '#components/toast.js';

export function initHeaderControls() {
  // Multi-Tenant Context Header Initialization
  const tenantSelectorContainer = document.getElementById('header-tenant-selector');
  if (tenantSelectorContainer) {
    new TenantSelectorComponent(tenantSelectorContainer);
  }

  // Header Datepicker initialization
  const headerDateContainer = document.getElementById('header-date-picker');
  if (headerDateContainer) {
    new UIDatepicker({
      container: headerDateContainer,
      mode: 'range',
      defaultDate: ['2024-05-01', '2024-05-08'],
      onChange: (dates, str) => {
        toast.show(`Lọc dữ liệu từ ${str}`, 'info');
      }
    });
  }

  // Header Tower Select initialization
  const headerTowerContainer = document.getElementById('header-tower-select');
  if (headerTowerContainer) {
    new UISelect({
      container: headerTowerContainer,
      options: [
        { value: 'ALL', label: 'Tất cả tháp' },
        { value: 'A1', label: 'Tháp A1' },
        { value: 'A2', label: 'Tháp A2' },
        { value: 'A3', label: 'Tháp A3' }
      ],
      value: 'ALL',
      onChange: (val, label) => {
        toast.show(`Đã chọn: ${label}`, 'info');
      }
    });
  }

  // Notification Bell Handler
  const notifBtn = document.getElementById('header-notif-btn');
  const notifDropdown = document.getElementById('header-notif-dropdown');
  const notifBadge = document.getElementById('header-notif-badge');
  const notifCountPill = document.getElementById('notif-count-pill');
  const markReadBtn = document.getElementById('mark-read-btn');

  if (notifBtn && notifDropdown) {
    const closeNotif = () => {
      notifDropdown.classList.remove('dropdown-pop-in');
      notifDropdown.classList.add('dropdown-pop-out');
      setTimeout(() => {
        notifDropdown.classList.add('hidden');
      }, 190);
      window.removeEventListener('scroll', closeNotif);
      document.removeEventListener('click', onClickOutside);
    };

    const onClickOutside = (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        closeNotif();
      }
    };

    const openNotif = () => {
      window.dispatchEvent(new CustomEvent('app:close-all-popups', { detail: { source: 'notif' } }));
      notifDropdown.classList.remove('hidden', 'dropdown-pop-out');
      notifDropdown.classList.add('dropdown-pop-in');
      window.addEventListener('scroll', closeNotif, { passive: true });
      document.addEventListener('click', onClickOutside);
    };

    window.addEventListener('app:close-all-popups', (e) => {
      if (e.detail?.source !== 'notif' && !notifDropdown.classList.contains('hidden')) {
        closeNotif();
      }
    });

    notifBtn.onclick = (e) => {
      e.stopPropagation();
      const isHidden = notifDropdown.classList.contains('hidden');
      if (isHidden) {
        openNotif();
      } else {
        closeNotif();
      }
    };

    if (markReadBtn) {
      markReadBtn.onclick = () => {
        if (notifBadge) notifBadge.classList.add('hidden');
        if (notifCountPill) {
          notifCountPill.textContent = '0 mới';
          notifCountPill.className = 'px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full';
        }
        toast.show('Đã đánh dấu đọc tất cả thông báo', 'success');
      };
    }
  }
}
