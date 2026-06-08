/**
 * pages/cart.js — Giỏ hàng: kết nối Backend API
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
      window.location.href = 'index.html'; 
      return; 
  }

  await renderCart();
});

async function renderCart() {
  const listEl       = document.getElementById('cartItemsList');
  const emptyEl      = document.getElementById('emptyCartMessage');
  const summaryEl    = document.getElementById('cartSummaryCol');
  const countEl      = document.getElementById('cartCountHeader');
  const subtotalEl   = document.getElementById('cartSubtotal');
  const shippingEl   = document.getElementById('cartShipping');
  const totalEl      = document.getElementById('cartTotal');

  // hiệu ứng khi đang load
  if (listEl) {
    const skeletonItems = Array(2).fill(`
        <div class="bg-white rounded-xl p-4 flex gap-4">
          <div class="w-24 h-24 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 space-y-2 pt-2">
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            <div class="h-3 bg-gray-200 rounded w-1/3"></div>
            <div class="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
          </div>
        </div>`).join('');
        
    listEl.innerHTML = `<div class="animate-pulse space-y-4">${skeletonItems}</div>`;
  }

  let items = [];
  try {
    const res = await CartAPI.get();
    items = res.data || [];
  } catch (err) {
    console.error(err);
    if (listEl) listEl.innerHTML = `<p class="text-red-500 text-center py-8">Không thể tải giỏ hàng: ${err.message}</p>`;
    return;
  }

  if (countEl) countEl.textContent = items.length;

  if (items.length === 0) {
    listEl?.classList.add('hidden');
    summaryEl?.classList.add('hidden');
    emptyEl?.classList.remove('hidden');
    return;
  }

  listEl?.classList.remove('hidden');
  summaryEl?.classList.remove('hidden');
  emptyEl?.classList.add('hidden');

  let subtotal = 0;
  
  // logic xử lý ảnh vào vòng lặp map
  listEl.innerHTML = items.map(item => {
    const lineTotal = Number(item.GiaBan) * item.SoLuong;
    subtotal += lineTotal;
    
    // Logic tự động nối link Backend cho HinhAnh
    const imageUrl = (item.HinhAnh && item.HinhAnh.startsWith('http')) 
      ? item.HinhAnh 
      : (item.HinhAnh?.startsWith('/') ? `http://localhost:5000${item.HinhAnh}` : `http://localhost:5000/${item.HinhAnh}`);

    return `
      <div class="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
        <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
             onclick="window.location.href='product-detail.html?id=${item.MaSP}'">
          <img src="${imageUrl}" alt="${item.TenSP}" class="w-full h-full object-cover"
               onerror="this.src='https://placehold.co/100?text=NT'">
        </div>

        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="font-semibold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors"
                  onclick="window.location.href='product-detail.html?id=${item.MaSP}'">${item.TenSP}</h3>
              <p class="text-sm text-gray-500">${item.DanhMuc || ''}</p>
            </div>
            <button onclick="removeCartItem(${item.MaSP})"
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="flex justify-between items-center">
            <span class="font-bold text-amber-600">${Number(item.GiaBan).toLocaleString('vi-VN')}₫</span>
            <div class="flex items-center border border-gray-200 rounded-lg">
              <button onclick="changeQty(${item.MaSP}, ${item.SoLuong - 1})"
                      class="px-3 py-1 hover:bg-gray-100 transition-colors text-gray-600 text-lg font-semibold">−</button>
              <span class="px-3 py-1 font-medium text-gray-900 border-x border-gray-200">${item.SoLuong}</span>
              <button onclick="changeQty(${item.MaSP}, ${item.SoLuong + 1})"
                      class="px-3 py-1 hover:bg-gray-100 transition-colors text-gray-600 text-lg font-semibold">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const shipping = subtotal >= 5_000_000 ? 0 : 200_000;
  const total    = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + '₫';
  if (shippingEl) {
    shippingEl.innerHTML = shipping === 0
      ? '<span class="text-green-600 font-medium">Miễn phí</span>'
      : shipping.toLocaleString('vi-VN') + '₫';
  }
  if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + '₫';

  if (typeof updateHeaderCartCount === 'function') updateHeaderCartCount();
}

/* thay đổi số lượng sp trong giỏ */
window.changeQty = async function (productId, newQty) {
  if (newQty <= 0) { removeCartItem(productId); return; }
  try {
    await CartAPI.update(productId, newQty);
    await renderCart();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Không thể cập nhật số lượng', 'error');
    else alert(err.message || 'Không thể cập nhật số lượng');
  }
};

window.removeCartItem = async function (productId) {
  if (!confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
  try {
    await CartAPI.remove(productId);
    await renderCart();
    if (typeof showToast === 'function') showToast('Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Không thể xóa sản phẩm', 'error');
    else alert(err.message || 'Không thể xóa sản phẩm');
  }
};