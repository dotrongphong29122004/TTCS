/**
 * pages/admin.js — Quản lý sản phẩm (Admin)
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra quyền đăng nhập
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    alert('Bạn không có quyền truy cập!');
    window.location.href = 'index.html';
    return;
  }

  // Load danh mục sản phẩm vào thẻ select
  try {
    const res = await CategoryAPI.getAll();
    const cats = res.data || [];
    const catSelect = document.getElementById('pCategory');
    if (catSelect && cats.length > 0) {
      catSelect.innerHTML = cats.map(c =>
        `<option value="${c.MaDM}">${c.TenDM}</option>`).join('');
    }
  } catch { 
    /* Giữ nguyên HTML options mặc định nếu lỗi */ 
  }

  await loadAdminProducts();
  initAdminForm();
});

let adminProducts = [];

// Hàm hỗ trợ: Tự động sửa lỗi link ảnh thiếu http://localhost:5000
function getFullImageUrl(path) {
  if (!path) return 'https://placehold.co/64?text=NT'; // Ảnh mặc định nếu không có
  if (path.startsWith('http')) return path; // Nếu đã có http thì giữ nguyên
  
  // Nối thêm địa chỉ Backend (Xử lý trường hợp có hoặc không có dấu gạch chéo ở đầu)
  return path.startsWith('/') ? `http://localhost:5000${path}` : `http://localhost:5000/${path}`;
}

/* ─── Load products ─── */
async function loadAdminProducts() {
  const tbody   = document.getElementById('adminProductsTable');
  const countEl = document.getElementById('totalProducts');
  const noMsgEl = document.getElementById('noProductsMsg');

  if (tbody) tbody.innerHTML = `
    <tr><td colspan="5" class="text-center py-8">
      <div class="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto"></div>
    </td></tr>`;

  try {
    const res   = await ProductAPI.getAll();
    adminProducts = res.data || [];
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">${err.message}</td></tr>`;
    return;
  }

  if (countEl) countEl.textContent = adminProducts.length;

  if (adminProducts.length === 0) {
    noMsgEl?.classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    return;
  }

  noMsgEl?.classList.add('hidden');
  renderProductTable(adminProducts);
}

