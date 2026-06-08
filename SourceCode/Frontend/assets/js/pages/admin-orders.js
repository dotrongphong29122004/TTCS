/**
 * pages/admin-orders.js — Quản lý đơn hàng (Admin)
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof isLoggedIn === 'function' && (!isLoggedIn() || !Session.getUser()?.isAdmin)) {
    alert('Bạn không có quyền truy cập!');
    window.location.href = 'index.html';
    return;
  }

  await loadStats();
  await loadAllOrders();

  document.getElementById('adminSearchInput')?.addEventListener('input', filterOrders);
  document.getElementById('adminStatusFilter')?.addEventListener('change', filterOrders);
});

let allOrders = [];

/* Stats */
async function loadStats() {
  try {
    const res = await OrderAPI.getStats();
    const d   = res.data;
    setEl('statTotal',      d.TongDonHang);
    setEl('statPending',    d.ChoXacNhan);
    setEl('statProcessing', d.DangXuLy);
    setEl('statRevenue',    (d.DoanhThu / 1_000_000).toFixed(1) + 'M');
    setEl('totalOrdersCountHeader', d.TongDonHang);
  } catch (err) {
    console.error('stats error', err);
  }
}

/* tải đơn */
async function loadAllOrders() {
  const listEl  = document.getElementById('adminOrdersList');
  const emptyEl = document.getElementById('adminEmptyOrders');

  if (listEl) listEl.innerHTML = `
    <div class="bg-white rounded-xl p-8 text-center animate-pulse">
      <div class="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-gray-500 mt-4">Đang tải đơn hàng...</p>
    </div>`;

  try {
    const res = await OrderAPI.getAll();
    allOrders = res.data || [];
    renderOrders(allOrders);
  } catch (err) {
    if (listEl) listEl.innerHTML = `<p class="text-red-500 text-center py-8">${err.message}</p>`;
  }
}

/* Filter */
function filterOrders() {
  const term   = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  const status = document.getElementById('adminStatusFilter')?.value || 'all';

  const filtered = allOrders.filter(o => {
    const matchSearch = String(o.MaDH).includes(term) ||
                        (o.TenKH || '').toLowerCase().includes(term) ||
                        (o.Email  || '').toLowerCase().includes(term);
    const matchStatus = status === 'all' || o.TrangThai === status;
    return matchSearch && matchStatus;
  });
  renderOrders(filtered);
}

/* Render */
const statusColorMap = {
  pending:    'text-yellow-600 bg-yellow-50 border-yellow-200',
  processing: 'text-blue-600 bg-blue-50 border-blue-200',
  completed:  'text-green-600 bg-green-50 border-green-200',
  cancelled:  'text-red-600 bg-red-50 border-red-200',
};
const statusLabelMap = { pending: 'Chờ xác nhận', processing: 'Đang xử lý', completed: 'Hoàn thành', cancelled: 'Đã hủy' };

function renderOrders(orders) {
  const listEl  = document.getElementById('adminOrdersList');
  const emptyEl = document.getElementById('adminEmptyOrders');
  setEl('totalOrdersCountHeader', allOrders.length);

  if (!orders.length) {
    listEl?.classList.add('hidden');
    emptyEl?.classList.remove('hidden');
    return;
  }
  listEl?.classList.remove('hidden');
  emptyEl?.classList.add('hidden');

  listEl.innerHTML = orders.map(order => {
    const colorClass = statusColorMap[order.TrangThai] || statusColorMap.pending;
    const itemsHtml  = (order.items || []).map(item => {
      const imageUrl = (item.HinhAnh && item.HinhAnh.startsWith('http')) 
        ? item.HinhAnh 
        : (item.HinhAnh?.startsWith('/') ? `http://localhost:5000${item.HinhAnh}` : `http://localhost:5000/${item.HinhAnh}`);

      return `
        <div class="flex gap-4 pb-3 border-b border-gray-100 last:border-0">
          <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img src="${imageUrl}" alt="${item.TenSP}" class="w-full h-full object-cover"
                 onerror="this.src='https://placehold.co/64?text=NT'">
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 text-sm mb-1">${item.TenSP}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span>SL: ${item.SoLuong}</span>
              <span class="font-semibold text-amber-600">${Number(item.DonGia).toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900">${(Number(item.DonGia) * item.SoLuong).toLocaleString('vi-VN')}₫</p>
          </div>
        </div>`;
    }).join('');

    const diaChi = order.DiaChiGH || '—';

    return `
      <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-6">
              <div>
                <p class="text-xs text-gray-500">Mã đơn hàng</p>
                <p class="font-semibold text-gray-900">#${order.MaDH}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Khách hàng</p>
                <p class="font-semibold text-gray-900">${order.TenKH || '—'}</p>
                <p class="text-xs text-gray-500">${order.Email || ''}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Ngày đặt</p>
                <p class="font-semibold text-gray-900">${new Date(order.NgayDat).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Tổng tiền</p>
                <p class="font-semibold text-amber-600">${Number(order.TongTien).toLocaleString('vi-VN')}₫</p>
              </div>
            </div>
            <select onchange="updateOrderStatus(${order.MaDH}, this.value)"
                    class="px-4 py-2 rounded-lg border font-semibold text-sm outline-none ${colorClass}">
              ${Object.entries(statusLabelMap).map(([val, lbl]) =>
                `<option value="${val}" ${order.TrangThai === val ? 'selected' : ''}>${lbl}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="p-6">
          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <h4 class="font-semibold text-gray-900 text-sm mb-4">Sản phẩm</h4>
              <div class="space-y-3">${itemsHtml}</div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 text-sm mb-4">Thông tin giao hàng</h4>
              <div class="bg-gray-50 rounded-lg p-4 text-sm">
                <p class="font-medium text-gray-900">${diaChi}</p>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* cập nhật status */
window.updateOrderStatus = async function (id, status) {
  try {
    await OrderAPI.updateStatus(id, status);
    // Cập nhật cache
    const order = allOrders.find(o => o.MaDH === id);
    if (order) order.TrangThai = status;
    await loadStats();
    filterOrders();
    if (typeof showToast === 'function') showToast('Cập nhật trạng thái thành công!');
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Cập nhật thất bại', 'error');
    else alert(err.message || 'Cập nhật thất bại');
    await loadAllOrders(); 
  }
};


function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}