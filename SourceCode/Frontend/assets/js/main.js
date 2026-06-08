/**
 * main.js — Header logic + Auth (kết nối Backend API)
 */

let isLoginMode = true;
let isPasswordVisible = false;

/* ─────── Public helpers ─────── */
window.isLoggedIn = function () {
  return Session ? Session.isLoggedIn() : !!localStorage.getItem('authToken');
};

window.openAuthModal = function () {
  const m = document.getElementById('authModal');
  if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};

window.closeAuthModal = function () {
  const m = document.getElementById('authModal');
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
};

window.handleLogout = function () {
  Session.clear();
  window.location.href = 'index.html';
};

/* ─────── Header loader ─────── */
async function loadHeader() {
  try {
    const res  = await fetch('components/header.html');
    const html = await res.text();
    document.getElementById('header-placeholder').innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    checkAuthStatus();
    initHeaderEvents();
    updateHeaderCartCount();
  } catch (err) {
    console.error('loadHeader error:', err);
  }
}

/* ─────── Cart badge ─────── */
async function updateHeaderCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;

  if (!isLoggedIn()) {
    badge.classList.add('hidden');
    return;
  }

  try {
    const data = await CartAPI.get();
    const total = (data.data || []).reduce((s, i) => s + i.SoLuong, 0);
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);
  } catch {
    badge.classList.add('hidden');
  }
}
window.updateHeaderCartCount = updateHeaderCartCount;

/* ─────── Auth status ─────── */
function checkAuthStatus() {
  const user        = Session.getUser();
  const loggedOut   = document.getElementById('loggedOutState');
  const loggedIn    = document.getElementById('loggedInState');
  const headerName  = document.getElementById('headerUserName');
  const dropName    = document.getElementById('dropdownUserName');
  const dropEmail   = document.getElementById('dropdownUserEmail');
  const adminBadge  = document.getElementById('adminBadge');
  const userOrdersBtn     = document.getElementById('userOrdersBtn');
  const adminProductsBtn  = document.getElementById('adminProductsBtn');
  const adminOrdersBtn    = document.getElementById('adminOrdersBtn');
  const adminUsersBtn     = document.getElementById('adminUsersBtn');
  const cartBtn           = document.getElementById('cartBtn');

  if (user && isLoggedIn()) {
    loggedOut?.classList.add('hidden');
    loggedIn?.classList.remove('hidden');
    loggedIn?.classList.add('flex');

    if (headerName)  headerName.textContent  = user.name;
    if (dropName)    dropName.textContent    = user.name;
    if (dropEmail)   dropEmail.textContent   = user.email;

    if (user.isAdmin) {
      adminBadge?.classList.remove('hidden');
      userOrdersBtn?.classList.add('hidden');
      adminProductsBtn?.classList.remove('hidden');
      adminProductsBtn?.classList.add('flex');
      adminOrdersBtn?.classList.remove('hidden');
      adminOrdersBtn?.classList.add('flex');
      adminUsersBtn?.classList.remove('hidden');
      adminUsersBtn?.classList.add('flex');
      cartBtn?.classList.add('hidden');
    } else {
      adminBadge?.classList.add('hidden');
      userOrdersBtn?.classList.remove('hidden');
      userOrdersBtn?.classList.add('flex');
      adminProductsBtn?.classList.add('hidden');
      adminOrdersBtn?.classList.add('hidden');
      adminUsersBtn?.classList.add('hidden');
      cartBtn?.classList.remove('hidden');
    }
  } else {
    loggedOut?.classList.remove('hidden');
    loggedOut?.classList.add('flex');
    loggedIn?.classList.add('hidden');
    cartBtn?.classList.remove('hidden');
  }
}

