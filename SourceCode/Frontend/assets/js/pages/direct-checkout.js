/**
 * pages/direct-checkout.js — Mua ngay (không qua giỏ hàng)
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) { window.location.href = 'index.html'; return; }

  const params    = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const qty       = parseInt(params.get('qty') || '1');

  if (!productId) { window.location.href = 'products.html'; return; }

  initAddressDropdowns();
  /* ─── Load product ─── */
  let product;
  try {
    const res = await ProductAPI.getById(productId);
    product   = res.data;
  } catch {
    alert('Sản phẩm không tồn tại!');
    window.location.href = 'products.html';
    return;
  }

  /* ─── Render summary ─── */
  const img   = document.getElementById('prodImg');
  const name  = document.getElementById('prodName');
  const qtyEl = document.getElementById('prodQty');
  const price = document.getElementById('prodPrice');
  const imageUrl = (product.HinhAnh && product.HinhAnh.startsWith('http')) 
      ? product.HinhAnh 
      : (product.HinhAnh?.startsWith('/') ? `http://localhost:5000${product.HinhAnh}` : `http://localhost:5000/${product.HinhAnh}`);

  if (img)   { 
      img.src = imageUrl; 
      img.onerror = () => img.src = 'https://placehold.co/64?text=NT'; 
  }
  if (name)  name.textContent  = product.TenSP;
  if (qtyEl) qtyEl.textContent = qty;
  if (price) price.textContent = Number(product.GiaBan).toLocaleString('vi-VN') + '₫';

  const subtotal = Number(product.GiaBan) * qty;
  const shipping = subtotal >= 5_000_000 ? 0 : 200_000;
  const total    = subtotal + shipping;

  setEl('directSubtotal', subtotal.toLocaleString('vi-VN') + '₫');
  const shipEl = document.getElementById('directShipping');
  if (shipEl) shipEl.innerHTML = shipping === 0
    ? '<span class="text-green-600 font-semibold">Miễn phí</span>'
    : shipping.toLocaleString('vi-VN') + '₫';
  setEl('directTotal', total.toLocaleString('vi-VN') + '₫');

  /* ─── Form submit ─── */
  document.getElementById('directForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const citySelect = document.getElementById('citySelect');
    const districtSelect = document.getElementById('districtSelect');
    const wardSelect = document.getElementById('wardSelect');

    const phone    = document.getElementById('directPhone').value.trim();
    const address  = document.getElementById('directAddress').value.trim();
    const city     = citySelect.options[citySelect.selectedIndex]?.getAttribute('data-name') || '';
    const district = districtSelect.options[districtSelect.selectedIndex]?.getAttribute('data-name') || '';
    const ward     = wardSelect.options[wardSelect.selectedIndex]?.getAttribute('data-name') || '';

    const diaChiGH = `${address}, ${ward}, ${district}, ${city}`;
    const btn      = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang xử lý...'; }

    try {
      const res = await OrderAPI.create({
        DiaChiGH: diaChiGH,
        SDT:      phone,
        cartItems: [{ MaSP: product.MaSP, SoLuong: qty, GiaBan: product.GiaBan }],
      });

      document.getElementById('directCheckoutFlow')?.classList.add('hidden');
      const successEl = document.getElementById('directSuccessFlow');
      if (successEl) { successEl.classList.remove('hidden'); successEl.classList.add('flex'); }
      setEl('directOrderId', '#' + res.data.MaDH);
      
      if (typeof updateHeaderCartCount === 'function') updateHeaderCartCount();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Đặt hàng thất bại', 'error');
      else alert(err.message || 'Đặt hàng thất bại');
      
      if (btn) { btn.disabled = false; btn.textContent = 'Hoàn tất đơn hàng'; }
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ════════════════════════════════════════
   GỌI API TỈNH/THÀNH PHỐ
════════════════════════════════════════ */
function initAddressDropdowns() {
  const host = "https://provinces.open-api.vn/api/";
  const citySelect = document.getElementById('citySelect');
  const districtSelect = document.getElementById('districtSelect');
  const wardSelect = document.getElementById('wardSelect');

  if (!citySelect || !districtSelect || !wardSelect) return;

  // 1. Tải danh sách Tỉnh/Thành phố
  fetch(host + "?depth=1")
    .then(res => res.json())
    .then(data => {
      let options = '<option value="">Chọn Tỉnh/Thành phố</option>';
      data.forEach(item => {
        options += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
      });
      citySelect.innerHTML = options;
    });

  // 2. Khi chọn Tỉnh -> Tải danh sách Huyện
  citySelect.addEventListener('change', (e) => {
    districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    districtSelect.disabled = true;
    wardSelect.disabled = true;
    
    if(e.target.value) {
      fetch(host + "p/" + e.target.value + "?depth=2")
        .then(res => res.json())
        .then(data => {
          let options = '<option value="">Chọn Quận/Huyện</option>';
          data.districts.forEach(item => {
            options += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
          });
          districtSelect.innerHTML = options;
          districtSelect.disabled = false;
          districtSelect.classList.remove('bg-gray-50');
        });
    }
  });

  // 3. Khi chọn Huyện -> Tải danh sách Xã
  districtSelect.addEventListener('change', (e) => {
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    wardSelect.disabled = true;
    
    if(e.target.value) {
      fetch(host + "d/" + e.target.value + "?depth=2")
        .then(res => res.json())
        .then(data => {
          let options = '<option value="">Chọn Phường/Xã</option>';
          data.wards.forEach(item => {
            options += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
          });
          wardSelect.innerHTML = options;
          wardSelect.disabled = false;
          wardSelect.classList.remove('bg-gray-50');
        });
    }
  });
}