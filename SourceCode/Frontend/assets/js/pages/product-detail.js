/**
 * pages/product-detail.js — Chi tiết sản phẩm: API
 */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) { window.location.href = 'products.html'; return; }

  document.getElementById('productName')?.closest('.space-y-6')
    && (document.getElementById('productName').textContent = 'Đang tải...');

  let product;
  try {
    const res = await ProductAPI.getById(productId);
    product = res.data;
  } catch {
    alert('Sản phẩm không tồn tại');
    window.location.href = 'products.html';
    return;
  }

  const imageUrl = (product.HinhAnh && product.HinhAnh.startsWith('http')) 
      ? product.HinhAnh 
      : (product.HinhAnh?.startsWith('/') ? `http://localhost:5000${product.HinhAnh}` : `http://localhost:5000/${product.HinhAnh}`);

  const mainImage = document.getElementById('mainImage');
  if (mainImage) mainImage.src = imageUrl;
  mainImage?.setAttribute('onerror', "this.src='https://placehold.co/600x400?text=NoImage'");

  setText('productCategory', product.DanhMuc || '');
  setText('productName', product.TenSP);
  setText('productPrice', Number(product.GiaBan).toLocaleString('vi-VN') + '₫');
  setText('productDescription', product.MoTa || 'Chưa có mô tả chi tiết.');

  if (product.GiaGoc) {
    const oldEl = document.getElementById('productOldPrice');
    const discEl = document.getElementById('productDiscount');
    if (oldEl) { oldEl.textContent = Number(product.GiaGoc).toLocaleString('vi-VN') + '₫'; oldEl.classList.remove('hidden'); }
    if (discEl) {
      const pct = Math.round(((product.GiaGoc - product.GiaBan) / product.GiaGoc) * 100);
      discEl.textContent = `Giảm ${pct}%`;
      discEl.classList.remove('hidden');
    }
  }

  const thumbContainer = document.getElementById('thumbContainer');
  if (thumbContainer) {
    thumbContainer.innerHTML = Array(4).fill(0).map((_, i) => `
      <div class="aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-amber-600' : 'border-gray-200'} hover:border-amber-600 cursor-pointer transition-colors">
        <img src="${imageUrl}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/150?text=NT'">
      </div>`).join('');
  }

  const outOfStock = product.SLTon <= 0;
  const stockEl = document.getElementById('stockStatus');
  const addBtn = document.getElementById('addToCartBtn');
  const buyBtn = document.getElementById('buyNowBtn');

  if (outOfStock) {
    if (stockEl) stockEl.innerHTML = '<span class="text-red-600 font-semibold">Hết hàng</span>';
    [addBtn, buyBtn].forEach(b => { if (b) { b.disabled = true; b.classList.add('opacity-50', 'cursor-not-allowed'); } });
  } else {
    if (stockEl) stockEl.textContent = `Còn ${product.SLTon} sản phẩm`;
  }

  let qty = 1;
  const qtyDisplay = document.getElementById('quantityDisplay');
  document.getElementById('decreaseQtyBtn')?.addEventListener('click', () => {
    if (qty > 1 && !outOfStock) { qty--; if (qtyDisplay) qtyDisplay.textContent = qty; }
  });
  document.getElementById('increaseQtyBtn')?.addEventListener('click', () => {
    if (qty < product.SLTon && !outOfStock) { qty++; if (qtyDisplay) qtyDisplay.textContent = qty; }
  });

  // Thêm vào giỏ
  addBtn?.addEventListener('click', async () => {
    if (outOfStock) return;
    
    // Kiểm tra đăng nhập
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
        if (typeof openAuthModal === 'function') openAuthModal();
        else alert('Vui lòng đăng nhập!');
        return; 
    }
    const user = typeof Session !== 'undefined' ? Session.getUser() : null;
    if (user?.isAdmin) { alert('Tài khoản Admin không thể mua hàng'); return; }

    try {
      await CartAPI.add(product.MaSP, qty);
      if (typeof updateHeaderCartCount === 'function') updateHeaderCartCount();
      showToast('Đã thêm vào giỏ hàng thành công!');
    } catch (err) { 
      showToast(err.message || 'Lỗi thêm vào giỏ', 'error'); 
    }
  });

  // Mua ngay
  buyBtn?.addEventListener('click', () => {
    if (outOfStock) return;
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
        if (typeof openAuthModal === 'function') openAuthModal();
        else alert('Vui lòng đăng nhập!');
        return; 
    }
    const user = typeof Session !== 'undefined' ? Session.getUser() : null;
    if (user?.isAdmin) { alert('Tài khoản Admin không thể mua hàng'); return; }
    
    window.location.href = `direct-checkout.html?id=${product.MaSP}&qty=${qty}`;
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b =>
        b.classList.replace('border-amber-600', 'border-gray-200'));
      btn.classList.replace('border-gray-200', 'border-amber-600');
    });
  });

  await loadReviews(productId);
  initReviewForm(productId);

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function starsHtml(rating, size = 5) {
  return Array(5).fill(0).map((_, i) =>
    `<i data-lucide="star" class="w-${size} h-${size} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}"></i>`
  ).join('');
}

