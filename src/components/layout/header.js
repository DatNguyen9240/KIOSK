import { TenantSelectorComponent } from '#components/tenant-selector.js';
import { UIDatepicker } from '#components/ui-datepicker.js';
import { UISelect } from '#components/ui-select.js';
import { toast } from '#components/toast.js';
import { logout, getCurrentUser } from '#services/auth.service.js';

export function initHeaderControls() {
  // Update Profile Card & Popover Info from current logged in user
  if (typeof document !== 'undefined') {
    const userSession = getCurrentUser();
    const user = userSession?.user || userSession || {};
    
    const fullName = user.fullName || user.full_name || 'Nguyễn Văn A';
    const email = user.email || 'admin@thap1.vn';
    const isSuper = !!user.isSuperAdmin || !!user.is_super_admin;
    const roleMap = {
      'SUPER_ADMIN': '👑 Super Admin',
      'TENANT_ADMIN': 'Quản lý Khu đô thị',
      'OPERATOR': 'Nhân viên Vận hành',
      'VIEWER': 'Người xem'
    };
    const rawRole = user.role || 'TENANT_ADMIN';
    const roleText = isSuper ? '👑 Super Admin' : (roleMap[rawRole] || rawRole);
    const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NV';

    const avatarInitials = document.getElementById('user-avatar-initials');
    const displayName = document.getElementById('user-display-name');
    const displayRole = document.getElementById('user-display-role');
    const popoverName = document.getElementById('popover-user-name');
    const popoverEmail = document.getElementById('popover-user-email');

    if (avatarInitials) avatarInitials.textContent = initials;
    if (displayName) displayName.textContent = fullName;
    if (displayRole) displayRole.textContent = roleText;
    if (popoverName) popoverName.textContent = fullName;
    if (popoverEmail) popoverEmail.textContent = email;

    // Profile Dropdown Popover Interactivity
    const profileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('user-profile-dropdown');
    const profileActionBtn = document.getElementById('profile-menu-profile');
    const settingsActionBtn = document.getElementById('profile-menu-settings');
    const logoutActionBtn = document.getElementById('profile-menu-logout');

    if (profileBtn && profileDropdown) {
      profileBtn.onclick = (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
      };

      document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
          profileDropdown.classList.add('hidden');
        }
      });

      if (profileActionBtn) {
        profileActionBtn.onclick = () => {
          profileDropdown.classList.add('hidden');
          toast.show(`Tài khoản: ${fullName} (${email}) • Vai trò: ${roleText}`, 'info');
        };
      }

      if (settingsActionBtn) {
        settingsActionBtn.onclick = () => {
          profileDropdown.classList.add('hidden');
          window.location.hash = '#/settings';
        };
      }

      if (logoutActionBtn) {
        logoutActionBtn.onclick = () => {
          profileDropdown.classList.add('hidden');
          logout();
          toast.show('Đã đăng xuất khỏi hệ thống', 'info');
        };
      }
    }
  }
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
