/**
 * pages/index.js — Trang chủ: load sản phẩm nổi bật từ API
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('featuredProductsContainer');
  if (!container) return;

  // Skeleton loading
  container.innerHTML = Array(3).fill(`
    <div class="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div class="h-48 bg-gray-200"></div>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  `).join('');

  try {
    const res = await ProductAPI.getAll();
    const products = res.data || [];

    // Lấy ngẫu nhiên 3 sản phẩm còn hàng
    const inStock = products.filter(p => p.SLTon > 0);
    const featured = inStock.sort(() => 0.5 - Math.random()).slice(0, 3);

    if (featured.length === 0) {
      container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Chưa có sản phẩm nào.</p>';
      return;
    }

    container.innerHTML = featured.map(p => {
      const imageUrl = (p.HinhAnh && p.HinhAnh.startsWith('http')) 
        ? p.HinhAnh 
        : (p.HinhAnh?.startsWith('/') ? `http://localhost:5000${p.HinhAnh}` : `http://localhost:5000/${p.HinhAnh}`);

      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
             onclick="window.location.href='product-detail.html?id=${p.MaSP}'">
          <div class="relative overflow-hidden h-48">
            <img src="${imageUrl}" alt="${p.TenSP}"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                 onerror="this.src='https://placehold.co/400x300?text=NoImage'">
          </div>
          <div class="p-4">
            <p class="text-xs text-gray-500 mb-1">${p.DanhMuc || ''}</p>
            <h3 class="font-semibold text-lg text-gray-900 mb-1 truncate">${p.TenSP}</h3>
            <p class="text-amber-600 font-bold mb-4">${Number(p.GiaBan).toLocaleString('vi-VN')}₫</p>
            <button onclick="handleHomeAddToCart(event, ${p.MaSP})"
                    class="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-lg font-semibold transition-colors">
              Thêm vào giỏ
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-red-500 col-span-3 text-center py-8">Không thể tải sản phẩm. Vui lòng thử lại.</p>';
  }
});

window.handleHomeAddToCart = async function (e, productId) {
  e.stopPropagation();
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
      if (typeof openAuthModal === 'function') openAuthModal(); 
      else alert("Vui lòng đăng nhập!");
      return; 
  }

  const user = Session.getUser();
  if (user?.isAdmin) { alert('Tài khoản Admin không thể mua hàng!'); return; }

  try {
    await CartAPI.add(productId, 1);
    if (typeof updateHeaderCartCount === 'function') updateHeaderCartCount();
    showToast('Đã thêm vào giỏ hàng!');
  } catch (err) {
    alert(err.message || 'Không thể thêm vào giỏ hàng');
  }
};

/* toast  */
function showToast(msg, type = 'success') {
  const colors = { success: 'bg-green-600', error: 'bg-red-600' };
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white font-semibold shadow-lg ${colors[type]} transition-all`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}
window.showToast = showToast;