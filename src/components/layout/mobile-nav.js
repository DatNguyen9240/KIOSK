/**
 * Mobile Navigation & Sidebar Sync Component
 */

let closeMoreSheetFn = null;

export function closeMoreSheet() {
  if (closeMoreSheetFn) {
    closeMoreSheetFn();
  }
}

export function setActiveNav(hash) {
  closeMoreSheet();
  const currentHash = hash || '#/dashboard';
  
  // Desktop Nav Items
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentHash) {
      item.className = 'nav-item active flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0B2C4D] text-white font-bold text-xs shadow-md shadow-[#0B2C4D]/20 transition duration-150';
    } else {
      item.className = 'nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition duration-150';
    }
  });

  // Mobile BottomTab Items
  document.querySelectorAll('#mobile-bottom-tab .btab-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentHash) {
      item.className = 'btab-item flex flex-col items-center gap-0.5 text-[#0B2C4D] font-black text-[10px] transition cursor-pointer';
    } else if (href) {
      item.className = 'btab-item flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700 font-semibold text-[10px] transition cursor-pointer';
    }
  });

  // More Sheet Items
  document.querySelectorAll('#mobile-more-sheet .more-nav-item').forEach(item => {
    item.onclick = () => closeMoreSheet();
  });
}

export function initMobileNavigation() {
  const mobileBottomTab = document.getElementById('mobile-bottom-tab');
  const moreMenuBtn = document.getElementById('more-menu-btn');
  const mobileMoreSheet = document.getElementById('mobile-more-sheet');
  const moreSheetBackdrop = document.getElementById('more-sheet-backdrop');
  const closeMoreSheetBtn = document.getElementById('close-more-sheet-btn');

  closeMoreSheetFn = () => {
    if (mobileMoreSheet) {
      mobileMoreSheet.classList.remove('scale-100', 'opacity-100');
      mobileMoreSheet.classList.add('scale-95', 'opacity-0');
      setTimeout(() => mobileMoreSheet.classList.add('hidden'), 200);
    }
    if (moreSheetBackdrop) moreSheetBackdrop.classList.add('hidden');
  };

  const openMoreSheet = () => {
    window.dispatchEvent(new CustomEvent('app:close-all-popups', { detail: { source: 'more-sheet' } }));
    if (mobileMoreSheet) {
      mobileMoreSheet.classList.remove('hidden');
      requestAnimationFrame(() => {
        mobileMoreSheet.classList.remove('scale-95', 'opacity-0');
        mobileMoreSheet.classList.add('scale-100', 'opacity-100');
      });
    }
    if (moreSheetBackdrop) moreSheetBackdrop.classList.remove('hidden');
  };

  if (moreMenuBtn) {
    moreMenuBtn.onclick = (e) => {
      e.stopPropagation();
      const isHidden = mobileMoreSheet?.classList.contains('hidden');
      if (isHidden) openMoreSheet(); else closeMoreSheetFn();
    };
  }

  if (closeMoreSheetBtn) closeMoreSheetBtn.onclick = closeMoreSheetFn;
  if (moreSheetBackdrop) moreSheetBackdrop.onclick = closeMoreSheetFn;

  // Auto-hide Mobile BottomTab on input/select focus
  document.addEventListener('focusin', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (mobileBottomTab) mobileBottomTab.classList.add('translate-y-full');
      closeMoreSheetFn();
    }
  });

  document.addEventListener('focusout', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (mobileBottomTab) mobileBottomTab.classList.remove('translate-y-full');
    }
  });

  // Listen for popup opens to close More Sheet
  window.addEventListener('app:close-all-popups', (e) => {
    if (e.detail?.source !== 'more-sheet') {
      closeMoreSheetFn();
    }
  });
}
