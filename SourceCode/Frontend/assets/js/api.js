/**
 * api.js — Lớp trung gian giao tiếp với Backend API
 * Thay thế toàn bộ LocalStorage bằng fetch() tới Express server
 */

const API_BASE = 'http://localhost:5000/api';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('authToken') || null;
}

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
    ...options,
  };
  
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  if (config.body instanceof FormData) {
    // Không set Content-Type khi dùng FormData (browser tự set boundary)
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(url, config);
    
    // Đọc data dưới dạng text trước để tránh lỗi parse JSON
    const textData = await res.text();
    let data;
    try {
      data = textData ? JSON.parse(textData) : {}; // Cố gắng chuyển sang JSON nếu có data
    } catch (e) {
      data = { message: textData }; // Nếu không phải JSON (vd HTML lỗi), thì lấy text đó làm message
    }

    if (!res.ok) {
      throw { status: res.status, message: data.message || 'Lỗi không xác định từ Server', data };
    }
    return data;
    
  } catch (error) {
    // Nếu lỗi do mạng (Mất mạng, Server sập)
    if (!error.status) throw { status: 500, message: 'Lỗi kết nối đến máy chủ. Vui lòng kiểm tra Server.' };
    throw error; // Ném tiếp lỗi do Server trả về
  }
}

/* ─────────────────────────────────────────
   AUTH API
───────────────────────────────────────── */
const AuthAPI = {
  /** Đăng ký tài khoản mới */
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: payload }),

  /** Đăng nhập, trả về { token, user } */
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: payload }),

  /** Lấy thông tin tài khoản hiện tại */
  getMe: () =>
    request('/auth/me'),

  /** Cập nhật họ tên */
  updateProfile: (payload) =>
    request('/auth/profile', { method: 'PUT', body: payload }),

  /** Đổi mật khẩu */
  changePassword: (payload) =>
    request('/auth/change-password', { method: 'PUT', body: payload }),
};

/* ─────────────────────────────────────────
   PRODUCTS API
───────────────────────────────────────── */
const ProductAPI = {
  /**
   * Lấy danh sách sản phẩm
   * @param {Object} filters - { category, search, sort, minPrice, maxPrice }
   */
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search)   params.append('search',   filters.search);
    if (filters.sort)     params.append('sort',      filters.sort);
    if (filters.minPrice) params.append('minPrice',  filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice',  filters.maxPrice);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/products${qs}`);
  },

  /** Lấy chi tiết 1 sản phẩm */
  getById: (id) =>
    request(`/products/${id}`),

  /** Thêm sản phẩm mới (Admin) */
  create: (payload) =>
    request('/products', { method: 'POST', body: payload }),

  /** Cập nhật sản phẩm (Admin) */
  update: (id, payload) =>
    request(`/products/${id}`, { method: 'PUT', body: payload }),

  /** Xóa sản phẩm (Admin) */
  remove: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  /** Upload ảnh sản phẩm (Admin), trả về { imageUrl } */
  uploadImage: (formData) =>
    request('/products/upload-image', { method: 'POST', body: formData }),
};

/* ─────────────────────────────────────────
   CATEGORIES API
───────────────────────────────────────── */
const CategoryAPI = {
  getAll: () => request('/categories'),
};

/* ─────────────────────────────────────────
   CART API
───────────────────────────────────────── */
const CartAPI = {
  /** Lấy giỏ hàng của user đang đăng nhập */
  get: () =>
    request('/cart'),

  /** Thêm sản phẩm vào giỏ */
  add: (MaSP, SoLuong = 1) =>
    request('/cart', { method: 'POST', body: { MaSP, SoLuong } }),

  /** Cập nhật số lượng */
  update: (productId, SoLuong) =>
    request(`/cart/${productId}`, { method: 'PUT', body: { SoLuong } }),

  /** Xóa 1 sản phẩm */
  remove: (productId) =>
    request(`/cart/${productId}`, { method: 'DELETE' }),

  /** Xóa toàn bộ giỏ */
  clear: () =>
    request('/cart', { method: 'DELETE' }),
};

/* ─────────────────────────────────────────
   ORDERS API
───────────────────────────────────────── */
const OrderAPI = {
  /** Đặt hàng từ giỏ hàng */
  create: (payload) =>
    request('/orders', { method: 'POST', body: payload }),

  /** Lịch sử đơn hàng của user */
  getMy: () =>
    request('/orders/my'),

  /** Chi tiết 1 đơn hàng */
  getById: (id) =>
    request(`/orders/${id}`),

  /** Tất cả đơn hàng (Admin) */
  getAll: () =>
    request('/orders'),

  /** Cập nhật trạng thái (Admin) */
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: { status } }),

  /** Thống kê đơn hàng (Admin) */
  getStats: () =>
    request('/orders/stats'),
};

/* ─────────────────────────────────────────
   REVIEWS API
───────────────────────────────────────── */
const ReviewAPI = {
  /** Lấy đánh giá của sản phẩm (Đã thêm chống cache bằng timestamp) */
  getByProduct: (productId) => {
    const timestamp = new Date().getTime();
    return request(`/products/${productId}/reviews?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  },

  /** Gửi / cập nhật đánh giá */
  create: (productId, payload) =>
    request(`/products/${productId}/reviews`, { method: 'POST', body: payload }),

  /** Xóa đánh giá */
  remove: (productId) =>
    request(`/products/${productId}/reviews`, { method: 'DELETE' }),
};

/* ─────────────────────────────────────────
   USERS API (Admin)
───────────────────────────────────────── */
const UserAPI = {
  /** Lấy tất cả người dùng */
  getAll: () =>
    request('/users'),

  /**
   * Tìm kiếm người dùng
   * @param {Object} params - { keyword, role: 'admin'|'customer' }
   */
  search: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.keyword) qs.append('keyword', params.keyword);
    if (params.role)    qs.append('role',    params.role);
    if (params.sortBy)  qs.append('sortBy',  params.sortBy);  
    if (params.sortDir) qs.append('sortDir', params.sortDir);  
    return request(`/users/search?${qs.toString()}`);
  },

  /** Xóa tài khoản theo email */
  remove: (email) =>
    request(`/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
};

/* ─────────────────────────────────────────
   SESSION HELPERS
   Lưu / đọc token & user vào localStorage
───────────────────────────────────────── */
const Session = {
  save(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify({
      id:      user.MaND,
      name:    user.HoTen,
      email:   user.Email,
      isAdmin: user.isAdmin,
    }));
  },

  clear() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!getToken() && !!this.getUser();
  },
};