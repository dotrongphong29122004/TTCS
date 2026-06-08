/**
 * pages/account.js — Quản lý tài khoản
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) { window.location.href = 'index.html'; return; }

  /* tải thông tin người dùng hiện tại */
  try {
    const res  = await AuthAPI.getMe();
    const user = res.data;
    const nameInput  = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const avatarEl   = document.getElementById('avatarLetter');

    if (nameInput)  nameInput.value  = user.HoTen  || '';
    if (emailInput) emailInput.value = user.Email   || '';
    if (avatarEl)   avatarEl.textContent = (user.HoTen || 'U').charAt(0).toUpperCase();

    if (user.VaiTro === 'Admin') {
      document.getElementById('adminBadgeBox')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('getMe error:', err);
  }

  /* ─── Profile form ─── */
  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const hoTen = document.getElementById('profileName').value.trim();
    if (!hoTen) return;

    btn.disabled = true; btn.textContent = 'Đang lưu...';
    try {
      await AuthAPI.updateProfile({ HoTen: hoTen });
      // Cập nhật session
      const user = Session.getUser();
      if (user) { user.name = hoTen; localStorage.setItem('currentUser', JSON.stringify(user)); }
      showToast('Cập nhật thông tin thành công!');
    } catch (err) {
      showToast(err.message || 'Cập nhật thất bại', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Lưu thay đổi';
      lucide?.createIcons();
    }
  });

  /* ─── Password form ─── */
  document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs    = e.target.querySelectorAll('input[type="password"]');
    const oldPwd    = inputs[0].value;
    const newPwd    = inputs[1].value;
    const confirmPwd= inputs[2].value;

    if (newPwd.length < 6) { showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error'); return; }
    if (newPwd !== confirmPwd) { showToast('Mật khẩu xác nhận không khớp', 'error'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Đang đổi...';

    try {
      await AuthAPI.changePassword({ MatKhauCu: oldPwd, MatKhauMoi: newPwd });
      showToast('Đổi mật khẩu thành công!');
      e.target.reset();
    } catch (err) {
      showToast(err.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Đổi mật khẩu';
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});