/* ─────── Header events ─────── */
function initHeaderEvents() {
  /* Dropdown user menu */
  const menuBtn  = document.getElementById('userMenuBtn');
  const dropdown = document.getElementById('userMenuDropdown');
  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !dropdown.contains(e.target))
        dropdown.classList.add('hidden');
    });
  }

  /* Cart button */
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    cartBtn.replaceWith(cartBtn.cloneNode(true)); // remove old listeners
    const newCartBtn = document.getElementById('cartBtn');
    newCartBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isLoggedIn()) openAuthModal();
      else window.location.href = 'cart.html';
    });
  }

  /* Close modal */
  document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);

  /* Toggle password visibility */
  document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    const input = document.getElementById('passwordInput');
    const icon  = document.getElementById('passwordEyeIcon');
    input.type  = isPasswordVisible ? 'text' : 'password';
    icon.setAttribute('data-lucide', isPasswordVisible ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  /* Toggle login ↔ register */
  document.getElementById('toggleAuthModeBtn')?.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('errorMessage')?.classList.add('hidden');
    document.getElementById('authForm')?.reset();

    const nameField    = document.getElementById('nameField');
    const confirmField = document.getElementById('confirmPasswordField');
    const title        = document.getElementById('authTitle');
    const subtitle     = document.getElementById('authSubtitle');
    const submitBtn    = document.getElementById('submitAuthBtn');
    const toggleText   = document.getElementById('toggleAuthText');
    const toggleBtn    = document.getElementById('toggleAuthModeBtn');

    if (isLoginMode) {
      title.textContent    = 'Đăng Nhập';
      subtitle.textContent = 'Chào mừng bạn trở lại!';
      nameField.classList.add('hidden');
      nameField.querySelector('input').removeAttribute('required');
      confirmField.classList.add('hidden');
      confirmField.querySelector('input').removeAttribute('required');
      submitBtn.textContent = 'Đăng nhập';
      toggleText.textContent = 'Chưa có tài khoản?';
      toggleBtn.textContent  = 'Đăng ký ngay';
    } else {
      title.textContent    = 'Đăng Ký';
      subtitle.textContent = 'Tạo tài khoản mới';
      nameField.classList.remove('hidden');
      nameField.querySelector('input').setAttribute('required', 'true');
      confirmField.classList.remove('hidden');
      confirmField.querySelector('input').setAttribute('required', 'true');
      submitBtn.textContent  = 'Đăng ký';
      toggleText.textContent = 'Đã có tài khoản?';
      toggleBtn.textContent  = 'Đăng nhập';
    }
  });

  /* Auth form submit */
  document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
}

/* ─────── Auth submit handler ─────── */
async function handleAuthSubmit(e) {
  e.preventDefault();
  const errEl     = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitAuthBtn');
  errEl?.classList.add('hidden');

  const email    = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  submitBtn.disabled   = true;
  submitBtn.textContent = isLoginMode ? 'Đang đăng nhập...' : 'Đang đăng ký...';

  try {
    if (!isLoginMode) {
      /* ── REGISTER ── */
      const name           = document.getElementById('nameInput').value.trim();
      const confirmPwd     = document.getElementById('confirmPasswordInput').value;

      if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (password !== confirmPwd) throw new Error('Mật khẩu xác nhận không khớp');

      const res = await AuthAPI.register({ HoTen: name, Email: email, MatKhau: password });
      Session.save(res.data.token, res.data.user);
    } else {
      /* ── LOGIN ── */
      const res = await AuthAPI.login({ Email: email, MatKhau: password });
      Session.save(res.data.token, res.data.user);
    }

    closeAuthModal();
    checkAuthStatus();
    updateHeaderCartCount();

    // Redirect admin → admin panel
    const user = Session.getUser();
    if (user?.isAdmin && window.location.pathname.includes('index')) {
      // stay on page, just update UI
    }
  } catch (err) {
    const msg = err.message || 'Có lỗi xảy ra, vui lòng thử lại';
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = isLoginMode ? 'Đăng nhập' : 'Đăng ký';
  }
}

/* ─────── Admin Sidebar Loader ─────── */
async function loadAdminSidebar() {
  const container = document.getElementById('admin-sidebar-container');
  if (!container) return; // Nếu không phải trang admin thì bỏ qua

  try {
    const response = await fetch('components/admin-sidebar.html');
    const html = await response.text();
    container.innerHTML = html;

    // Đánh dấu menu đang active dựa trên URL hiện tại
    const currentPath = window.location.pathname.split('/').pop() || 'admin-orders.html';
    const links = container.querySelectorAll('nav a');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('bg-gray-800', 'text-white');
        const icon = link.querySelector('i');
        if (icon) icon.classList.add('text-amber-500');
      }
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Hiển thị tên Admin
    if (typeof Session !== 'undefined') {
      const user = Session.getUser();
      const nameEl = document.getElementById('sidebarAdminName');
      if (user && user.name && nameEl) {
        nameEl.textContent = user.name;
      }
    }
  } catch (error) {
    console.error('Lỗi tải Admin Sidebar:', error);
  }
}

/* ─────── Boot ─────── */
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadAdminSidebar(); // Gọi thêm hàm tải sidebar khi khởi động trang
});
