/**
 * pages/product.js — Trang danh sách sản phẩm: kết nối Backend API
 */

/* ─────── DOM refs ─────── */
const searchInput       = document.getElementById('searchInput');
const sortSelect        = document.getElementById('sortSelect');
const categoryInputs    = document.querySelectorAll('input[name="category"]');
const priceInputs       = document.querySelectorAll('input[name="price"]');
const productsContainer = document.getElementById('productsContainer');
const productCount      = document.getElementById('productCount');
const noProductsMessage = document.getElementById('noProductsMessage');
const clearFiltersBtn   = document.getElementById('clearFiltersBtn');
const clearFiltersEmpty = document.getElementById('clearFiltersEmptyBtn');
const toggleFiltersBtn  = document.getElementById('toggleFiltersBtn');
const filtersSidebar    = document.getElementById('filtersSidebar');

let allProducts = []; // cache sau lần fetch đầu tiên

/* Hàm loại bỏ dấu tiếng Việt để tìm kiếm chính xác */
function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD') // Chuyển đổi chuỗi sang dạng tổ hợp (tách riêng chữ và dấu)
    .replace(/[\u0300-\u036f]/g, '') // Xóa các ký tự dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D'); // Chuyển chữ Đ thành d
}

/* Mẫu tiền tệ - vnd */
function fmt(price) {
  return Number(price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/* Render */
function renderProducts(list) {
  if (!productsContainer) return;
  if (productCount) productCount.textContent = list.length;

  if (list.length === 0) {
    productsContainer.classList.add('hidden');
    noProductsMessage?.classList.remove('hidden');
    return;
  }

  productsContainer.classList.remove('hidden');
  noProductsMessage?.classList.add('hidden');
  productsContainer.innerHTML = list.map(p => {
    const outOfStock = p.SLTon <= 0;
    const discountPct = p.GiaGoc
      ? Math.round(((p.GiaGoc - p.GiaBan) / p.GiaGoc) * 100)
      : 0;
    const imageUrl = (p.HinhAnh && p.HinhAnh.startsWith('http')) 
      ? p.HinhAnh 
      : (p.HinhAnh?.startsWith('/') ? `http://localhost:5000${p.HinhAnh}` : `http://localhost:5000/${p.HinhAnh}`);

    return `
      <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer">
        <div class="relative overflow-hidden" onclick="window.location.href='product-detail.html?id=${p.MaSP}'">
          <img src="${imageUrl}" alt="${p.TenSP}"
               class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
               onerror="this.src='https://placehold.co/400x300?text=NoImage'">
          ${outOfStock ? `
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span class="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">Hết hàng</span>
            </div>` : ''}
          ${!outOfStock && discountPct > 0 ? `
            <div class="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
              -${discountPct}%
            </div>` : ''}
        </div>

        <div class="p-4">
          <p class="text-sm text-gray-500 mb-1">${p.DanhMuc || ''}</p>
          <h3 class="font-semibold text-gray-900 mb-2 hover:text-amber-600 transition-colors cursor-pointer"
              onclick="window.location.href='product-detail.html?id=${p.MaSP}'">${p.TenSP}</h3>

          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl font-bold text-amber-600">${fmt(p.GiaBan)}</span>
            ${p.GiaGoc ? `<span class="text-sm text-gray-400 line-through">${fmt(p.GiaGoc)}</span>` : ''}
          </div>

          <p class="text-sm text-gray-500 mb-3">
            ${outOfStock
              ? '<span class="text-red-600 font-semibold">Hết hàng</span>'
              : `<span>Còn ${p.SLTon} sản phẩm</span>`}
          </p>

          <div class="flex gap-2">
            <button ${outOfStock ? 'disabled' : ''}
                    onclick="handleProductAction(event,'cart',${p.MaSP})"
                    class="flex-1 border-2 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors
                           ${outOfStock ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-amber-600 text-amber-600 hover:bg-amber-50'}">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i> Thêm
            </button>
            <button ${outOfStock ? 'disabled' : ''}
                    onclick="handleProductAction(event,'buy',${p.MaSP})"
                    class="flex-1 py-2 rounded-lg font-semibold transition-colors
                           ${outOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'}">
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* Skeleton */
function renderSkeleton() {
  if (!productsContainer) return;
  productsContainer.classList.remove('hidden');
  noProductsMessage?.classList.add('hidden');
  productsContainer.innerHTML = Array(6).fill(`
    <div class="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div class="h-64 bg-gray-200"></div>
      <div class="p-4 space-y-3">
        <div class="h-3 bg-gray-200 rounded w-1/3"></div>
        <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="flex gap-2"><div class="h-10 bg-gray-200 rounded flex-1"></div><div class="h-10 bg-gray-200 rounded flex-1"></div></div>
      </div>
    </div>
  `).join('');
}

/* Filter + Sort */
function applyFilters() {
  // Lấy từ khóa và loại bỏ dấu, chuyển về chữ thường
  const rawTerm = searchInput?.value || '';
  const term = removeVietnameseTones(rawTerm).toLowerCase();

  const category   = document.querySelector('input[name="category"]:checked')?.value || 'all';
  const priceRange = document.querySelector('input[name="price"]:checked')?.value   || 'all';
  const sortBy     = sortSelect?.value || 'default';

  let result = allProducts.filter(p => {
    // Ép tên sản phẩm về dạng không dấu, chữ thường trước khi so sánh
    const normalizedProductName = removeVietnameseTones(p.TenSP).toLowerCase();
    const matchName = normalizedProductName.includes(term);
    
    // logic lọc danh mục: so khớp với ID (MaDM) hoặc Tên (DanhMuc) tùy theo value của radio button
    const matchCat  = category === 'all' || p.DanhMuc === category || p.MaDM == category;
    
    // logic lọc giá
    let   matchPrice = true;
    const price = Number(p.GiaBan);
    if (priceRange === 'under5')  matchPrice = price < 5_000_000;
    if (priceRange === '5to10')   matchPrice = price >= 5_000_000  && price < 10_000_000;
    if (priceRange === '10to15')  matchPrice = price >= 10_000_000 && price < 15_000_000;
    if (priceRange === 'over15')  matchPrice = price >= 15_000_000;
    
    return matchName && matchCat && matchPrice;
  });

  if (sortBy === 'price-asc')  result.sort((a, b) => a.GiaBan - b.GiaBan);
  if (sortBy === 'price-desc') result.sort((a, b) => b.GiaBan - a.GiaBan);
  if (sortBy === 'name')       result.sort((a, b) => a.TenSP.localeCompare(b.TenSP));

  renderProducts(result);
}

async function loadProducts() {
  renderSkeleton();
  try {
    const res   = await ProductAPI.getAll();
    allProducts = res.data || [];
    applyFilters();
  } catch (err) {
    console.error(err);
    productsContainer.innerHTML = `
      <p class="col-span-3 text-center text-red-500 py-8">
        Không thể tải sản phẩm. Vui lòng thử lại sau.
      </p>`;
  }
}

/* lọc sp theo thay đổi */
searchInput?.addEventListener('input',    applyFilters);
sortSelect?.addEventListener('change',    applyFilters);
categoryInputs.forEach(i => i.addEventListener('change', applyFilters));
priceInputs.forEach(i =>    i.addEventListener('change', applyFilters));

function clearFilters() {
  if (searchInput) searchInput.value = '';
  if (sortSelect)  sortSelect.value  = 'default';
  document.querySelector('input[name="category"][value="all"]')?.click();
  document.querySelector('input[name="price"][value="all"]')?.click();
}

clearFiltersBtn?.addEventListener('click',  clearFilters);
clearFiltersEmpty?.addEventListener('click', clearFilters);
toggleFiltersBtn?.addEventListener('click', () =>
  filtersSidebar?.classList.toggle('hidden'));

/* thêm giỏ + mua */
window.handleProductAction = async function (e, action, productId) {
  e.stopPropagation();
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) { 
      if (typeof openAuthModal === 'function') openAuthModal();
      else alert("Vui lòng đăng nhập!");
      return; 
  }

  const user = Session.getUser();
  if (user?.isAdmin) { alert('Tài khoản Admin không thể thực hiện chức năng này!'); return; }

  if (action === 'cart') {
    try {
      await CartAPI.add(productId, 1);
      if (typeof updateHeaderCartCount === 'function') updateHeaderCartCount();
      if (typeof showToast === 'function') showToast('Đã thêm vào giỏ hàng!');
      else alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Không thể thêm vào giỏ hàng', 'error');
      else alert(err.message || 'Không thể thêm vào giỏ hàng');
    }
  } else {
    window.location.href = `direct-checkout.html?id=${productId}&qty=1`;
  }
};

/* ─────── Boot ─────── */
document.addEventListener('DOMContentLoaded', loadProducts);