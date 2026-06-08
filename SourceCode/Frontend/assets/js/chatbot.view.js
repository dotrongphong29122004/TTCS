window.ChatbotView = (function () {
  'use strict';

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    // Trả về template cấu trúc HTML tổng thể
    getTemplate: function (botName, brand) {
      return `
        <button id="nt-chat-toggle" title="Tư vấn mua hàng">
          <span id="nt-unread-badge"></span>
          <svg id="nt-icon-chat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <svg id="nt-icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div id="nt-chat-window">
          <div id="nt-chat-header">
            <div class="nt-avatar">🛋️</div>
            <div class="nt-header-info">
              <div class="nt-header-name">${botName} — Tư vấn viên</div>
              <div class="nt-header-status"><span class="nt-status-dot"></span>Đang hoạt động · ${brand}</div>
            </div>
            <button id="nt-close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div id="nt-suggestions">
            <button class="nt-suggestion-btn" data-msg="Sofa phòng khách nào đẹp?">🛋️ Sofa phòng khách</button>
            <button class="nt-suggestion-btn" data-msg="Tư vấn bàn làm việc cho tôi">💼 Bàn làm việc</button>
            <button class="nt-suggestion-btn" data-msg="Sản phẩm nào đang giảm giá?">🏷️ Khuyến mãi</button>
            <button class="nt-suggestion-btn" data-msg="Tôi có ngân sách 5 triệu, gợi ý giúp tôi">💰 Theo ngân sách</button>
          </div>

          <div id="nt-messages"></div>

          <div id="nt-input-area">
            <textarea id="nt-input" placeholder="Nhập câu hỏi..." rows="1"></textarea>
            <button id="nt-send-btn" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>`;
    },

    // Khởi tạo dòng tin nhắn mới
    createMessageRow: function (text, role) {
      const row = document.createElement('div');
      row.className = `nt-msg-row ${role}`;
      const avatarHtml = role === 'bot' ? `<div class="nt-msg-avatar">🛋️</div>` : '';

      let html = escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1 →</a>');

      row.innerHTML = `${avatarHtml}<div class="nt-bubble ${role}">${html}</div>`;
      return row;
    },

    // Khởi tạo card sản phẩm
    createProductCard: function (p) {
      const imgUrl = (p.HinhAnh && p.HinhAnh.startsWith('http'))
        ? p.HinhAnh
        : (p.HinhAnh?.startsWith('/') ? `http://localhost:5000${p.HinhAnh}` : `http://localhost:5000/${p.HinhAnh}`);

      const wrapper = document.createElement('div');
      wrapper.className = 'nt-msg-row bot';
      wrapper.style.animation = 'nt-slide-in 0.22s ease-out';
      wrapper.innerHTML = `
        <div style="width:28px;flex-shrink:0"></div>
        <a href="product-detail.html?id=${p.MaSP}" class="nt-product-card">
          <img class="nt-product-img" src="${imgUrl}" alt="${p.TenSP}" onerror="this.src='https://placehold.co/52x52?text=NT'">
          <div class="nt-product-info">
            <div class="nt-product-name">${p.TenSP}</div>
            <div class="nt-product-price">${Number(p.GiaBan).toLocaleString('vi-VN')}₫</div>
            <div class="nt-product-cat">${p.DanhMuc || ''}</div>
          </div>
        </a>`;
      return wrapper;
    },

    // Khởi tạo dòng trạng thái bot đang gõ
    createTypingRow: function () {
      const row = document.createElement('div');
      row.className = 'nt-msg-row bot';
      row.id = 'nt-typing-row';
      row.innerHTML = `
        <div class="nt-msg-avatar">🛋️</div>
        <div class="nt-bubble bot" style="padding:0">
          <div class="nt-typing"><span></span><span></span><span></span></div>
        </div>`;
      return row;
    },

    // Khởi tạo phần hiển thị thời gian gửi
    createTimestamp: function () {
      const el = document.createElement('div');
      el.className = 'nt-timestamp';
      el.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return el;
    }
  };
})();