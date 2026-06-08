(function (View) {
  'use strict';

  // ── CẤU HÌNH HỆ THỐNG ──
  const API_BASE   = 'http://localhost:5000/api';
  const BOT_NAME   = 'Nova';
  const BRAND      = 'NoiThat.vn';
  const GEMINI_API_KEY = 'AIzaSyDQzyWfY0I4q75FFPnZsr8K7TTJ2Gs4XZo'; 

  // ── BIẾN KHỞI TẠO NỘI BỘ ──
  let messages = [];       // Lưu lịch sử chat dạng phẳng [{role, content}]
  let products = [];       // Kho chứa dữ liệu sản phẩm từ backend
  let isOpen = false;      // Trạng thái đóng/mở cửa sổ chat
  let isTyping = false;    // Trạng thái bot đang gõ tin nhắn
  let productsLoaded = false;

  // Khởi tạo và inject cấu trúc khung chat từ Module View vào cuối body
  const root = document.createElement('div');
  root.id = 'nt-chatbot-root';
  root.innerHTML = View.getTemplate(BOT_NAME, BRAND);
  document.body.appendChild(root);

  // Tham chiếu các phần tử DOM (Lấy từ template vừa nhúng)
  const toggleBtn  = document.getElementById('nt-chat-toggle');
  const chatWindow = document.getElementById('nt-chat-window');
  const messagesEl = document.getElementById('nt-messages');
  const inputEl    = document.getElementById('nt-input');
  const sendBtn    = document.getElementById('nt-send-btn');
  const iconChat   = document.getElementById('nt-icon-chat');
  const iconClose  = document.getElementById('nt-icon-close');

  //  1. LOAD SẢN PHẨM TỪ BACKEND NODE.JS
  async function fetchProducts() {
    try {
      const res  = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      products = data.data || [];
      productsLoaded = true;
    } catch (e) {
      console.warn('[Chatbot] Chưa bật Server Backend hoặc lỗi kết nối. Chuyển sang chế độ AI thuần không kèm kho dữ liệu thực.');
      products = [];
      productsLoaded = true; // Đánh dấu true để không cố fetch lại liên tục gây treo máy
    }
  }

  //  2. XÂY DỰNG SYSTEM PROMPT (KỊCH BẢN CHO AI)
  function buildSystemPrompt() {
    const productList = products.length
      ? products.map(p => 
          `- ID:${p.MaSP} | "${p.TenSP}" | Danh mục: ${p.DanhMuc} | Giá: ${Number(p.GiaBan).toLocaleString('vi-VN')}₫ | Tồn kho: ${p.SLTon > 0 ? p.SLTon + ' cái' : 'HẾT HÀNG'}`
        ).join('\n')
      : 'Hiện tại hệ thống đang cập nhật kho, chưa tải được danh sách sản phẩm cụ thể.';

    return `Bạn là ${BOT_NAME}, tư vấn viên bán hàng thân thiện và chuyên nghiệp của ${BRAND} — cửa hàng nội thất cao cấp tại Việt Nam.

NHIỆM VỤ: Tư vấn khách hàng chọn sản phẩm nội thất phù hợp nhu cầu, ngân sách và sở thích của họ.

QUY TẮC QUAN TRỌNG:
- Luôn trả lời bằng tiếng Việt, lịch sự, dùng icon cảm xúc phù hợp.
- Chỉ giới thiệu sản phẩm CÒN HÀNG (SLTon > 0 hoặc có số lượng cụ thể).
- Khi gợi ý sản phẩm, dùng đúng tên và giá bán từ danh sách được cung cấp bên dưới.
- Khi muốn dẫn link đến sản phẩm, sử dụng định dạng bắt buộc sau: [Tên sản phẩm](product-detail.html?id=ID)
- Giữ câu trả lời ngắn gọn, tập trung vào giải pháp cho khách hàng (không quá 150 từ).
- Tuyệt đối không bịa đặt sản phẩm hoặc giá cả nếu nó không xuất hiện trong danh sách dưới đây.

DANH SÁCH SẢN PHẨM TRONG KHO HIỆN TẠI:
${productList}

Bắt đầu trò chuyện với khách hàng bằng sự nhiệt tình!`;
  }

  //  3. GỌI GOOGLE GEMINI API 
  async function callGemini(userMessage) {
    // Chuẩn bị kịch bản (System Instruction)
    const systemInstruction = buildSystemPrompt();
    // Đóng gói lịch sử hội thoại theo chuẩn cấu trúc dữ liệu của Google Gemini
    let contents = [];
    messages.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    // Thêm câu hỏi mới nhất của người dùng vào cuối mảng hội thoại
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Đồng thời lưu vào mảng dữ liệu lịch sử nội bộ của Client
    messages.push({ role: 'user', content: userMessage });

    // Endpoint gọi Model gemini-2.5-flash (tốc độ xử lý siêu tốc)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Gemini API lỗi ' + response.status);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể nói rõ hơn không?';
    
    // Lưu phản hồi của AI vào lịch sử nội bộ
    messages.push({ role: 'assistant', content: reply });
    return reply;
  }

  //  4. HIỂN THỊ TIN NHẮN LÊN GIAO DIỆN
  function renderMessage(text, role) {
    // Tạo bong bóng chat từ View Module
    const row = View.createMessageRow(text, role);
    messagesEl.appendChild(row);

    // Nếu là Bot trả lời, quét tìm xem có sản phẩm nào được nhắc tên để render Card Sản Phẩm kèm theo
    if (role === 'bot' && products.length > 0) {
      products.filter(p => p.SLTon > 0 && text.toLowerCase().includes(p.TenSP.toLowerCase()))
              .slice(0, 3)
              .forEach(p => {
                messagesEl.appendChild(View.createProductCard(p));
              });
    }
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
  }

  //  5. XỬ LÝ SỰ KIỆN GỬI TIN NHẮN
  async function sendMessage(text) {
    text = (text || inputEl.value).trim();
    if (!text || isTyping) return;

    // Reset khung nhập liệu về ban đầu
    inputEl.value = ''; 
    inputEl.style.height = 'auto'; 
    sendBtn.disabled = true;

    // Hiển thị tin nhắn của User lên màn hình khung chat
    renderMessage(text, 'user');
    messagesEl.appendChild(View.createTimestamp());

    isTyping = true;
    // Hiển thị hiệu ứng ba dấu chấm nhấp nháy (Bot đang gõ...)
    messagesEl.appendChild(View.createTypingRow());
    scrollToBottom();

    try {
      // Gọi fetch sản phẩm ngầm, nếu backend chưa bật thì khối lệnh catch trong hàm fetchProducts đã tự xử lý gọn gàng
      if (!productsLoaded) await fetchProducts();
      
      // Tiến hành gọi API Gemini lấy câu trả lời
      const reply = await callGemini(text);
      
      // Xóa bỏ hiệu ứng đang gõ và render câu trả lời thực tế của AI
      document.getElementById('nt-typing-row')?.remove();
      renderMessage(reply, 'bot');
    } catch (err) {
      document.getElementById('nt-typing-row')?.remove();
      renderMessage('Xin lỗi bạn, kết nối của mình tới hệ thống AI đang bị gián đoạn. Bạn thử lại sau ít phút nhé! 🙏', 'bot');
      console.error('[Chatbot Error]:', err.message);
    } finally {
      isTyping = false;
      sendBtn.disabled = inputEl.value.trim() === '';
    }
  }

  //  6. QUẢN LÝ ĐÓNG / MỞ KHUNG CHAT
  function openChat() {
    isOpen = true; 
    chatWindow.classList.add('open');
    iconChat.style.display = 'none'; 
    iconClose.style.display = 'block';
    inputEl.focus();

    // Nếu chưa từng nhắn tin (lần đầu mở chat), chạy kịch bản chào mừng tự động
    if (messages.length === 0) {
      setTimeout(async () => {
        if (!productsLoaded) await fetchProducts();
        messagesEl.appendChild(View.createTypingRow());
        scrollToBottom();
        
        setTimeout(() => {
          document.getElementById('nt-typing-row')?.remove();
          renderMessage(`Xin chào! 👋 Mình là **${BOT_NAME}**, tư vấn viên thông minh của **${BRAND}**.\n\nMình có thể giúp bạn tìm kiếm các sản phẩm giường, tủ, sofa phù hợp với nhu cầu và ngân sách phòng. Bạn cần mình hỗ trợ gì hôm nay? 🛋️`, 'bot');
        }, 800);
      }, 200);
    }
  }

  function closeChat() {
    isOpen = false; 
    chatWindow.classList.remove('open');
    iconChat.style.display = 'block'; 
    iconClose.style.display = 'none';
  }

  //  7. LẮNG NGHE SỰ KIỆN GIAO DIỆN (LISTENERS)
  toggleBtn.addEventListener('click', () => { isOpen ? closeChat() : openChat(); });
  document.getElementById('nt-close-btn').addEventListener('click', closeChat);
  
  // Sự kiện khi bấm vào các nút gợi ý nhanh (Sofa, Bàn làm việc...)
  document.querySelectorAll('.nt-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!isOpen) openChat();
      setTimeout(() => sendMessage(btn.dataset.msg), isOpen ? 0 : 400);
    });
  });

  // Tự động giãn nở chiều cao của ô nhập liệu (Textarea) khi gõ văn bản dài
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + 'px';
    sendBtn.disabled = inputEl.value.trim() === '';
  });

  // Sự kiện bắt phím: Bấm Enter là gửi, Bấm tổ hợp Shift + Enter để xuống dòng
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      if (!sendBtn.disabled) sendMessage(); 
    }
  });

  sendBtn.addEventListener('click', () => sendMessage());
  
  // Tải danh sách sản phẩm từ database lên bộ nhớ đệm ngay khi trang web vừa load xong
  fetchProducts();

})(window.ChatbotView);