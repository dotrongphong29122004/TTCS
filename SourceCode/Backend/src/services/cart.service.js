const { sql, query } = require('../../config/db');

const getCartByUser = async (maND) => {
  const result = await query(
    `SELECT gh.MaGH,gh.MaSP,gh.SoLuong,sp.TenSP,sp.GiaBan,sp.GiaGoc,sp.HinhAnh,sp.SLTon,dm.TenDM AS DanhMuc
     FROM GioHang gh JOIN SanPham sp ON gh.MaSP=sp.MaSP JOIN DanhMuc dm ON sp.MaDM=dm.MaDM WHERE gh.MaND=@maND`,
    { maND: { type: sql.Int, value: maND } }
  );
  return result.recordset;
};

const calcCartTotal = (items) => {
  const subtotal = items.reduce((sum, i) => sum + i.GiaBan * i.SoLuong, 0);
  const shipping  = subtotal >= 5000000 ? 0 : 200000;
  return { subtotal, shipping, total: subtotal + shipping };
};

module.exports = { getCartByUser, calcCartTotal };