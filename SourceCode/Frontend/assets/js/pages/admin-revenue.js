/**
 * pages/admin-revenue.js — Báo cáo doanh thu Admin
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra quyền Admin
  if (!isLoggedIn() || !Session.getUser()?.isAdmin) {
    alert('Bạn không có quyền truy cập!');
    window.location.href = 'index.html';
    return;
  }

  // Hiển thị thời gian cập nhật
  updateLastUpdated();

  // Tạo year picker
  buildYearPicker();

  // Load tất cả data
  await Promise.all([
    loadOverview(),
    loadWeekData(),
    loadTopCustomers(),
    loadTopProducts(),
  ]);

  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
let currentTab  = 'week';
let chartInstance = null;
let weekData  = [];
let monthData = [];
let yearData  = [];
let selectedYear = new Date().getFullYear();

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function fmtMoney(val) {
  const v = Number(val) || 0;
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' Tỷ';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' Tr';
  return v.toLocaleString('vi-VN') + '₫';
}
function fmtFull(val) {
  return Number(val || 0).toLocaleString('vi-VN') + '₫';
}
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = 'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN');
}

// ══════════════════════════════════════════
//  REFRESH
// ══════════════════════════════════════════
window.refreshAll = async function () {
  const icon = document.getElementById('refreshIcon');
  icon?.classList.add('animate-spin');
  await Promise.all([loadOverview(), loadCurrentTab(), loadTopCustomers(), loadTopProducts()]);
  icon?.classList.remove('animate-spin');
  updateLastUpdated();
};

// ══════════════════════════════════════════
//  OVERVIEW KPI
// ══════════════════════════════════════════
async function loadOverview() {
  try {
    const res = await request('/orders/revenue/overview');
    const d   = res.data;

    setEl('kpiThangNay', fmtMoney(d.DoanhThuThangNay));
    setEl('kpiDonThang', d.DonThangNay + ' đơn hàng');
    setEl('kpiNamNay',   fmtMoney(d.DoanhThuNamNay));
    setEl('kpiDonNam',   d.DonNamNay + ' đơn hàng');
    setEl('kpiTongDT',   fmtMoney(d.TongDoanhThu));
    setEl('kpiTongDon',  d.TongDon + ' đơn hoàn thành');
    setEl('kpiKhach',    d.TongKhachHang + ' khách');

    const avgOrder = d.TongDon > 0
      ? fmtMoney(d.TongDoanhThu / d.TongDon)
      : '—';
    setEl('kpiAvgOrder', 'Trung bình ' + avgOrder + ' / đơn');

    // Trend tháng này vs tháng trước
    const trendEl = document.getElementById('trendThang');
    if (trendEl) {
      if (d.DoanhThuThangTruoc > 0) {
        const pct = ((d.DoanhThuThangNay - d.DoanhThuThangTruoc) / d.DoanhThuThangTruoc * 100).toFixed(1);
        const up  = pct >= 0;
        trendEl.textContent = (up ? '↑ +' : '↓ ') + pct + '%';
        trendEl.className   = 'text-xs font-semibold px-2 py-1 rounded-full ' +
          (up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500');
      } else {
        trendEl.textContent = 'Tháng đầu';
      }
    }
  } catch (err) {
    console.error('overview error', err);
  }
}

// ══════════════════════════════════════════
//  WEEK DATA
// ══════════════════════════════════════════
async function loadWeekData() {
  try {
    const res = await request('/orders/revenue/week');
    weekData  = (res.data || []).reverse(); // Sắp xếp cũ → mới
    renderChart(weekData, 'week');
    renderTable(weekData, 'week');
  } catch (err) {
    console.error('week error', err);
    showChartError();
  }
}

// ══════════════════════════════════════════
//  MONTH DATA
// ══════════════════════════════════════════
async function loadMonthData(year) {
  try {
    const res  = await request(`/orders/revenue/month?year=${year}`);
    monthData  = res.data || [];
    renderChart(monthData, 'month');
    renderTable(monthData, 'month');
  } catch (err) {
    console.error('month error', err);
    showChartError();
  }
}

// ══════════════════════════════════════════
//  YEAR DATA
// ══════════════════════════════════════════
async function loadYearData() {
  try {
    const res = await request('/orders/revenue/year');
    yearData  = (res.data || []).reverse(); // cũ → mới
    renderChart(yearData, 'year');
    renderTable(yearData, 'year');
  } catch (err) {
    console.error('year error', err);
    showChartError();
  }
}

// ══════════════════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════════════════
window.switchTab = async function (tab, btn) {
  currentTab = tab;

  // Update tab styles
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-gray-500');
  });
  btn.classList.add('active');
  btn.classList.remove('text-gray-500');

  // Year picker visibility
  const yearWrap = document.getElementById('yearPickerWrap');
  if (tab === 'month') {
    yearWrap.classList.remove('hidden');
    yearWrap.classList.add('flex');
  } else {
    yearWrap.classList.add('hidden');
    yearWrap.classList.remove('flex');
  }

  await loadCurrentTab();
};

async function loadCurrentTab() {
  if (currentTab === 'week')  await loadWeekData();
  if (currentTab === 'month') await loadMonthData(selectedYear);
  if (currentTab === 'year')  await loadYearData();
}

// ══════════════════════════════════════════
//  YEAR PICKER
// ══════════════════════════════════════════
function buildYearPicker() {
  const wrap  = document.getElementById('yearPicker');
  const curY  = new Date().getFullYear();
  const years = [curY - 2, curY - 1, curY];
  wrap.innerHTML = years.map(y => `
    <button class="year-btn ${y === selectedYear ? 'active' : ''} text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600"
            onclick="selectYear(${y}, this)">${y}</button>
  `).join('');
}

window.selectYear = async function (year, btn) {
  selectedYear = year;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await loadMonthData(year);
};

// ══════════════════════════════════════════
//  CHART RENDER
// ══════════════════════════════════════════
function renderChart(data, type) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  let labels = [];
  let revenues = [];
  let orders   = [];

  if (type === 'week') {
    data.forEach(d => {
      const from = new Date(d.TuNgay);
      labels.push(`T${from.getDate()}/${from.getMonth() + 1}`);
      revenues.push(Number(d.DoanhThu) / 1_000_000);
      orders.push(Number(d.SoDonHang));
    });
  } else if (type === 'month') {
    const monthNames = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
    data.forEach(d => {
      labels.push(monthNames[d.Thang - 1]);
      revenues.push(Number(d.DoanhThu) / 1_000_000);
      orders.push(Number(d.SoDonHang));
    });
  } else {
    data.forEach(d => {
      labels.push(String(d.Nam));
      revenues.push(Number(d.DoanhThu) / 1_000_000);
      orders.push(Number(d.SoDonHang));
    });
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Doanh thu (Triệu ₫)',
          data: revenues,
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          borderColor: '#d97706',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: 'Số đơn hàng',
          data: orders,
          type: 'line',
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { family: 'Be Vietnam Pro', size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.datasetIndex === 0)
                return ' Doanh thu: ' + (ctx.parsed.y).toFixed(1) + ' Tr₫';
              return ' Đơn hàng: ' + ctx.parsed.y;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Be Vietnam Pro', size: 11 } },
        },
        y: {
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { family: 'Be Vietnam Pro', size: 11 },
            callback: v => v + ' Tr',
          },
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            font: { family: 'Be Vietnam Pro', size: 11 },
            stepSize: 1,
          },
        },
      },
    },
  });
}

function showChartError() {
  const ctx = document.getElementById('revenueChart');
  if (ctx) {
    const parent = ctx.parentElement;
    parent.innerHTML = `<div class="h-full flex items-center justify-center text-gray-400">
      <div class="text-center">
        <i data-lucide="wifi-off" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
        <p>Không thể tải dữ liệu biểu đồ</p>
      </div>
    </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ══════════════════════════════════════════
//  TABLE RENDER
// ══════════════════════════════════════════
function renderTable(data, type) {
  const tbody    = document.getElementById('revenueTable');
  const thPeriod = document.getElementById('thPeriod');
  const tableLabel = document.getElementById('tableLabel');

  if (!tbody) return;

  // Cập nhật header cột đầu và label
  if (type === 'week') {
    if (thPeriod) thPeriod.textContent = 'Tuần';
    if (tableLabel) tableLabel.textContent = '12 tuần gần nhất';
  } else if (type === 'month') {
    if (thPeriod) thPeriod.textContent = 'Tháng';
    if (tableLabel) tableLabel.textContent = `Năm ${selectedYear}`;
  } else {
    if (thPeriod) thPeriod.textContent = 'Năm';
    if (tableLabel) tableLabel.textContent = 'Tất cả các năm';
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-gray-400">Chưa có dữ liệu</td></tr>`;
    return;
  }

  // Tìm max doanh thu để vẽ progress bar
  const maxDT = Math.max(...data.map(d => Number(d.DoanhThu)), 1);

  tbody.innerHTML = data.map((d, idx) => {
    let period = '';
    if (type === 'week') {
      const from = new Date(d.TuNgay);
      const to   = new Date(d.DenNgay);
      period = `Tuần ${d.Tuan}<br><span class="text-xs text-gray-400 font-normal">
        ${from.toLocaleDateString('vi-VN')} – ${to.toLocaleDateString('vi-VN')}</span>`;
    } else if (type === 'month') {
      const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                          'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
      period = monthNames[d.Thang - 1];
    } else {
      period = `Năm ${d.Nam}`;
    }

    const dt  = Number(d.DoanhThu);
    const pct = Math.round((dt / maxDT) * 100);
    const isCurrentPeriod = checkCurrentPeriod(d, type);

    return `
      <tr class="hover:bg-amber-50/30 transition-colors ${isCurrentPeriod ? 'bg-amber-50/50' : ''}">
        <td class="px-6 py-3.5">
          <div class="font-medium text-gray-900 text-sm">${period}</div>
          ${isCurrentPeriod ? '<span class="text-xs text-amber-600 font-semibold">● Hiện tại</span>' : ''}
        </td>
        <td class="px-6 py-3.5 text-right">
          <div class="font-bold text-gray-900">${fmtMoney(dt)}</div>
          <div class="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-amber-500 h-1.5 rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </td>
        <td class="px-6 py-3.5 text-center">
          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
            ${d.DonHoanThanh || 0}
          </span>
        </td>
        <td class="px-6 py-3.5 text-center">
          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${(d.DonHuy || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}">
            ${d.DonHuy || 0}
          </span>
        </td>
        <td class="px-6 py-3.5 text-center">
          <span class="font-semibold text-gray-700">${d.SoDonHang || 0}</span>
        </td>
      </tr>`;
  }).join('');
}

function checkCurrentPeriod(d, type) {
  const now = new Date();
  if (type === 'week') {
    const from = new Date(d.TuNgay);
    const to   = new Date(d.DenNgay);
    return now >= from && now <= to;
  }
  if (type === 'month') return d.Thang === now.getMonth() + 1 && d.Nam === now.getFullYear();
  if (type === 'year')  return d.Nam === now.getFullYear();
  return false;
}

// ══════════════════════════════════════════
//  TOP CUSTOMERS
// ══════════════════════════════════════════
async function loadTopCustomers() {
  const limit  = document.getElementById('topLimit')?.value || 10;
  const listEl = document.getElementById('topCustomersList');
  if (!listEl) return;

  listEl.innerHTML = `<div class="py-8 text-center">
    <div class="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
  </div>`;

  try {
    const res  = await request(`/orders/revenue/top-customers?limit=${limit}`);
    const list = res.data || [];

    if (!list.length) {
      listEl.innerHTML = `<div class="py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>`;
      return;
    }

    const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
    const medalIcons  = ['🥇', '🥈', '🥉'];

    listEl.innerHTML = list.map((c, i) => {
      const initials = (c.HoTen || 'K').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
      const bgColors = ['bg-yellow-100 text-yellow-700','bg-gray-100 text-gray-600','bg-amber-100 text-amber-700'];
      const avatarBg = bgColors[i] || 'bg-blue-100 text-blue-600';
      const medal    = i < 3 ? medalIcons[i] : `#${i + 1}`;

      return `
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
             title="Chi tiêu: ${fmtFull(c.TongChiTieu)}">
          <div class="w-5 text-center text-sm font-bold text-gray-400">${medal}</div>
          <div class="w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center font-bold text-sm flex-shrink-0">
            ${initials}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 text-sm truncate">${c.HoTen || '—'}</p>
            <p class="text-xs text-gray-400 truncate">${c.Email || ''}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-green-600 font-medium">${c.DonHoanThanh} đơn HT</span>
              ${c.DonHuy > 0 ? `<span class="text-xs text-red-400">${c.DonHuy} hủy</span>` : ''}
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-bold text-amber-600 text-sm">${fmtMoney(c.TongChiTieu)}</p>
            <p class="text-xs text-gray-400">${c.TongDon} đơn</p>
            ${c.LanMuaCuoi ? `<p class="text-xs text-gray-300 mt-0.5">${new Date(c.LanMuaCuoi).toLocaleDateString('vi-VN')}</p>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="py-8 text-center text-red-400 text-sm">${err.message || 'Lỗi tải dữ liệu'}</div>`;
  }
}
window.loadTopCustomers = loadTopCustomers;

// ══════════════════════════════════════════
//  TOP PRODUCTS
// ══════════════════════════════════════════
let productChartInstance = null;

async function loadTopProducts() {
  const limit    = document.getElementById('productLimit')?.value || 10;
  const category = document.getElementById('productCategoryFilter')?.value || '';
  const listEl   = document.getElementById('topProductsList');
  if (!listEl) return;

  listEl.innerHTML = `<div class="py-8 text-center">
    <div class="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
  </div>`;

  try {
    const qs  = new URLSearchParams({ limit });
    if (category) qs.append('category', category);
    const res  = await request(`/orders/revenue/top-products?${qs}`);
    const list = res.data || [];

    // ── Cập nhật footer thống kê ──
    const totalSold = list.reduce((s, p) => s + (Number(p.SoLuongBan) || 0), 0);
    setEl('productStatTotal', list.length + ' sản phẩm');
    setEl('productStatBest',  list[0]?.TenSP || '—');
    setEl('productStatSold',  totalSold.toLocaleString('vi-VN') + ' lượt');

    if (!list.length) {
      listEl.innerHTML = `<div class="py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu bán hàng</div>`;
      clearProductChart();
      return;
    }

    // ── Render biểu đồ ──
    renderProductChart(list);

    // ── Render bảng xếp hạng ──
    const maxDT    = Math.max(...list.map(p => Number(p.DoanhThu)), 1);
    const medals   = ['🥇', '🥈', '🥉'];
    const rankCls  = ['prod-rank-1', 'prod-rank-2', 'prod-rank-3'];

    listEl.innerHTML = list.map((p, i) => {
      const dt  = Number(p.DoanhThu);
      const pct = Math.round((dt / maxDT) * 100);
      const rank = i < 3
        ? `<span class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankCls[i]}">${medals[i]}</span>`
        : `<span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-100 text-gray-500">${i + 1}</span>`;

      // Tạo màu sắc khác nhau theo danh mục
      const catColors = {
        'Phòng khách':    'bg-blue-100 text-blue-700',
        'Phòng ngủ':      'bg-purple-100 text-purple-700',
        'Phòng ăn':       'bg-green-100 text-green-700',
        'Phòng làm việc': 'bg-orange-100 text-orange-700',
      };
      const catCls = catColors[p.DanhMuc] || 'bg-gray-100 text-gray-600';

      return `
        <div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/40 transition-colors group">
          ${rank}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-semibold text-gray-900 text-sm truncate">${p.TenSP}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-1.5 py-0.5 rounded font-medium ${catCls}">${p.DanhMuc || '—'}</span>
              <span class="text-xs text-gray-400">Bán: <span class="font-semibold text-gray-600">${Number(p.SoLuongBan).toLocaleString()}</span></span>
              <span class="text-xs text-gray-400">${Number(p.SoDon)} đơn</span>
            </div>
            <div class="mt-1.5 w-full bg-gray-100 rounded-full h-1">
              <div class="bg-gradient-to-r from-orange-400 to-amber-500 h-1 rounded-full" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-bold text-orange-600 text-sm">${fmtMoney(dt)}</p>
            <p class="text-xs text-gray-400">${fmtMoney(p.GiaBan)}/sp</p>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('top products error', err);
    document.getElementById('topProductsList').innerHTML =
      `<div class="py-8 text-center text-red-400 text-sm">${err.message || 'Lỗi tải dữ liệu'}</div>`;
    clearProductChart();
  }
}
window.loadTopProducts = loadTopProducts;

function renderProductChart(list) {
  const ctx = document.getElementById('productChart');
  if (!ctx) return;

  if (productChartInstance) {
    productChartInstance.destroy();
    productChartInstance = null;
  }

  // Lấy tối đa 10 sp cho chart
  const chartData = list.slice(0, 10);

  // Màu gradient theo thứ hạng
  const colors = chartData.map((_, i) => {
    const alpha = 1 - (i / chartData.length) * 0.5;
    return `rgba(249, 115, 22, ${alpha})`;
  });
  const borderColors = chartData.map((_, i) => {
    const alpha = 1 - (i / chartData.length) * 0.3;
    return `rgba(234, 88, 12, ${alpha})`;
  });

  productChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(p => {
        // Rút gọn tên sản phẩm nếu quá dài
        const name = p.TenSP || '';
        return name.length > 20 ? name.slice(0, 18) + '…' : name;
      }),
      datasets: [
        {
          label: 'Doanh thu (Tr₫)',
          data: chartData.map(p => (Number(p.DoanhThu) / 1_000_000).toFixed(2)),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',   // Horizontal bar
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const p = chartData[ctx.dataIndex];
              return [
                ` Doanh thu: ${fmtMoney(p.DoanhThu)}`,
                ` Đã bán: ${Number(p.SoLuongBan).toLocaleString()} sp`,
                ` Số đơn: ${Number(p.SoDon)} đơn`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { family: 'Be Vietnam Pro', size: 10 },
            callback: v => v + ' Tr',
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Be Vietnam Pro', size: 11 },
          },
        },
      },
    },
  });
}

function clearProductChart() {
  if (productChartInstance) {
    productChartInstance.destroy();
    productChartInstance = null;
  }
  const ctx = document.getElementById('productChart');
  if (ctx) {
    const parent = ctx.parentElement;
    parent.innerHTML = `<div class="h-full flex items-center justify-center text-gray-300 text-sm">
      <div class="text-center">
        <i data-lucide="bar-chart-horizontal" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
        <p>Chưa có dữ liệu</p>
      </div>
    </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ══════════════════════════════════════════
//  INTERNAL request helper
//  (dùng lại hàm request đã có trong api.js)
// ══════════════════════════════════════════
function request(endpoint, options = {}) {
  const API_BASE = 'http://localhost:5000/api';
  const token    = localStorage.getItem('authToken');
  return fetch(API_BASE + endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw { status: r.status, message: data.message || 'Lỗi server' };
    return data;
  });
}