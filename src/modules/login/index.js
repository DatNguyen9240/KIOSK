/**
 * PARKING.GO Enterprise Login Module
 */

import { login } from '#services/auth.service.js';
import { toast } from '#components/toast.js';

export function initLoginModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="min-h-[80vh] flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        
        <!-- Header & Logo -->
        <div class="text-center space-y-2">
          <div class="w-16 h-16 bg-[#0B2C4D] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-slate-900/10">
            <svg class="w-9 h-9 text-emerald-400 fill-current" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black text-[#0B2C4D] tracking-tight">PARKING.GO</h1>
          <p class="text-xs text-slate-400 font-semibold">Cổng đăng nhập Quản trị viên & Kiểm soát bãi xe</p>
        </div>

        <!-- Alert Container -->
        <div id="login-alert" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold text-center"></div>

        <!-- Login Form -->
        <form id="login-form" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Email hệ thống</label>
            <div class="relative">
              <input type="email" id="login-email" required value="admin@vinhomes.vn" placeholder="nhap.email@vinhomes.vn" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Mật khẩu</label>
            <div class="relative">
              <input type="password" id="login-password" required value="admin" placeholder="••••••••" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 fill-current" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
              <input type="checkbox" checked class="rounded text-[#0B2C4D] focus:ring-0" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" id="forgot-pass-link" class="font-bold text-blue-600 hover:underline">Quên mật khẩu?</a>
          </div>

          <button type="submit" id="submit-login-btn" class="w-full py-3 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-900/10 transition flex items-center justify-center gap-2">
            <span>ĐĂNG NHẬP HỆ THỐNG</span>
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
        </form>

        <!-- Demo Quick Logins -->
        <div class="pt-4 border-t border-slate-100 space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Tài khoản thử nghiệm nhanh (Click để chọn)</span>
          <div class="grid grid-cols-2 gap-2 text-xs font-bold">
            <button type="button" id="quick-login-vinhomes" class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 text-left transition space-y-0.5">
              <div class="text-[#0B2C4D]">🏢 Vinhomes Admin</div>
              <div class="text-[10px] text-slate-400 font-medium">admin@vinhomes.vn</div>
            </button>
            <button type="button" id="quick-login-superadmin" class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 text-left transition space-y-0.5">
              <div class="text-emerald-700">👑 Super Admin</div>
              <div class="text-[10px] text-slate-400 font-medium">superadmin@parking.go</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const alertBox = container.querySelector('#login-alert');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');

  const handleLogin = async (email, password) => {
    alertBox.classList.add('hidden');
    toast.show('Đang xác thực tài khoản...', 'info');

    const user = await login(email, password);

    if (user) {
      toast.show(`Xin chào ${user.user?.fullName || 'Admin'}! Đăng nhập thành công.`, 'success');
      window.location.hash = '#/dashboard';
    } else {
      alertBox.textContent = 'Email hoặc mật khẩu không chính xác.';
      alertBox.classList.remove('hidden');
      toast.show('Đăng nhập thất bại', 'error');
    }
  };

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      await handleLogin(emailInput.value.trim(), passwordInput.value);
    };
  }

  const quickVinhomes = container.querySelector('#quick-login-vinhomes');
  if (quickVinhomes) {
    quickVinhomes.onclick = () => {
      emailInput.value = 'admin@vinhomes.vn';
      passwordInput.value = 'admin';
      handleLogin('admin@vinhomes.vn', 'admin');
    };
  }

  const quickSuper = container.querySelector('#quick-login-superadmin');
  if (quickSuper) {
    quickSuper.onclick = () => {
      emailInput.value = 'superadmin@parking.go';
      passwordInput.value = 'superadmin';
      handleLogin('superadmin@parking.go', 'superadmin');
    };
  }
}