function renderProductTable(products) {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  tbody.innerHTML = products.map(p => {
    const stock   = p.SLTon;
    let stockCls  = 'text-green-600';
    let stockText = stock;
    if (stock <= 0) { stockCls = 'text-red-600'; stockText = '0 (Hết hàng)'; }
    else if (stock < 10) stockCls = 'text-orange-600';

    // Xử lý link ảnh bằng hàm hỗ trợ
    const imageUrl = getFullImageUrl(p.HinhAnh);

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src="${imageUrl}" class="w-full h-full object-cover"
                   onerror="this.src='https://placehold.co/64?text=Lỗi_Ảnh'">
            </div>
            <p class="font-medium text-gray-900">${p.TenSP}</p>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-600">${p.DanhMuc || ''}</td>
        <td class="px-6 py-4">
          <span class="font-semibold text-amber-600">${Number(p.GiaBan).toLocaleString('vi-VN')}₫</span>
        </td>
        <td class="px-6 py-4">
          <span class="font-semibold ${stockCls}">${stockText}</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-end gap-2">
            <button onclick="editProduct(${p.MaSP})"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteProduct(${p.MaSP})"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ─── Form logic ─── */
function initAdminForm() {
  const modal     = document.getElementById('productFormModal');
  const form      = document.getElementById('productForm');
  const fileInput = document.getElementById('fileInput');

  /* Mở form Thêm mới */
  window.openForm = function () {
    form.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('modalTitle').textContent = 'Thêm Sản Phẩm Mới';
    document.getElementById('submitBtn').innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Thêm mới';
    
    // Reset ảnh
    document.getElementById('imagePreviewContainer')?.classList.add('hidden');
    document.getElementById('uploadArea')?.classList.remove('hidden');
    document.getElementById('pImage').value = '';
    document.getElementById('uploadStatus')?.classList.add('hidden'); 

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  /* Đóng form */
  window.closeForm = function () { 
    modal.classList.add('hidden'); 
  };

  /* Mở form Sửa sản phẩm */
  window.editProduct = function (id) {
    const p = adminProducts.find(x => x.MaSP === id);
    if (!p) return;
    
    document.getElementById('editProductId').value = p.MaSP;
    
    document.getElementById('pName').value         = p.TenSP;
    document.getElementById('pPrice').value        = p.GiaBan;
    document.getElementById('pOriginalPrice').value= p.GiaGoc || '';
    document.getElementById('pStock').value        = p.SLTon;
    
    if (document.getElementById('pDesc')) {
      document.getElementById('pDesc').value = p.MoTa || '';
    }

    const catSelect = document.getElementById('pCategory');
    if (catSelect) {
      const opt = [...catSelect.options].find(o => o.text === p.DanhMuc || o.value == p.MaDM);
      if (opt) catSelect.value = opt.value;
    }
    
    document.getElementById('pImage').value = p.HinhAnh || '';

    // Xử lý preview ảnh cũ (áp dụng hàm hỗ trợ link ảnh)
    const preview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const uploadArea = document.getElementById('uploadArea');
    const uploadStatus = document.getElementById('uploadStatus');

    if (preview && p.HinhAnh) { 
        preview.src = getFullImageUrl(p.HinhAnh); 
        previewContainer?.classList.remove('hidden'); 
        uploadArea?.classList.add('hidden');
    } else {
        previewContainer?.classList.add('hidden');
        uploadArea?.classList.remove('hidden');
    }
    uploadStatus?.classList.add('hidden');

    document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Sản Phẩm';
    document.getElementById('submitBtn').innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Cập nhật';
    modal.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  /* Xóa sản phẩm */
  window.deleteProduct = async function (id) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await ProductAPI.remove(id);
      if (typeof showToast === 'function') showToast('Đã xóa sản phẩm');
      await loadAdminProducts();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Xóa thất bại', 'error');
      else alert(err.message || 'Xóa thất bại');
    }
  };

  /* Xử lý Upload Ảnh */
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Hiển thị preview ngay lập tức từ file local
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById('imagePreview');
      const container = document.getElementById('imagePreviewContainer');
      if (img) img.src = ev.target.result;
      container?.classList.remove('hidden');
      document.getElementById('uploadArea')?.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    const statusEl = document.getElementById('uploadStatus');
    if (statusEl) { 
        statusEl.textContent = '⏳ Đang tải ảnh lên...'; 
        statusEl.className = 'text-xs mt-2 text-amber-600 block'; 
        statusEl.classList.remove('hidden'); 
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await ProductAPI.uploadImage(formData);
      
      // Backend trả về đường dẫn tương đối (vd: uploads/...)
      document.getElementById('pImage').value = res.imageUrl;
      
      if (statusEl) { 
          statusEl.textContent = '✅ Tải ảnh thành công!'; 
          statusEl.className = 'text-xs mt-2 text-green-600 block'; 
      }
    } catch (err) {
      if (statusEl) { 
          statusEl.textContent = '❌ ' + (err.message || 'Lỗi upload ảnh'); 
          statusEl.className = 'text-xs mt-2 text-red-600 block'; 
      }
    }
  });

  /* Xóa ảnh đang preview */
  window.removeImage = function () {
    document.getElementById('fileInput').value = '';
    document.getElementById('pImage').value    = '';
    document.getElementById('imagePreviewContainer')?.classList.add('hidden');
    document.getElementById('uploadArea')?.classList.remove('hidden');
    document.getElementById('uploadStatus')?.classList.add('hidden');
  };

  /* Submit Form (Thêm mới & Cập nhật) */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    
    const payload = {
      TenSP:   document.getElementById('pName').value,
      GiaBan:  parseFloat(document.getElementById('pPrice').value),
      GiaGoc:  document.getElementById('pOriginalPrice').value ? parseFloat(document.getElementById('pOriginalPrice').value) : null,
      MaDM:    parseInt(document.getElementById('pCategory').value),
      SLTon:   parseInt(document.getElementById('pStock').value),
      HinhAnh: document.getElementById('pImage').value, 
      MoTa:    document.getElementById('pDesc') ? document.getElementById('pDesc').value : '',
    };

    if (!payload.HinhAnh && !editId) {
        alert("Vui lòng tải lên hình ảnh sản phẩm!");
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true; 
    btn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Đang lưu...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      if (editId) {
        await ProductAPI.update(editId, payload);
        if (typeof showToast === 'function') showToast('Cập nhật sản phẩm thành công!');
      } else {
        await ProductAPI.create(payload);
        if (typeof showToast === 'function') showToast('Thêm sản phẩm thành công!');
      }
      closeForm();
      await loadAdminProducts();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Lưu thất bại', 'error');
      else alert(err.message || 'Lưu thất bại');
    } finally {
      btn.disabled = false;
      btn.innerHTML = editId
        ? '<i data-lucide="save" class="w-5 h-5"></i> Cập nhật'
        : '<i data-lucide="save" class="w-5 h-5"></i> Thêm mới';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
}