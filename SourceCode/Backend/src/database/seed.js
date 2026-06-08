/**
 * Seed: Chèn dữ liệu mẫu đầy đủ để test
 * Chạy: node src/database/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, query, sql, closeDB } = require('../../config/db');

const seed = async () => {
  console.log('🌱 Bắt đầu seed dữ liệu...\n');

  // 1. VaiTro
  await query(`
    IF NOT EXISTS (SELECT 1 FROM VaiTro WHERE TenVT = N'Admin')
    INSERT INTO VaiTro (TenVT) VALUES (N'Admin'), (N'Khách hàng')
  `);
  console.log('✅ VaiTro (2 vai trò)');

  // 2. NguoiDung — 1 admin + 5 khách
  const adminHash = await bcrypt.hash('admin123', 10);
  const passHash  = await bcrypt.hash('123456', 10);

  const users = [
    { hoTen: 'Quản Trị Viên',    email: 'admin@gmail.com',       pass: adminHash, sdt: '0900000000', vaiTro: 1 },
    { hoTen: 'Nguyễn Văn An',    email: 'nguyenvanan@gmail.com',  pass: passHash,  sdt: '0901111111', vaiTro: 2 },
    { hoTen: 'Trần Thị Bích',    email: 'tranthibich@gmail.com',  pass: passHash,  sdt: '0902222222', vaiTro: 2 },
    { hoTen: 'Lê Minh Tuấn',     email: 'leminhtuan@gmail.com',   pass: passHash,  sdt: '0903333333', vaiTro: 2 },
    { hoTen: 'Phạm Thu Hương',   email: 'phamthuhuong@gmail.com', pass: passHash,  sdt: '0904444444', vaiTro: 2 },
    { hoTen: 'Hoàng Văn Dũng',   email: 'hoangvandung@gmail.com', pass: passHash,  sdt: '0905555555', vaiTro: 2 },
  ];

  for (const u of users) {
    await query(`
      IF NOT EXISTS (SELECT 1 FROM NguoiDung WHERE Email = @email)
      INSERT INTO NguoiDung (HoTen, Email, MatKhau, SDT, MaVaiTro)
      VALUES (@hoTen, @email, @pass, @sdt, @vaiTro)
    `, {
      hoTen:  { type: sql.NVarChar(100), value: u.hoTen },
      email:  { type: sql.NVarChar(100), value: u.email },
      pass:   { type: sql.NVarChar(255), value: u.pass },
      sdt:    { type: sql.NVarChar(20),  value: u.sdt },
      vaiTro: { type: sql.Int,           value: u.vaiTro },
    });
  }
  console.log('✅ NguoiDung (1 admin + 5 khách hàng)');

  // 3. DanhMuc
  await query(`
    IF NOT EXISTS (SELECT 1 FROM DanhMuc WHERE TenDM = N'Phòng khách')
    INSERT INTO DanhMuc (TenDM, MoTa) VALUES
      (N'Phòng khách',    N'Sofa, bàn trà, kệ TV, ghế thư giãn...'),
      (N'Phòng ngủ',      N'Giường, tủ quần áo, bàn trang điểm...'),
      (N'Phòng ăn',       N'Bàn ăn, ghế ăn, tủ bếp, kệ bát...'),
      (N'Phòng làm việc', N'Bàn làm việc, ghế văn phòng, kệ sách...')
  `);
  console.log('✅ DanhMuc (4 danh mục)');

  // 4. SanPham — 16 sản phẩm
  const products = [
    { ten: 'Sofa Phòng Khách Cao Cấp',   gia: 12500000, giaGoc: 15000000, ton: 15, dm: 1, anh: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',      moTa: 'Sofa bọc nhung mềm mịn, khung gỗ tự nhiên chắc chắn, phong cách Bắc Âu hiện đại.' },
    { ten: 'Ghế Thư Giãn Đọc Sách',      gia: 3200000,  giaGoc: null,     ton: 20, dm: 1, anh: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500',      moTa: 'Form dáng cong công thái học, nệm mút đàn hồi cao.' },
    { ten: 'Bàn Trà Gỗ Tự Nhiên',        gia: 2800000,  giaGoc: 3500000,  ton: 12, dm: 1, anh: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=500',      moTa: 'Mặt gỗ sồi, chân kim loại sơn đen, thiết kế tối giản hiện đại.' },
    { ten: 'Kệ TV Thông Minh',            gia: 4200000,  giaGoc: 5000000,  ton: 8,  dm: 1, anh: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500',      moTa: 'Kệ TV 1m6 với ngăn chứa đồ tiện lợi, màu trắng sáng.' },
    { ten: 'Sofa Góc Chữ L',              gia: 18900000, giaGoc: 22000000, ton: 5,  dm: 1, anh: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',      moTa: 'Sofa góc 5 chỗ ngồi, bọc da PU cao cấp, màu xám thanh lịch.' },
    { ten: 'Giường Ngủ Hiện Đại',         gia: 8900000,  giaGoc: null,     ton: 5,  dm: 2, anh: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500',      moTa: 'Gỗ MDF chống ẩm, tích hợp ngăn kéo thông minh bên dưới.' },
    { ten: 'Tủ Quần Áo Đa Năng',          gia: 16000000, giaGoc: 18000000, ton: 8,  dm: 2, anh: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500',      moTa: 'Tủ 4 cánh kịch trần, nhiều ngăn linh hoạt, thanh treo và hộc kéo.' },
    { ten: 'Bàn Trang Điểm Gương LED',    gia: 5600000,  giaGoc: 6800000,  ton: 10, dm: 2, anh: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=500',      moTa: 'Gương LED 3 mặt, ngăn kéo đựng mỹ phẩm tiện lợi.' },
    { ten: 'Đầu Giường Bọc Nhung',        gia: 2100000,  giaGoc: null,     ton: 18, dm: 2, anh: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500',      moTa: 'Bọc nhung màu xanh navy, tạo điểm nhấn sang trọng.' },
    { ten: 'Bàn Ăn Gia Đình 6 Người',     gia: 6200000,  giaGoc: 8000000,  ton: 0,  dm: 3, anh: 'https://images.unsplash.com/photo-1595514535175-9c5ae5231c5f?w=500',      moTa: 'Mặt đá ceramic chống ố, ghế bọc da PU cao cấp, 6 người.' },
    { ten: 'Ghế Ăn Bọc Da Cao Cấp',       gia: 1200000,  giaGoc: 1500000,  ton: 30, dm: 3, anh: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=500',      moTa: 'Khung gỗ sồi, bọc da PU chống thấm, dễ vệ sinh.' },
    { ten: 'Tủ Bếp Chữ L Hiện Đại',       gia: 24500000, giaGoc: 28000000, ton: 3,  dm: 3, anh: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',      moTa: 'Cánh tủ phủ Acrylic bóng, tay nắm ẩn tinh tế.' },
    { ten: 'Bàn Ăn Mặt Đá Marble',        gia: 9800000,  giaGoc: 12000000, ton: 6,  dm: 3, anh: 'https://images.unsplash.com/photo-1595514535175-9c5ae5231c5f?w=500',      moTa: 'Đá marble tự nhiên vân trắng, chân inox mờ sang trọng.' },
    { ten: 'Bàn Làm Việc Gỗ Sồi',         gia: 4500000,  giaGoc: null,     ton: 10, dm: 4, anh: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',      moTa: 'Mặt gỗ sồi tự nhiên, khung chân sắt sơn tĩnh điện.' },
    { ten: 'Ghế Văn Phòng Công Thái Học', gia: 6800000,  giaGoc: 8000000,  ton: 15, dm: 4, anh: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',      moTa: 'Tựa lưng lưới thoáng khí, điều chỉnh độ cao và góc ngả.' },
    { ten: 'Kệ Sách Đa Năng 5 Tầng',      gia: 2900000,  giaGoc: 3500000,  ton: 22, dm: 4, anh: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=500',      moTa: 'Gỗ công nghiệp phủ veneer, chịu tải tốt, lắp ráp dễ dàng.' },
  ];

  for (const p of products) {
    await query(`
      IF NOT EXISTS (SELECT 1 FROM SanPham WHERE TenSP = @ten)
      INSERT INTO SanPham (TenSP, GiaBan, GiaGoc, SLTon, MaDM, HinhAnh, MoTa)
      VALUES (@ten, @gia, @giaGoc, @ton, @dm, @anh, @moTa)
    `, {
      ten:    { type: sql.NVarChar(200),    value: p.ten },
      gia:    { type: sql.Decimal(18, 2),    value: p.gia },
      giaGoc: { type: sql.Decimal(18, 2),    value: p.giaGoc },
      ton:    { type: sql.Int,               value: p.ton },
      dm:     { type: sql.Int,               value: p.dm },
      anh:    { type: sql.NVarChar(500),     value: p.anh },
      moTa:   { type: sql.NVarChar(sql.MAX), value: p.moTa },
    });
  }
  console.log('✅ SanPham (16 sản phẩm)');

  // 5. GioHang
  const uList  = await query(`SELECT TOP 3 MaND FROM NguoiDung WHERE MaVaiTro = 2 ORDER BY MaND`);
  const spList = await query(`SELECT TOP 6 MaSP FROM SanPham ORDER BY MaSP`);
  const ul = uList.recordset;
  const sl = spList.recordset;

  if (ul.length >= 2 && sl.length >= 4) {
    const cartItems = [
      { maND: ul[0].MaND, maSP: sl[0].MaSP, soLuong: 1 },
      { maND: ul[0].MaND, maSP: sl[3].MaSP, soLuong: 2 },
      { maND: ul[1].MaND, maSP: sl[1].MaSP, soLuong: 1 },
      { maND: ul[1].MaND, maSP: sl[4].MaSP, soLuong: 1 },
      { maND: ul[2]?.MaND || ul[0].MaND, maSP: sl[2].MaSP, soLuong: 3 },
    ];
    for (const item of cartItems) {
      await query(`
        IF NOT EXISTS (SELECT 1 FROM GioHang WHERE MaND = @maND AND MaSP = @maSP)
        INSERT INTO GioHang (MaND, MaSP, SoLuong) VALUES (@maND, @maSP, @sl)
      `, {
        maND: { type: sql.Int, value: item.maND },
        maSP: { type: sql.Int, value: item.maSP },
        sl:   { type: sql.Int, value: item.soLuong },
      });
    }
    console.log('✅ GioHang (5 mục giỏ hàng mẫu)');
  }

  // 6. DonHang + ChiTietDonHang
  const spFull = await query(`SELECT TOP 8 MaSP, GiaBan FROM SanPham ORDER BY MaSP`);
  const uFull  = await query(`SELECT TOP 4 MaND FROM NguoiDung WHERE MaVaiTro = 2 ORDER BY MaND`);
  const sf = spFull.recordset;
  const uf = uFull.recordset;

  if (sf.length >= 4 && uf.length >= 2) {
    const orders = [
      { maND: uf[0].MaND, diaChi: '12 Le Loi, Ben Nghe, Q1, TP.HCM | SDT: 0901111111', trangThai: 'completed',  items: [{ maSP: sf[0].MaSP, sl: 1, gia: sf[0].GiaBan }, { maSP: sf[3].MaSP, sl: 2, gia: sf[3].GiaBan }] },
      { maND: uf[0].MaND, diaChi: '12 Le Loi, Ben Nghe, Q1, TP.HCM | SDT: 0901111111', trangThai: 'processing', items: [{ maSP: sf[1].MaSP, sl: 1, gia: sf[1].GiaBan }] },
      { maND: uf[1].MaND, diaChi: '45 Tran Hung Dao, Hoan Kiem, Ha Noi | SDT: 0902222222', trangThai: 'pending',    items: [{ maSP: sf[2].MaSP, sl: 1, gia: sf[2].GiaBan }, { maSP: sf[4]?.MaSP || sf[0].MaSP, sl: 1, gia: sf[4]?.GiaBan || sf[0].GiaBan }] },
      { maND: uf[1].MaND, diaChi: '45 Tran Hung Dao, Hoan Kiem, Ha Noi | SDT: 0902222222', trangThai: 'cancelled',  items: [{ maSP: sf[5]?.MaSP || sf[0].MaSP, sl: 2, gia: sf[5]?.GiaBan || sf[0].GiaBan }] },
      { maND: uf[2]?.MaND || uf[0].MaND, diaChi: '78 Nguyen Hue, Hai Chau, Da Nang | SDT: 0903333333', trangThai: 'completed',  items: [{ maSP: sf[6]?.MaSP || sf[1].MaSP, sl: 1, gia: sf[6]?.GiaBan || sf[1].GiaBan }] },
      { maND: uf[3]?.MaND || uf[1].MaND, diaChi: '99 Pham Van Dong, Binh Thanh, TP.HCM | SDT: 0904444444', trangThai: 'processing', items: [{ maSP: sf[0].MaSP, sl: 1, gia: sf[0].GiaBan }, { maSP: sf[2].MaSP, sl: 1, gia: sf[2].GiaBan }] },
    ];

    for (const order of orders) {
      const tongTien = order.items.reduce((s, i) => s + i.gia * i.sl, 0);
      const res = await query(`
        INSERT INTO DonHang (MaND, NgayDat, TrangThai, TongTien, DiaChiGH)
        OUTPUT INSERTED.MaDH
        VALUES (@maND, GETDATE(), @tt, @tong, @dc)
      `, {
        maND: { type: sql.Int,           value: order.maND },
        tt:   { type: sql.NVarChar(50),  value: order.trangThai },
        tong: { type: sql.Decimal(18,2), value: tongTien },
        dc:   { type: sql.NVarChar(500), value: order.diaChi },
      });
      const maDH = res.recordset[0].MaDH;
      for (const item of order.items) {
        await query(`
          INSERT INTO ChiTietDonHang (MaDH, MaSP, SoLuong, DonGia)
          VALUES (@maDH, @maSP, @sl, @gia)
        `, {
          maDH: { type: sql.Int,           value: maDH },
          maSP: { type: sql.Int,           value: item.maSP },
          sl:   { type: sql.Int,           value: item.sl },
          gia:  { type: sql.Decimal(18,2), value: item.gia },
        });
      }
    }
    console.log('✅ DonHang (6 đơn — đủ 4 trạng thái)');
  }

  // 7. DanhGia
  const ruList = await query(`SELECT TOP 3 MaND FROM NguoiDung WHERE MaVaiTro = 2 ORDER BY MaND`);
  const rsList = await query(`SELECT TOP 5 MaSP FROM SanPham ORDER BY MaSP`);
  const ru = ruList.recordset;
  const rs = rsList.recordset;

  if (ru.length >= 2 && rs.length >= 3) {
    const reviews = [
      { maND: ru[0].MaND, maSP: rs[0].MaSP, soSao: 5, nd: 'San pham rat dep, chat luong tot, giao hang nhanh!' },
      { maND: ru[0].MaND, maSP: rs[2].MaSP, soSao: 4, nd: 'Hang dung mo ta, lap rap de dang. Rat hai long.' },
      { maND: ru[1].MaND, maSP: rs[0].MaSP, soSao: 4, nd: 'Sofa em va dep, mau sac dung nhu anh.' },
      { maND: ru[1].MaND, maSP: rs[1].MaSP, soSao: 5, nd: 'Giuong rat chac chan, ngan keo tien loi.' },
      { maND: ru[2]?.MaND || ru[0].MaND, maSP: rs[3].MaSP, soSao: 3, nd: 'San pham tam on, giao hang hoi cham.' },
      { maND: ru[2]?.MaND || ru[1].MaND, maSP: rs[4].MaSP, soSao: 5, nd: 'Chat luong vuot mong doi, se ung ho tiep!' },
    ];
    for (const r of reviews) {
      await query(`
        IF NOT EXISTS (SELECT 1 FROM DanhGia WHERE MaND = @maND AND MaSP = @maSP)
        INSERT INTO DanhGia (MaND, MaSP, SoSao, NoiDung, NgayDG)
        VALUES (@maND, @maSP, @soSao, @nd, GETDATE())
      `, {
        maND:  { type: sql.Int,               value: r.maND },
        maSP:  { type: sql.Int,               value: r.maSP },
        soSao: { type: sql.Int,               value: r.soSao },
        nd:    { type: sql.NVarChar(sql.MAX), value: r.nd },
      });
    }
    console.log('✅ DanhGia (6 đánh giá mẫu)');
  }

  console.log('\n🎉 Seed dữ liệu hoàn tất!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Tài khoản test:');
  console.log('   Admin:   admin@gmail.com        / admin123');
  console.log('   Khach 1: nguyenvanan@gmail.com  / 123456');
  console.log('   Khach 2: tranthibich@gmail.com  / 123456');
  console.log('   Khach 3: leminhtuan@gmail.com   / 123456');
  console.log('   Khach 4: phamthuhuong@gmail.com / 123456');
  console.log('   Khach 5: hoangvandung@gmail.com / 123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Du lieu da tao:');
  console.log('   • 2  vai tro');
  console.log('   • 6  nguoi dung');
  console.log('   • 4  danh muc');
  console.log('   • 16 san pham');
  console.log('   • 5  gio hang');
  console.log('   • 6  don hang (du 4 trang thai)');
  console.log('   • 6  danh gia san pham');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

(async () => {
  await connectDB();
  await seed();
  await closeDB();
})();