async function loadReviews(productId) {
  try {
    const res = await ReviewAPI.getByProduct(productId);
    const { reviews = [], avgRating = 0, totalReviews = 0 } = res.data;

    const starContainer = document.getElementById('starContainer');
    const reviewCount = document.getElementById('reviewCount');
    if (starContainer) {
      starContainer.innerHTML = starsHtml(Math.round(avgRating));
      lucide?.createIcons();
    }
    if (reviewCount) reviewCount.textContent = `(${totalReviews} đánh giá)`;

    const listEl = document.getElementById('reviewsList');
    if (!listEl) return;

    if (reviews.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-center py-4">Chưa có đánh giá nào</p>';
      return;
    }

    listEl.innerHTML = reviews.map(r => `
      <div class="border-b border-gray-100 pb-6 mb-6 last:border-0">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-amber-100 text-amber-600 font-bold rounded-full flex items-center justify-center">
            ${r.TenKH?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p class="font-semibold text-gray-900">${r.TenKH || 'Ẩn danh'}</p>
            <div class="flex items-center gap-2">
              <div class="flex">${starsHtml(r.SoSao, 4)}</div>
              <span class="text-xs text-gray-500">${new Date(r.NgayDG).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
        <p class="text-gray-600 mt-2">${r.NoiDung || ''}</p>
      </div>
    `).join('');
    lucide?.createIcons();
  } catch (err) {
    console.error('loadReviews error', err);
  }
}

function initReviewForm(productId) {
  const container = document.getElementById('ratingInputContainer');
  if (!container) return;

  let currentRating = 0;
  container.innerHTML = Array(5).fill(0).map((_, i) => `
    <div data-rating="${i + 1}" class="cursor-pointer rating-star-input text-gray-300 transition-colors">
      <i data-lucide="star" class="w-8 h-8 pointer-events-none"></i>
    </div>`).join('');
  lucide?.createIcons();

  const stars = container.querySelectorAll('.rating-star-input');

  function paintStars(n) {
    stars.forEach((s, i) => {
      const svg = s.querySelector('svg');
      if (i < n) { s.classList.add('text-amber-400'); s.classList.remove('text-gray-300'); svg?.classList.add('fill-amber-400'); }
      else { s.classList.remove('text-amber-400'); s.classList.add('text-gray-300'); svg?.classList.remove('fill-amber-400'); }
    });
  }

  stars.forEach(s => {
    s.addEventListener('mouseenter', () => paintStars(+s.dataset.rating));
    s.addEventListener('click', () => { currentRating = +s.dataset.rating; paintStars(currentRating); });
  });
  container.addEventListener('mouseleave', () => paintStars(currentRating));

  document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
        if (typeof openAuthModal === 'function') openAuthModal();
        else alert('Vui lòng đăng nhập!');
        return; 
    }
    if (currentRating === 0) { 
        showToast('Vui lòng chọn số sao', 'error'); 
        return; 
    }

    const noiDung = document.getElementById('reviewComment')?.value || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang gửi...';
    }

    try {
      await ReviewAPI.create(productId, { SoSao: currentRating, NoiDung: noiDung });
      showToast('Cảm ơn đánh giá của bạn!');
      
      document.getElementById('reviewComment').value = '';
      currentRating = 0; paintStars(0);

      setTimeout(async () => {
          await loadReviews(productId); 
          
          if(submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Gửi đánh giá';
          }
      }, 800); 

    } catch (err) {
      showToast(err.message || 'Không thể gửi đánh giá', 'error');
      if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Gửi đánh giá';
      }
    }
  });
}

/*  thông báo (Toast) */
if (typeof window.showToast !== 'function') {
  window.showToast = function(msg, type = 'success') {
    const colors = { success: 'bg-green-600', error: 'bg-red-600' };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white font-semibold shadow-lg ${colors[type] || colors.success} transition-all`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  };
}