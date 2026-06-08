document.addEventListener('DOMContentLoaded', async () => {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) { window.location.href = 'index.html'; return; }

  const listEl  = document.getElementById('myOrdersList');
  const emptyEl = document.getElementById('emptyOrdersMessage');

  // skeleton - xám nhấp nháy
  if (listEl) {
    listEl.innerHTML = Array(2).fill(`
      <div class="bg-white rounded-2xl shadow-sm p-6 animate-pulse space-y-4">
        <div class="flex gap-6">
          <div class="h-4 bg-gray-200 rounded w-32"></div>
          <div class="h-4 bg-gray-200 rounded w-24"></div>
          <div class="h-4 bg-gray-200 rounded w-28"></div>
        </div>
        <div class="h-20 bg-gray-200 rounded"></div>
      </div>`).join('');
  }

  let orders = [];
  try {
    const res = await OrderAPI.getMy();
    orders    = res.data || [];
  } catch (err) {
    console.error(err);
    if (listEl) listEl.innerHTML = `<p class="text-red-500 text-center py-8">Không thể tải đơn hàng: ${err.message}</p>`;
    return;
  }

  if (orders.length === 0) {
    listEl?.classList.add('hidden');
    emptyEl?.classList.remove('hidden');
    return;
  }
  listEl?.classList.remove('hidden');
  emptyEl?.classList.add('hidden');

  const statusMap = {
    pending:    { label: 'Chờ xác nhận', cls: 'text-yellow-700 border-yellow-200 bg-yellow-50', icon: 'clock' },
    processing: { label: 'Đang xử lý',   cls: 'text-blue-700 border-blue-200 bg-blue-50',       icon: 'loader' },
    completed:  { label: 'Hoàn thành',    cls: 'text-green-700 border-green-200 bg-green-50',    icon: 'check-circle' },
    cancelled:  { label: 'Đã hủy',        cls: 'text-red-700 border-red-200 bg-red-50',          icon: 'x-circle' },
  };

  listEl.innerHTML = orders.map(order => {
    const cfg = statusMap[order.TrangThai] || statusMap.pending;
    const itemsHtml = (order.items || []).map(item => {
      const imageUrl = (item.HinhAnh && item.HinhAnh.startsWith('http')) 
        ? item.HinhAnh 
        : (item.HinhAnh?.startsWith('/') ? `http://localhost:5000${item.HinhAnh}` : `http://localhost:5000/${item.HinhAnh}`);

      return `
        <div class="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 last:pb-0">
          <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img src="${imageUrl}" alt="${item.TenSP}" class="w-full h-full object-cover"
                 onerror="this.src='https://placehold.co/80?text=NT'">
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900">${item.TenSP}</h4>
            <div class="flex items-center gap-4 mt-1 text-sm">
              <span class="text-gray-500">SL: <span class="font-medium text-gray-900">${item.SoLuong}</span></span>
              <span class="font-semibold text-amber-600">${Number(item.DonGia).toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
          <div class="text-right hidden sm:block">
            <span class="font-bold text-gray-900">${(Number(item.DonGia) * item.SoLuong).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div class="border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-6 text-sm">
            <div>
              <p class="text-gray-500 mb-1">Mã đơn hàng</p>
              <p class="font-bold text-gray-900">#${order.MaDH}</p>
            </div>
            <div>
              <p class="text-gray-500 mb-1">Ngày đặt</p>
              <p class="font-semibold text-gray-900">${new Date(order.NgayDat).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p class="text-gray-500 mb-1">Tổng tiền</p>
              <p class="font-bold text-amber-600">${Number(order.TongTien).toLocaleString('vi-VN')}₫</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.cls} font-semibold text-sm">
            <i data-lucide="${cfg.icon}" class="w-4 h-4"></i>
            ${cfg.label}
          </div>
        </div>

        <div class="p-6">
          ${itemsHtml}
          <div class="mt-6 p-4 bg-gray-50 rounded-xl text-sm">
            <p class="font-semibold text-gray-900 mb-2">Thông tin giao hàng</p>
            <p class="text-gray-600">${order.DiaChiGH || '—'}</p>
          </div>
        </div>
      </div>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
});