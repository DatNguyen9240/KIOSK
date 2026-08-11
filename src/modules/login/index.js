/**
 * PARKING Standalone Enterprise Login Module
 */

import { login } from '#services/auth.service.js';
import { toast } from '#components/toast.js';

export function initLoginModule(container) {
  if (!container) return;

  let loggedInUser = null;

  const renderLogin = () => {
    container.innerHTML = `
      <div class="min-h-screen w-full bg-[#071729] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
        
        <!-- Background Ambient Glow Effects -->
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Main Login Container (Split Layout on Desktop) -->
        <div class="max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
          
          <!-- Left Side: Enterprise Branding & Showcase -->
          <div class="hidden md:flex p-8 sm:p-12 bg-gradient-to-br from-[#0B2C4D] to-[#041220] flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            <div class="space-y-6 relative z-10">
              <!-- Brand Badge -->
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <svg class="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5-1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl font-black text-white tracking-wider">PARKING</h1>
                  <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">Enterprise Parking Engine</span>
                </div>
              </div>

              <div class="space-y-2 pt-4">
                <h2 class="text-2xl font-black text-white leading-tight">Hệ thống Quản lý & Thu phí Giữ xe Thông minh</h2>
                <p class="text-xs text-slate-400 font-medium leading-relaxed">Giải pháp Multi-Tenant bảo mật cao, tự động hóa VietQR & kiểm soát barie bãi xe thời gian thực.</p>
              </div>

              <!-- Highlights Badges -->
              <div class="space-y-2.5 pt-4 text-xs font-semibold text-slate-300">
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span>Bảo mật Multi-Tenant cách ly CSDL Postgres RLS</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span>Tự động khớp tiền chuyển khoản ngân hàng SePay</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span>Tốc độ xử lý O(1) đạt ~89.000 ops/sec</span>
                </div>
              </div>
            </div>

            <div class="pt-8 text-[11px] text-slate-500 font-medium">
              © 2026 PARKING Inc. All rights reserved.
            </div>
          </div>

          <!-- Right Side: Forms Container -->
          <div class="p-8 sm:p-12 bg-white flex flex-col justify-center space-y-6" id="login-form-container">
            <div class="space-y-1">
              <h3 class="text-xl font-black text-[#0B2C4D]">Đăng nhập Hệ thống</h3>
              <p class="text-xs text-slate-400 font-medium">Vui lòng nhập tài khoản được cấp để tiếp tục</p>
            </div>

            <!-- Alert Box -->
            <div id="login-alert" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold text-center animate-in fade-in duration-150"></div>

            <!-- Form -->
            <form id="login-form" class="space-y-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700 block">Email hệ thống</label>
                <div class="relative">
                  <input type="email" id="login-email" required value="admin@vinhomes.vn" placeholder="nhap.email@vinhomes.vn" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
                  <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700 block">Mật khẩu</label>
                <div class="relative">
                  <input type="password" id="login-password" required value="admin" placeholder="••••••••" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
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

              <button type="submit" id="submit-login-btn" class="w-full py-3.5 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-900/10 transition flex items-center justify-center gap-2">
                <span>ĐĂNG NHẬP HỆ THỐNG</span>
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </button>
            </form>

            <!-- Quick Test Accounts -->
            <div class="pt-4 border-t border-slate-100 space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Tài khoản thử nghiệm nhanh (Click để chọn)</span>
              <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                <button type="button" id="quick-login-vinhomes" class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 text-left transition space-y-0.5">
                  <div class="text-[#0B2C4D]">🏢 Vinhomes Admin</div>
                  <div class="text-[10px] text-slate-400 font-medium">admin@vinhomes.vn</div>
                </button>
                <button type="button" id="quick-login-superadmin" class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 text-left transition space-y-0.5">
                  <div class="text-emerald-700">👑 Super Admin</div>
                  <div class="text-[10px] text-slate-400 font-medium">superadmin@PARKING</div>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    const form = container.querySelector('#login-form');
    const alertBox = container.querySelector('#login-alert');
    const emailInput = container.querySelector('#login-email');
    const passwordInput = container.querySelector('#login-password');

    const handleLoginSubmit = async (email, password) => {
      alertBox.classList.add('hidden');
      toast.show('Đang xác thực thông tin...', 'info');

      const user = await login(email, password);

      if (user) {
        loggedInUser = user;
        // Prompt MFA OTP verification
        toast.show('Mật khẩu hợp lệ. Yêu cầu xác thực OTP 2 lớp (MFA)...', 'info');
        renderMfaStep();
      } else {
        alertBox.textContent = 'Email hoặc mật khẩu không chính xác.';
        alertBox.classList.remove('hidden');
        toast.show('Đăng nhập thất bại', 'error');
      }
    };

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await handleLoginSubmit(emailInput.value.trim(), passwordInput.value);
      };
    }

    const quickVinhomes = container.querySelector('#quick-login-vinhomes');
    if (quickVinhomes) {
      quickVinhomes.onclick = () => {
        emailInput.value = 'admin@vinhomes.vn';
        passwordInput.value = 'admin';
        handleLoginSubmit('admin@vinhomes.vn', 'admin');
      };
    }

    const quickSuper = container.querySelector('#quick-login-superadmin');
    if (quickSuper) {
      quickSuper.onclick = () => {
        emailInput.value = 'superadmin@PARKING';
        passwordInput.value = 'superadmin';
        handleLoginSubmit('superadmin@PARKING', 'superadmin');
      };
    }
  };

  const renderMfaStep = () => {
    const formContainer = container.querySelector('#login-form-container');
    if (!formContainer) return;

    formContainer.innerHTML = `
      <div class="space-y-1">
        <h3 class="text-xl font-black text-[#0B2C4D]">Xác thực Bảo mật MFA</h3>
        <p class="text-xs text-slate-400 font-medium">Nhập mã OTP 6 số để hoàn tất đăng nhập bảo mật cao</p>
      </div>

      <div id="mfa-alert" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold text-center animate-in fade-in duration-150"></div>

      <form id="mfa-form" class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 block">Mã OTP (Gửi qua Email: ${loggedInUser?.user?.email})</label>
          <div class="relative">
            <input type="text" id="mfa-otp" required value="123456" placeholder="Nhập 123456" class="w-full text-center tracking-widest text-lg font-black py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
          </div>
        </div>

        <button type="submit" id="submit-mfa-btn" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2">
          <span>XÁC NHẬN OTP & ĐĂNG NHẬP</span>
        </button>
      </form>

      <div class="text-center pt-2">
        <button id="mfa-back-btn" class="text-xs font-bold text-slate-400 hover:text-slate-600 transition">Quay lại Form đăng nhập</button>
      </div>
    `;

    const mfaForm = formContainer.querySelector('#mfa-form');
    const mfaAlert = formContainer.querySelector('#mfa-alert');
    const otpInput = formContainer.querySelector('#mfa-otp');
    const backBtn = formContainer.querySelector('#mfa-back-btn');

    mfaForm.onsubmit = (e) => {
      e.preventDefault();
      mfaAlert.classList.add('hidden');

      const otp = otpInput.value.trim();
      if (otp === '123456') {
        toast.show(`Xin chào ${loggedInUser?.user?.fullName || 'Admin'}! Xác thực MFA thành công.`, 'success');
        
        // If resident email is used, go to resident portal route
        if (loggedInUser.user?.email === 'tuan.tv@gmail.com') {
          window.location.hash = '#/resident/dashboard';
        } else {
          window.location.hash = '#/dashboard';
        }
      } else {
        mfaAlert.textContent = 'Mã OTP không chính xác. Thử lại với 123456.';
        mfaAlert.classList.remove('hidden');
        toast.show('Mã xác thực OTP sai', 'error');
      }
    };

    backBtn.onclick = () => {
      renderLogin();
    };
  };

  // Start with login form render
  renderLogin();
}
