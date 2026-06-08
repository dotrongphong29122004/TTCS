const defaultProducts = [
  { id: 1, name: 'Sofa Phòng Khách Cao Cấp', price: 12500000, originalPrice: 15000000, category: 'Phòng khách', stock: 15, sold: 125, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', rating: 5, reviews: 128, description: 'Chiếc sofa phòng khách cao cấp bọc nhung mềm mịn, mang lại cảm giác êm ái tuyệt đối. Thiết kế phong cách Bắc Âu hiện đại, khung gỗ tự nhiên chắc chắn, hứa hẹn sẽ là điểm nhấn sang trọng cho không gian sống của bạn.' },
  { id: 2, name: 'Giường Ngủ Hiện Đại', price: 8900000, originalPrice: null, category: 'Phòng ngủ', stock: 5, sold: 89, image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500', rating: 4.8, reviews: 85, description: 'Giường ngủ được chế tác từ gỗ công nghiệp MDF chống ẩm, phủ melamine chống trầy xước. Tích hợp ngăn kéo thông minh bên dưới giúp tối ưu không gian lưu trữ cho phòng ngủ của bạn.' },
  { id: 3, name: 'Bàn Ăn Gia Đình', price: 6200000, originalPrice: 8000000, category: 'Phòng ăn', stock: 0, sold: 210, image: 'https://images.unsplash.com/photo-1595514535175-9c5ae5231c5f?w=500', rating: 4.9, reviews: 200, description: 'Bộ bàn ăn gia đình dành cho 6 người với mặt bàn đá ceramic chống ố, chịu nhiệt cực tốt. Ghế bọc da PU cao cấp dễ dàng vệ sinh, mang lại bữa ăn ấm cúng và đẳng cấp.' },
  { id: 4, name: 'Bàn Làm Việc Gỗ Sồi', price: 4500000, originalPrice: null, category: 'Phòng làm việc', stock: 10, sold: 45, image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500', rating: 4.5, reviews: 45, description: 'Bàn làm việc với mặt bàn từ gỗ sồi tự nhiên, giữ nguyên vân gỗ tuyệt đẹp. Thiết kế tối giản, khung chân sắt sơn tĩnh điện vững chãi, tạo không gian làm việc chuyên nghiệp và tràn đầy cảm hứng.' },
  { id: 5, name: 'Tủ Quần Áo Đa Năng', price: 16000000, originalPrice: 18000000, category: 'Phòng ngủ', stock: 8, sold: 112, image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500', rating: 4.7, reviews: 112, description: 'Tủ quần áo cỡ lớn 4 cánh với thiết kế kịch trần, tối đa hóa sức chứa. Bên trong chia nhiều ngăn linh hoạt kết hợp thanh treo và hộc kéo âm tiện dụng.' },
  { id: 6, name: 'Ghế Thư Giãn Đọc Sách', price: 3200000, originalPrice: null, category: 'Phòng khách', stock: 20, sold: 178, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500', rating: 4.6, reviews: 67, description: 'Ghế bành thư giãn với form dáng cong công thái học, hỗ trợ nâng đỡ cột sống hoàn hảo. Lớp nệm mút đàn hồi cao, thích hợp để đọc sách, uống trà hay ngả lưng nghỉ ngơi.' }
];

function getProducts() {
  const stored = localStorage.getItem('productsData');
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem('productsData', JSON.stringify(defaultProducts));
  return defaultProducts;
}

function saveProducts(products) {
  localStorage.setItem('productsData', JSON.stringify(products));
}