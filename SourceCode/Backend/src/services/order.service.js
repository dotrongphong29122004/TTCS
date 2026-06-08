const groupOrders = (records) => {
  const map = {};
  records.forEach(r => {
    if (!map[r.MaDH]) map[r.MaDH] = {
      MaDH:r.MaDH, NgayDat:r.NgayDat, TongTien:r.TongTien,
      TrangThai:r.TrangThai, DiaChiGH:r.DiaChiGH,
      TenKH:r.TenKH, Email:r.Email, items:[]
    };
    map[r.MaDH].items.push({ MaSP:r.MaSP, TenSP:r.TenSP, HinhAnh:r.HinhAnh, SoLuong:r.SoLuong, DonGia:r.DonGia });
  });
  return Object.values(map);
};

const calcShipping = (subtotal) => subtotal >= 5000000 ? 0 : 200000;

module.exports = { groupOrders, calcShipping };