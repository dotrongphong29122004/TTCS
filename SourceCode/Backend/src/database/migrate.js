require('dotenv').config();
const { connectDB, query, closeDB } = require('../../config/db');

const createTables = async () => {
  console.log(' Bắt đầu tạo bảng...\n');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VaiTro' AND xtype='U')
    CREATE TABLE VaiTro (MaVT INT PRIMARY KEY IDENTITY(1,1), TenVT NVARCHAR(50) NOT NULL)`);
  console.log(' VaiTro');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NguoiDung' AND xtype='U')
    CREATE TABLE NguoiDung (
      MaND INT PRIMARY KEY IDENTITY(1,1), HoTen NVARCHAR(100),
      MatKhau NVARCHAR(255) NOT NULL, Email NVARCHAR(100) NOT NULL UNIQUE,
      SDT NVARCHAR(20), DiaChi NVARCHAR(500), MaVaiTro INT NOT NULL DEFAULT 2,
      FOREIGN KEY (MaVaiTro) REFERENCES VaiTro(MaVT))`);
  console.log(' NguoiDung');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DanhMuc' AND xtype='U')
    CREATE TABLE DanhMuc (MaDM INT PRIMARY KEY IDENTITY(1,1), TenDM NVARCHAR(100) NOT NULL, MoTa NTEXT)`);
  console.log(' DanhMuc');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SanPham' AND xtype='U')
    CREATE TABLE SanPham (
      MaSP INT PRIMARY KEY IDENTITY(1,1), MaDM INT NOT NULL, TenSP NVARCHAR(200) NOT NULL,
      GiaBan DECIMAL(18,2) NOT NULL, GiaGoc DECIMAL(18,2), SLTon INT DEFAULT 0,
      HinhAnh NVARCHAR(500), MoTa NTEXT, FOREIGN KEY (MaDM) REFERENCES DanhMuc(MaDM))`);
  console.log(' SanPham');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DanhGia' AND xtype='U')
    CREATE TABLE DanhGia (
      MaDG INT PRIMARY KEY IDENTITY(1,1), MaND INT NOT NULL, MaSP INT NOT NULL,
      SoSao INT NOT NULL CHECK (SoSao BETWEEN 1 AND 5), NoiDung NTEXT, NgayDG DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
      FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP) ON DELETE CASCADE,
      UNIQUE (MaND, MaSP))`);
  console.log(' DanhGia');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GioHang' AND xtype='U')
    CREATE TABLE GioHang (
      MaGH INT PRIMARY KEY IDENTITY(1,1), MaND INT NOT NULL, MaSP INT NOT NULL, SoLuong INT NOT NULL DEFAULT 1,
      FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
      FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP), UNIQUE (MaND, MaSP))`);
  console.log(' GioHang');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DonHang' AND xtype='U')
    CREATE TABLE DonHang (
      MaDH INT PRIMARY KEY IDENTITY(1,1), MaND INT NOT NULL, NgayDat DATETIME DEFAULT GETDATE(),
      TrangThai NVARCHAR(50) DEFAULT 'pending', TongTien DECIMAL(18,2) NOT NULL, DiaChiGH NVARCHAR(500),
      FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND))`);
  console.log(' DonHang');

  await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChiTietDonHang' AND xtype='U')
    CREATE TABLE ChiTietDonHang (
      MaDH INT NOT NULL, MaSP INT NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(18,2) NOT NULL,
      PRIMARY KEY (MaDH, MaSP),
      FOREIGN KEY (MaDH) REFERENCES DonHang(MaDH) ON DELETE CASCADE,
      FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP))`);
  console.log(' ChiTietDonHang');

  console.log('\n Tạo toàn bộ 8 bảng hoàn tất!');
};

(async () => { await connectDB(); await createTables(); await closeDB(); })();