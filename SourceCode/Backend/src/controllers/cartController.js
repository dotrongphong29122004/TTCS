const { sql, query } = require('../../config/db');

const getCart = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT gh.MaGH,gh.MaSP,gh.SoLuong,sp.TenSP,sp.GiaBan,sp.HinhAnh,sp.SLTon,dm.TenDM AS DanhMuc
       FROM GioHang gh JOIN SanPham sp ON gh.MaSP=sp.MaSP JOIN DanhMuc dm ON sp.MaDM=dm.MaDM
       WHERE gh.MaND=@maND`,
      { maND: { type: sql.Int, value: req.user.MaND } }
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

const addToCart = async (req, res, next) => {
  try {
    const { MaSP, SoLuong = 1 } = req.body;
    const { MaND } = req.user;
    const stock = await query('SELECT SLTon FROM SanPham WHERE MaSP=@maSP',
      { maSP: { type: sql.Int, value: MaSP } });
    if (!stock.recordset.length)
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    if (stock.recordset[0].SLTon < SoLuong)
      return res.status(400).json({ success: false, message: 'Số lượng sản phẩm không đủ' });

    const existing = await query('SELECT MaGH FROM GioHang WHERE MaND=@maND AND MaSP=@maSP',
      { maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:MaSP} });
    if (existing.recordset.length)
      await query('UPDATE GioHang SET SoLuong=SoLuong+@sl WHERE MaND=@maND AND MaSP=@maSP',
        { sl:{type:sql.Int,value:SoLuong}, maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:MaSP} });
    else
      await query('INSERT INTO GioHang (MaND,MaSP,SoLuong) VALUES (@maND,@maSP,@sl)',
        { maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:MaSP}, sl:{type:sql.Int,value:SoLuong} });
    res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
  } catch (err) { next(err); }
};

const updateQuantity = async (req, res, next) => {
  try {
    const { SoLuong } = req.body;
    if (SoLuong <= 0) return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    await query('UPDATE GioHang SET SoLuong=@sl WHERE MaND=@maND AND MaSP=@maSP',
      { sl:{type:sql.Int,value:SoLuong}, maND:{type:sql.Int,value:req.user.MaND}, maSP:{type:sql.Int,value:parseInt(req.params.productId)} });
    res.json({ success: true, message: 'Cập nhật giỏ hàng thành công' });
  } catch (err) { next(err); }
};

const removeItem = async (req, res, next) => {
  try {
    await query('DELETE FROM GioHang WHERE MaND=@maND AND MaSP=@maSP',
      { maND:{type:sql.Int,value:req.user.MaND}, maSP:{type:sql.Int,value:parseInt(req.params.productId)} });
    res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (err) { next(err); }
};

const clearCart = async (req, res, next) => {
  try {
    await query('DELETE FROM GioHang WHERE MaND=@maND',
      { maND: { type: sql.Int, value: req.user.MaND } });
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (err) { next(err); }
};

module.exports = { getCart, addToCart, updateQuantity, removeItem, clearCart };